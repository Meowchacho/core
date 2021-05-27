'use strict';
const Broadcast = require('./Broadcast');

class BroadcastCommand extends Broadcast {
    static at(source, message = '', prefix = '', suffix = '', wrapWidth = false, useColor = true) {
        super.at('command', source, message, prefix, suffix, wrapWidth, useColor);
    }
    static atExcept(source, excludes, message, prefix, suffix = '',wrapWidth, useColor) {
        super.atExcept('command', source,excludes, message, prefix, suffix, wrapWidth, useColor);
    }
    static sayAt(source, message, prefix, suffix = '', wrapWidth, useColor) {
        super.sayAt('command', source, message, prefix, suffix, wrapWidth, useColor);
    }
    static sayAtExcept(source, excludes, message, prefix, suffix = '', wrapWidth, useColor) {
        super.sayAtExcept('command', source, excludes, message, prefix, suffix, wrapWidth, useColor);
    }
}
module.exports = BroadcastCommand;
