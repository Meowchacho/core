'use strict';

const colors = require('./Colors');

/**
 * Helper methods for colored output during input-events
 */
class EventUtil {
  /**
   * Generate a function for writing colored output to a socket
   * @param {net.Socket} socket
   * @return {function (string)}
   */
  static genWrite(socket) {
    return string => socket.write(string);
  }

  /**
   * Generate a function for writing colored output to a socket with a newline
   * @param {net.Socket} socket
   * @return {function (string)}
   */
  static genSay(socket) {
    return string => socket.write(string + '\r\n');
  }
}

module.exports = EventUtil;
