'use strict';

/**
 * Stores references to, and handles distribution of, active areas
 * @property {Map<string,Board>} boards
 */
class BoardManager {
  constructor() {
    this.boards = new Map();
  }

  /**
   * @param {string} name
   * @return Board
   */
  getBoard(name) {
    return this.boards.get(name);
  }

  /**
   * @param {string} entityRef
   * @return Board
   */
  getBoardByReference(entityRef) {
    const [ name ] = entityRef.split(':');
    return this.getBoard(name);
  }

  /**
   * @param {Board} board
   */
  addBoard(board) {
    this.boards.set(board.title, board);
  }

  /**
   * @param {Board} board
   */
  removeBoard(board) {
    this.boards.delete(board.name);
  }
}

module.exports = BoardManager;
