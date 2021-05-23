'use strict';

const Broadcast = require('./Broadcast');
const WorldAudience = require('./WorldAudience');
const PrivateAudience = require('./PrivateAudience');
const PartyAudience = require('./PartyAudience');

/**
 * @property {ChannelAudience} audience People who receive messages from this channel
 * @property {string} name  Actual name of the channel the user will type
 * @property {string} color Default color. This is purely a helper if you're using default format methods
 * @property {PlayerRoles} minRequiredRole If set only players with the given role or greater can use the channel
 * @property {string} description
 * @property {{sender: function, target: function}} [formatter]
 */
class Channel {
  /**
   * @param {object}  config
   * @param {string} config.name Name of the channel
   * @param {ChannelAudience} config.audience
   * @param {string} [config.description]
   * @param {PlayerRoles} [config.minRequiredRole]
   * @param {string} [config.color]
   * @param {{sender: function, target: function}} [config.formatter]
   */
  constructor(config) {
    if (!config.name) {
      throw new Error("Channels must have a name to be usable.");
    }
    if (!config.audience) {
      throw new Error(`Channel ${config.name} is missing a valid audience.`);
    }

    this.name = config.name;
    this.minRequiredRole = typeof config.minRequiredRole !== 'undefined' ? config.minRequiredRole : null;
    this.description = config.description;
    this.bundle = config.bundle || null; // for debugging purposes, which bundle it came from
    this.audience = config.audience || (new WorldAudience());
    this.prefixColor = config.prefixColor || null;
    this.messageColor = config.messageColor || null;
    this.aliases = config.aliases;
    this.prefixToTarget = config.prefixToTarget;
    this.prefixToSource = config.prefixToSource;
    this.prefixToOthers = config.prefixToOthers;
    this.suffix = config.suffix;
  }
  /**
   * @param {GameState} state
   * @param {Player}    sender
   * @param {string}    message
   * @fires GameEntity#channelReceive
   */
  send(state, sender, message) {
    // If they don't include a message, explain how to use the channel.
    if (!message.length) {
      throw new NoMessageError();
    }
    if (!this.audience) {
      throw new Error(`Channel [${this.name} has invalid audience [${this.audience}]`);
    }

    this.audience.configure({ state, sender, message });
    const targets = this.audience.getBroadcastTargets();

    if (this.audience instanceof PartyAudience && !targets.length) {
      throw new NoPartyError();
    }

    // Allow audience to change message e.g., strip target name.
    message = this.audience.alterMessage(message);

    if (!this.prefixToOthers){
      this.prefixToOthers = '`[${this.name}] ${sender.name}: `';
    }
    if (!this.prefixToSource){
      this.prefixToSource = '`[${this.name}] ${sender.name}: `';
    }
    if (!this.prefixToTarget){
      this.prefixToTarget = '`[${this.name}] ${sender.name}: `';
    }
    if (!this.suffix) {
      this.suffix = '``';
    }

    Broadcast.sayAt(this.name, sender, message, eval(this.prefixToSource), eval(this.suffix));
    // Private channels also send the target player to the formatter
    if (this.audience instanceof PrivateAudience) {
      Broadcast.sayAt(this.name, this.audience, message, eval(this.prefixToTarget), eval(this.suffix));
    }
    else {
      // send to audience targets
      Broadcast.sayAt(this.name, this.audience, message, eval(this.prefixToOthers), eval(this.suffix));
    }
    // strip color tags
    const rawMessage = message.replace(/\<\/?\w+?\>/gm, '');

    for (const target of targets) {
      /**
       * Docs limit this to be for GameEntity (Area/Room/Item) but also applies
       * to NPC and Player
       *
       * @event GameEntity#channelReceive
       * @param {Channel} channel
       * @param {Character} sender
       * @param {string} rawMessage
       */
      target.emit('channelReceive', this, sender, rawMessage);
    }
  }

  describeSelf(sender) {
    Broadcast.sayAt(sender, 'other', '', `\r\nChannel: ${this.name}`);
    Broadcast.sayAt(sender, 'other', '', 'Syntax: ' + this.getUsage());
    if (this.description) {
      Broadcast.sayAt(sender, 'other', '', this.description);
    }
  }

  getUsage() {
    if (this.audience instanceof PrivateAudience) {
      return `${this.name} <target> [message]`;
    }

    return `${this.name} [message]`;
  }
}

class NoPartyError extends Error { }
class NoRecipientError extends Error { }
class NoMessageError extends Error { }

module.exports = {
  Channel,
  NoPartyError,
  NoRecipientError,
  NoMessageError,
};
