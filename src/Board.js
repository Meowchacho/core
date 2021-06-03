'use strict';

class Board {
    constructor(data) {
        this.audience = data.audience;
        this.title = data.title;
        this.loader = null
        this.id = data.id;
        this.notes = new Map();
    }

    setLoader(loader) {
        this.loader = loader;
    }
    addNote(note) {
        this.notes.set(note.number, note);
        this.loader.update({'id':note.number,'board':note.board}, note.serialize());
    }

    getAllNotes(player) {
        let visibleNotes = new Map();
        this.notes.forEach((note) => {
            if (this.canSeeNote(note, player)) {
                visibleNotes.set(note.number, note);
            }
        });

        return visibleNotes;
    }

    canSeeNote(note, player) {
        if (note.to === 'all') {
            return true;
        }

        return true;
    }

    getNote(number, player) {
        if (this.canSeeNote(this.notes.get(number), player)) {
            return this.notes.get(number);
        }
        return null;
    }
}

module.exports = Board;