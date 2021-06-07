'use strict';
const Broadcast = require('./Broadcast');

class BroadcastEmote extends Broadcast {
    static at(source, message = '', prefix = '', suffix = '', wrapWidth = false, useColor = true) {
        super.at('emote', source, message, prefix, suffix, wrapWidth, useColor);
    }
    static atExcept(source, excludes, message, prefix, suffix = '',wrapWidth, useColor) {
        super.atExcept('emote', source,excludes, message, prefix, suffix, wrapWidth, useColor);
    }
    static sayAt(source, message, prefix, suffix = '', wrapWidth, useColor) {
        super.sayAt('emote', source, message, prefix, suffix, wrapWidth, useColor);
    }
    static sayAtExcept(source, excludes, message, prefix, suffix = '', wrapWidth, useColor) {
        super.sayAtExcept('emote', source, excludes, message, prefix, suffix, wrapWidth, useColor);
    }
}
module.exports = BroadcastEmote;
