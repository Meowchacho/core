'use strict';

const ansi = require('sty');
const Logger = require('./Logger')

ansi.enable(); // force ansi on even when there isn't a tty for the server
const wrap = require('wrap-ansi');
const ChannelManager = require('./ChannelManager');

/** @typedef {{getBroadcastTargets: function(): Array}} */
var Broadcastable;

/**
 * Class used for sending text to the player. All output to the player should happen through this
 * class.
 */
class Broadcast {
  /**
   * @param {Broadcastable} source Target to send the broadcast to
   * @param {string} message
   * @param {number|boolean} wrapWidth=false width to wrap the message to or don't wrap at all
   * @param {boolean} useColor Whether to parse color tags in the message
   * @param {?function(target, message): string} formatter=null Function to call to format the
   *   message to each target
   */
  static at(type, source, message = '', prefix = '',suffix ='', wrapWidth = false, useColor = true) {
    if (!Broadcast.isBroadcastable(source)) {
      throw new Error(`Tried to broadcast message to non-broadcastable object: MESSAGE [${message}]`);
    }

    useColor = typeof useColor === 'boolean' ? useColor : true;
    message = Broadcast._fixNewlines(message);

    for (const target of source.getBroadcastTargets()) {
      if (!target.socket || !target.socket.writable) {
        continue;
      }

      if (target.socket._prompted) {
        target.socket.write('\r\n');
        target.socket._prompted = false;
      }

      if (target.isPc && target.channelColors) {
        Logger.verbose(`Broadcasting ${type} to a PC with color preferences`);
        let prefixColor = null;
        let messageColor = null; 
        
        if(target.channelColors.get(type)) {
          prefixColor = target.channelColors.get(type).get("pre");
          messageColor = target.channelColors.get(type).get("msg");
        }
        if (!prefixColor && ChannelManager.get(type)) {
          prefixColor = ChannelManager.get(type).prefixColor || null
        }
        if (!messageColor && ChannelManager.get(type)) {
          messageColor = ChannelManager.get(type).messageColor || null
        }

        prefix = this.colorify(prefix, prefixColor);
        message = this.colorify(message, messageColor);
        suffix = this.colorify(suffix, prefixColor); //Suffix color is the same as prefix color damnit
      }

      let completeMessage = `${prefix}${message}${suffix}`;
      let targetMessage = wrapWidth ? Broadcast.wrap(completeMessage, wrapWidth) : ansi.parse(completeMessage);
      target.socket.write(targetMessage);
    }
  }

  /**
   * Broadcast.at for all except given list of players
   * @see {@link Broadcast#at}
   * @param {Broadcastable} source
   * @param {string} message
   * @param {Array<Player>} excludes
   * @param {number|boolean} wrapWidth
   * @param {boolean} useColor
   * @param {function} formatter
   */
  static atExcept(type, source, excludes, message, prefix, suffix, wrapWidth, useColor) {
    if (!Broadcast.isBroadcastable(source)) {
      throw new Error(`Tried to broadcast message to non-broadcastable object: MESSAGE [${message}]`);
    }
    // Could be an array or a single target.
    excludes = [].concat(excludes);

    const targets = source.getBroadcastTargets()
      .filter(target => !excludes.includes(target));

    const newSource = {
      getBroadcastTargets: () => targets
    };

    Broadcast.at(type,newSource, message, prefix, suffix, wrapWidth, useColor);
  }

  /**
   * `Broadcast.at` with a newline
   * @see {@link Broadcast#at}
   */
  static sayAt(type, source, message, prefix, suffix, wrapWidth, useColor) {
    Broadcast.at(type, source, message, prefix, suffix  + '\r\n', wrapWidth, useColor);
  }

  /**
   * `Broadcast.atExcept` with a newline
   * @see {@link Broadcast#atExcept}
   */
  static sayAtExcept(type, source, excludes, message, prefix, suffix, wrapWidth, useColor) {
    Broadcast.atExcept(type, source, excludes, message, prefix, suffix  + '\r\n', wrapWidth, useColor);
  }

  /**
   * Render the player's prompt including any extra prompts
   * @param {Player} player
   * @param {object} extra     extra data to avail to the prompt string interpolator
   * @param {number} wrapWidth
   * @param {boolean} useColor
   */
  static prompt(player, extra, wrapWidth, useColor) {
    player.socket._prompted = false;
    Broadcast.at('prompt',player,'','\r\n' + player.interpolatePrompt(player.prompt, extra) + ' ', wrapWidth, useColor);
    let needsNewline = player.extraPrompts.size > 0;
    if (needsNewline) {
      Broadcast.sayAt('prompt',player);
    }

    for (const [id, extraPrompt] of player.extraPrompts) {
      Broadcast.sayAt('prompt', player, extraPrompt.renderer(), '', wrapWidth, useColor);
      if (extraPrompt.removeOnRender) {
        player.removePrompt(id);
      }
    }

    if (needsNewline) {
      Broadcast.at('prompt',player, '> ');
    }

    player.socket._prompted = true;
    if (player.socket.writable) {
      player.socket.command('goAhead');
    }
  }

  /**
   * Generate an ASCII art progress bar
   * @param {number} width Max width
   * @param {number} percent Current percent
   * @param {string} color
   * @param {string} barChar Character to use for the current progress
   * @param {string} fillChar Character to use for the rest
   * @param {string} delimiters Characters to wrap the bar in
   * @return {string}
   */
  static progress(width, percent, color, barChar = "#", fillChar = " ", delimiters = "()") {
    percent = Math.max(0, percent);
    width -= 3; // account for delimiters and tip of bar
    if (percent === 100) {
        width++; // 100% bar doesn't have a second right delimiter
    }
    barChar = barChar[0];
    fillChar = fillChar[0];
    const [ leftDelim, rightDelim ] = delimiters;
    const openColor = `<${color}>`;
    const closeColor = `</${color}>`;
    let buf = openColor + leftDelim + "<bold>";
    const widthPercent = Math.round((percent / 100) * width);
    buf += Broadcast.line(widthPercent, barChar) + (percent === 100 ? '' : rightDelim);
    buf += Broadcast.line(width - widthPercent, fillChar);
    buf += "</bold>" + rightDelim + closeColor;
    return buf;
  }

  /**
   * Center a string in the middle of a given width
   * @param {number} width
   * @param {string} message
   * @param {string} color
   * @param {?string} fillChar Character to pad with, defaults to ' '
   * @return {string}
   */
  static center(width, message, color, fillChar = " ") {
    const padWidth = width / 2 - message.length / 2;
    let openColor = '';
    let closeColor = '';
    if (color) {
      openColor = `<${color}>`;
      closeColor = `</${color}>`;
    }

    return (
      openColor +
      Broadcast.line(Math.floor(padWidth), fillChar) +
      message +
      Broadcast.line(Math.ceil(padWidth), fillChar) +
      closeColor
    );
  }

  /**
   * Render a line of a specific width/color
   * @param {number} width
   * @param {string} fillChar
   * @param {?string} color
   * @return {string}
   */
  static line(width, fillChar = "-", color = null) {
    let openColor = '';
    let closeColor = '';
    if (color) {
      openColor = `<${color}>`;
      closeColor = `</${color}>`;
    }
    return openColor + (new Array(width + 1)).join(fillChar) + closeColor;
  }

  /**
   * Wrap a message to a given width. Note: Evaluates color tags
   * @param {string}  message
   * @param {?number} width   Defaults to 80
   * @return {string}
   */
  static wrap(message, width = 80) {
    return Broadcast._fixNewlines(wrap(ansi.parse(message), width));
  }

  /**
   * Indent all lines of a given string by a given amount
   * @param {string} message
   * @param {number} indent
   * @return {string}
   */
  static indent(message, indent) {
    message = Broadcast._fixNewlines(message);
    const padding = Broadcast.line(indent, ' ');
    return padding + message.replace(/\r\n/g, '\r\n' + padding);
  }

  /**
   * Fix LF unpaired with CR for windows output
   * @param {string} message
   * @return {string}
   * @private
   */
  static _fixNewlines(message) {
    // Fix \n not in a \r\n pair to prevent bad rendering on windows
    message = message.replace(/\r\n/g, '<NEWLINE>').split('\n');
    message = message.join('\r\n').replace(/<NEWLINE>/g, '\r\n');
    // fix sty's incredibly stupid default of always appending ^[[0m
    return message.replace(/\x1B\[0m$/, '');
  }

  static isBroadcastable(source) {
    return source && typeof source.getBroadcastTargets === 'function';
  }

  static colorify(message, color) {
    if (!color || !message) {
      return message;
    }

    const colors = Array.isArray(color) ? color : [color];
    const open = colors.map(colorO => `<${colorO}>`).join('');
    const close = colors.reverse().map(colorC => `</${colorC}>`).join('');

    return open + message + close;
  }
}

module.exports = Broadcast;
