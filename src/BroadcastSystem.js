'use strict';
const Broadcast = require('./Broadcast');

class BroadcastSystem extends Broadcast {
    static at(source, message = '', prefix = '', suffix = '', wrapWidth = false, useColor = true) {
        super.at('system', source, message, prefix, suffix, wrapWidth, useColor);
    }
    static atExcept(source, excludes, message, prefix, suffix = '',wrapWidth, useColor) {
        super.atExcept('system', source,excludes, message, prefix, suffix, wrapWidth, useColor);
    }
    static sayAt(source, message, prefix, suffix = '', wrapWidth, useColor) {
        super.sayAt('system', source, message, prefix, suffix, wrapWidth, useColor);
    }
    static sayAtExcept(source, excludes, message, prefix, suffix = '', wrapWidth, useColor) {
        super.sayAtExcept('system', source, excludes, message, prefix, suffix, wrapWidth, useColor);
    }
}
module.exports = BroadcastSystem;
