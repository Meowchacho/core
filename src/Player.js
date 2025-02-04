'use strict';

const Attributes = require('./Attributes');
const Character = require('./Character');
const CommandQueue = require('./CommandQueue');
const Config = require('./Config');
const Data = require('./Data');
const QuestTracker = require('./QuestTracker');
const Room = require('./Room');
const Logger = require('./Logger');
const PlayerRoles = require('./PlayerRoles');
const v8 = require('v8');
const PlayerDescription = require('./PlayerDescription');

/**
 * @property {Account} account
 * @property {number}  experience current experience this level
 * @property {string}  password
 * @property {string}  prompt     default prompt string
 * @property {net.Socket} socket
 * @property {QuestTracker} questTracker
 * @property {Map<string,function ()>} extraPrompts Extra prompts to render after the default prompt
 * @property {{completed: Array, active: Array}} questData
 * @extends Character
 */
class Player extends Character {
  constructor(data) {
    super(data);

    this.account = data.account || null;
    this.experience = data.experience || 0;
    this.extraPrompts = new Map();
    this.password = data.password;
    this.prompt = data.prompt || '> ';
    this.socket = data.socket || null;
    const questData = Object.assign({
      completed: [],
      active: []
    }, data.quests);

    this.questTracker = new QuestTracker(this, questData.active, questData.completed);
    this.commandQueue = new CommandQueue();
    this.role = data.role || PlayerRoles.PLAYER;
    this.channelColors = new Map(Object.entries(data.channelColors?data.channelColors:new Map())); //JSON.parse(JSON.stringify(data.channelColors));
    this.description = new PlayerDescription(data.description);// Map(Object.entries(data.description?data.description:new Map()));
    // Default max inventory size config
    if (!isFinite(this.inventory.getMax())) {
      this.inventory.setMax(Config.get('defaultMaxPlayerInventory') || 20);
    }
  }

  /**
   * @see CommandQueue::enqueue
   */
  queueCommand(executable, lag) {
    const index = this.commandQueue.enqueue(executable, lag);
    this.emit('commandQueued', index);
  }

  /**
   * Proxy all events on the player to the quest tracker
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    if (this.__pruned || !this.__hydrated) {
      return;
    }

    super.emit(event, ...args);

    this.questTracker.emit(event, ...args);
  }

  /**
   * Convert prompt tokens into actual data
   * @param {string} promptStr
   * @param {object} extraData Any extra data to give the prompt access to
   */
  interpolatePrompt(promptStr, extraData = {}) {
    let attributeData = {};
    for (const [attr, value] of this.attributes) {
      attributeData[attr] = {
        current: this.getAttribute(attr),
        max: this.getMaxAttribute(attr),
        base: this.getBaseAttribute(attr),
      };
    }
    const promptData = Object.assign(attributeData, extraData);

    let matches = null;
    while (matches = promptStr.match(/%([a-z\.]+)%/)) {
      const token = matches[1];
      let promptValue = token.split('.').reduce((obj, index) => obj && obj[index], promptData);
      if (promptValue === null || promptValue === undefined) {
        promptValue = 'invalid-token';
      }
      promptStr = promptStr.replace(matches[0], promptValue);
    }

    return promptStr;
  }

  /**
   * Add a line of text to be displayed immediately after the prompt when the prompt is displayed
   * @param {string}      id       Unique prompt id
   * @param {function ()} renderer Function to call to render the prompt string
   * @param {?boolean}    removeOnRender When true prompt will remove itself once rendered
   *    otherwise prompt will continue to be rendered until removed.
   */
  addPrompt(id, renderer, removeOnRender = false) {
    this.extraPrompts.set(id, { removeOnRender, renderer });
  }

  /**
   * @param {string} id
   */
  removePrompt(id) {
    this.extraPrompts.delete(id);
  }

  /**
   * @param {string} id
   * @return {boolean}
   */
  hasPrompt(id) {
    return this.extraPrompts.has(id);
  }

  /**
   * Move the player to the given room, emitting events appropriately
   * @param {Room} nextRoom
   * @param {function} onMoved Function to run after the player is moved to the next room but before enter events are fired
   * @fires Room#playerLeave
   * @fires Room#playerEnter
   * @fires Player#enterRoom
   */
  moveTo(nextRoom, onMoved = _ => _) {
    const prevRoom = this.room;
    if (this.room && this.room !== nextRoom) {
      /**
       * @event Room#playerLeave
       * @param {Player} player
       * @param {Room} nextRoom
       */
      this.room.emit('playerLeave', this, nextRoom);
      this.room.removePlayer(this);
    }

    this.room = nextRoom;
    nextRoom.addPlayer(this);

    onMoved();

    /**
     * @event Room#playerEnter
     * @param {Player} player
     * @param {Room} prevRoom
     */
    nextRoom.emit('playerEnter', this, prevRoom);
    /**
     * @event Player#enterRoom
     * @param {Room} room
     */
    this.emit('enterRoom', nextRoom);
  }
/**
 * 
 * @param {String} channel to set
 * @param {String} part of that channel (prefix or message)
 * @param {String} color to set that channel + part to
 */
  setChannelColor(channel, part, color) {
    if (!this.channelColors.get(channel)) {
      this.channelColors.set(channel, {'pre':null,'msg':null} );
    }
    if (part == "prefix") {
      part = "pre"
    }
    else {
      part = "msg"
    }
    this.channelColors.get(channel)[part] = color;
  }

  save(callback) {
    if (!this.__hydrated) {
      return;
    }

    this.emit('save', callback);
  }

  hydrate(state) {
    super.hydrate(state);

    // QuestTracker has to be hydrated before the rest otherwise events fired by the subsequent
    // hydration will be emitted onto unhydrated quest objects and error
    this.questTracker.hydrate(state);

    if (typeof this.account === 'string') {
      this.account = state.AccountManager.getAccount(this.account);
    }

    // Hydrate inventory
    this.inventory.hydrate(state, this);

    // Hydrate equipment
    // maybe refactor Equipment to be an object like Inventory?
    if (this.equipment && !(this.equipment instanceof Map)) {
      const eqDefs = this.equipment;
      this.equipment = new Map();
      for (const slot in eqDefs) {
        const itemDef = eqDefs[slot];
        try {
          let newItem = state.ItemFactory.create(state.AreaManager.getArea(itemDef.area), itemDef.entityReference);
          newItem.initializeInventory(itemDef.inventory);
          newItem.hydrate(state, itemDef);
          state.ItemManager.add(newItem);
          this.equip(newItem, slot);
        } catch (e) {
          Logger.error(e.message);
        }
      }
    } else {
      this.equipment = new Map();
    }

    if (typeof this.room === 'string') {
      let room = state.RoomManager.getRoom(this.room);
      if (!room) {
        Logger.error(`ERROR: Player ${this.name} was saved to invalid room ${this.room}.`);
        room = state.AreaManager.getPlaceholderArea().getRoomById('placeholder');
      }

      this.room = room;
      this.moveTo(room);
    }

  }

  serialize() {
    let data = Object.assign(super.serialize(), {
      account: this.account.username,
      experience: this.experience,
      inventory: this.inventory && this.inventory.serialize(),
      metadata: this.metadata,
      password: this.password,
      prompt: this.prompt,
      quests: this.questTracker.serialize(),
      role: this.role,
      description: this.description.serialize()
    });

    if (this.equipment instanceof Map) {
      let eq = {};
      for (let [slot, item] of this.equipment) {
        eq[slot] = item.serialize();
      }
      data.equipment = eq;
    } else {
      data.equipment = null;
    }

    if (this.channelColors instanceof Map) {
      data.channelColors = v8.deserialize(v8.serialize(this.channelColors));
    }
    else {
      data.channelColors = null
    }

    return data;
  }

  get isPc() {
    return true;
  }
}

module.exports = Player;
