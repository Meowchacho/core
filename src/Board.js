'use strict';
const PlayerRoles = require('./PlayerRoles');

class Board {
    constructor(data) {
        this.audience = data.audience;
        this.title = data.title;
        this.loader = null
        this.id = data.id;
        this.notes = new Map();
        this.nextNoteNumber = 0;
    }

    serialize() {
        return {
            'title': this.title,
            'id': this.id,
            'audience': this.audience,
            'nextNoteNumber': this.nextNoteNumber
        }
    }
    getNextNoteNumber() {
        if (this.nextNoteNumber == 0) {
            this.notes.forEach((value, key) => {
                if (value.number > this.nextNoteNumber)
                {
                    this.nextNoteNumber = value.number;
                }
            })
            this.nextNoteNumber++;
        }

        const value = this.nextNoteNumber;
        this.nextNoteNumber++;
        
        return value;
    }
    
    setLoader(loader) {
        this.loader = loader;
    }

    async addNote(note) {
        this.notes.set(note.number, note);
        await this.loader.update({'id':note.number,'board':note.board}, note.serialize());
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
        if (note.to === 'all' || note.from === player.name || player.role === PlayerRoles.ADMIN) {
            return true;
        }

        return true;
    }

    getNote(number, player) {
        const note = this.notes.get(number);

        if (!note || !this.canSeeNote(note,player)) {
            return null
        }
        return note;
    }

    async removeNote(number) {
        this.notes.delete(number);
        await this.loader.update(number, null);
    }
    
    doRemoveNote(number, player) {
        const note = this.getNote(number,player);

        if (!note) {
            return false;
        }

        if (note.from === player.name || player.role === PlayerRoles.ADMIN ) {
            this.removeNote(number);
         return true;
        }
    }
}

module.exports = Board;