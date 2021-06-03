'use strict';

/**
 * Stores references to, and handles distribution of, active areas
 * @property {Map<string,Note>} Notes
 */
class NoteManager {
  constructor() {
    this.notes = new Map();
  }

  /**
   * @param {string} name
   * @return Note
   */
  getNote(Note,number) {
    return this.Notes.get(name);
  }

  /**
   * @param {string} entityRef
   * @return Note
   */
  getNoteByReference(entityRef) {
    const [ name ] = entityRef.split(':');
    return this.getNote(name);
  }

  /**
   * @param {Note} Note
   */
  addNote(Note) {
    this.Notes.set(Note.title, Note);
  }

  /**
   * @param {Note} Note
   */
  removeNote(Note) {
    this.Notes.delete(Note.name);
  }
}

module.exports = NoteManager;
