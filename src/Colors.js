'use strict';
const ansi256 = require('ansi-256-colors');
const ansiStyles = require('ansi-styles');

const shortToColor = new Map([
    ['{r', 31],
    ['{R', 91],
    ['{y', 33],
    ['{Y', 93],
    ['{c', 36],
    ['{C', 96],
    ['{m', 35],
    ['{M', 95],
    ['{g', 32],
    ['{G', 92],
    ['{b', 34],
    ['{B', 94],
    ['{w', 37],
    ['{W', 97]
]);

const nameToColor = new Map([

]);
function replacer(match, p1, offset, string) {
    let replacement = shortToColor.get(match);
    if (!replacement) {
        replacement = ansi256.reset;
    }
    else {
        replacement =  ansiStyles.color.ansi.ansi(replacement)//ansi256.fg.codes[replacement];
    }
    return replacement;
}

function parseColoredString(coloredString) {
    let ansiString = coloredString.replaceAll(new RegExp('\\{\\w', 'g'), replacer)
    return ansiString;
}
module.exports = { shortToColor, parseColoredString }