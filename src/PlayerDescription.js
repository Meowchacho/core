'use strict';
const CharacterDescription = require('./CharacterDescription');
const v8 = require('v8');

class PlayerDescription extends CharacterDescription{
    constructor(data = {}) {
        super(data)
        this._hair =  new Map(Object.entries(data.hair || {}));
        this._eyes =  new Map(Object.entries(data.eyes || {}));
        this._skin =  new Map(Object.entries(data.skin || {}));
        this._body =  new Map(Object.entries(data.body || {}));
    }

    set hair(hairData) {
        for(let [key, value] of Object.entries(hairData)) {
            this._hair.set(key,value);
        }
    }
    describeHair() {
        const color = this._hair.get('color') || '';
        const style = this._hair.get('style') || '';
        const length = this._hair.get('length') || '';
        return `${length}, ${color}, and ${style}`;
    }
    set eyes(eyesData) {
        for(let [key, value] of Object.entries(eyesData)) {
            this._eyes.set(key,value);
        }
    }
    describeEyes() {
        const eyes = this._eyes.get('color') || '';
        return `${eyes}`;
    }

    set skin(skinData) {
        for(let [key, value] of  Object.entries(skinData)) {
            this._skin.set(key,value);
        }
    }
    describeSkin() {
        const tone = this._skin.get('tone') || '';
        const blemishes = this._skin.get('blemishes') || '';
        const features = this._skin.get('features') || '';
        return `${tone}, with ${blemishes}${features == ''?'':'and ' + features}`;
    }

    set body(bodyData) {
        for(let [key, value] of  Object.entries(bodyData)) {
            this._body.set(key,value);
        }
    }
    describeBody() {
        const height = this._body.get('height') || '';
        const weight = this._body.get('weight') || '';
        const musculature = this._body.get('musculature') || '';
        return `${musculature}, and is ${height} tall, weighing ${weight}`;
    }

    serialize() {
        let data = super.serialize();
        data.hair = v8.deserialize(v8.serialize(this._hair));
        data.eyes = v8.deserialize(v8.serialize(this._eyes));
        data.skin = v8.deserialize(v8.serialize(this._skin));
        data.body = v8.deserialize(v8.serialize(this._body));
        return data;
    }
}

module.exports = PlayerDescription;