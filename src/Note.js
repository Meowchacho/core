'use strict';
const GameEntity = require('./GameEntity');

class Note extends GameEntity {
    constructor(data) {
        super();
        if (!data) {
            this.board = null;
            this.from = null;
            this.to = null;
            this.subject = null;
            this.body = null;
            this.number = null
            this.dateWritten = null;
        }
        else {
            this.board = data.board || null;
            this.from = data.from || null;
            this.to = data.to || null;
            this.subject = data.subject || null;
            this.body = data.body || null;
            this.number = data.number || null;
            this.dateWritten = data.dateWritten || new Date("January 1, 2020");
        }
    }
    serialize() {
        return {
            'board': this.board,
            'number': this.number,
            'from': this.from,
            'to': this.to,
            'subject': this.subject,
            'body': this.body,
            'dateWritten': this.dateWritten
        }
    }
}

module.exports = Note;