'use strict';

class CharacterDescription {
    constructor(data = {}) {
        this._shortDescription = data.shortDescription || '';
        this._longDescription = data.longDescription || '';
        this._gender = data.gender || '';
    }

    set shortDescription(descData) {
        this._shortDescription = descData.shortDescription
    }
    set longDescription(descData) {
        this._longDescription = descData.longDescription
    }
    set gender(genderData) {
        this._gender = genderData.gender
    }

    get gender() {return this._gender};
    get longDescription() {return this._longDescription}
    get shortDescription() {return this._shortDescription}
    serialize() {
        return {
            shortDescription: this._shortDescription,
            longDescription: this._longDescription,
            gender: this._gender
        };
    }
}

module.exports = CharacterDescription;