// Run this test with nodejs on command line :
//
// node tests/node.js
//


var color   = require('..').color
  , fs      = require('fs')
;


function test(language) {
    var content    = "var foo = 'bar';",
        asyncResult, syncResult;

    syncResult = color(content, language, function(highlighted_code) {
        asyncResult = highlighted_code;
    });

    if(asyncResult == syncResult) {
        console.log('OK : synchronized result');
    } else {
        console.error('ERR : synchronized result : "%s" != "%s"',highlighted_code, syncResult)
    }

    if(typeof(Rainbow) === 'undefined') {
        console.log('OK : Rainbow object not exposed');
    } else {
        console.error('ERR : Rainbow object is exposed')
    }
}

test('javascript');