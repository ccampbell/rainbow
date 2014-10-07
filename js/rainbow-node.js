#!/usr/bin/env node
var fs = require('fs');
global.Rainbow = require('./rainbow.js');

var files = fs.readdirSync(__dirname + '/language');
for (var i = 0; i < files.length; i++) {
    require('./language/' + files[i]);
}

module.exports = global.Rainbow;
delete global['Rainbow'];
