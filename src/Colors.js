'use strict';
const ansi256 = require('ansi-256-colors')

const shortToColor = new Map([
    ['{r', '1'],
    ['{R', '9'],
    ['{y', '3'],
    ['{Y', '11'],
    ['{c', '6'],
    ['{C', '14'],
    ['{m', '5'],
    ['{M', '13'],
    ['{g', '2'],
    ['{G', '10'],
    ['{b', '4'],
    ['{B', '12'],
    ['{w', '7'],
    ['{W', '15']
]);
function replacer(match,p1, offset, string) {
    let replacement = shortToColor.get(match);
    if(!replacement) {
        replacement = ansi256.reset;
    }
    else {
        replacement = ansi256.fg.codes[replacement];
    }
    return replacement;
}

function parseColoredString(coloredString) {
    let ansiString = coloredString.replaceAll(new RegExp('\\{\\w','g'),replacer)
    return ansiString;
}
module.exports = { shortToColor, parseColoredString }