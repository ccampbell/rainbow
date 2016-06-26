#!/usr/bin/env node
/* eslint-disable */
var fs = require('fs');
global.Rainbow = require('../dist/rainbow.js');

var files = fs.readdirSync(__dirname + '/language');
for (var i = 0; i < files.length; i++) {
    require('./language/' + files[i]);
}

module.exports = global.Rainbow;
delete global.Rainbow;
/* eslint-enable */
