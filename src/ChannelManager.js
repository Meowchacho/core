'use strict';

/**
 * Contains registered channels
 *
 * TODO: should probably refactor this to just extend `Map`
 */
class ChannelManager {
  static channels = new Map();
  /**
   * @param {string} name Channel name
   * @return {Channel}
   */
  static get(name) {
    return this.channels.get(name);
  }

  /**
   * @param {Channel} channel
   */
  static add(channel) {
    this.channels.set(channel.name, channel);
    if (channel.aliases) {
      channel.aliases.forEach(alias => this.channels.set(alias, channel));
    }
  }

  /**
   * @param {Channel} channel
   */
  static remove(channel) {
   this.channels.delete(channel.name);
  }

  /**
   * @param {string} search
   * @return {Channel}
   */
  static find(search) {
    for (const [ name, channel ] of this.channels.entries()) {
      if (name.indexOf(search) === 0) {
        return channel;
      }
    }
  }
}

module.exports = ChannelManager;
