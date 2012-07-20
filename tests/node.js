var color   = require('..').color
  , fs      = require('fs')
;


function test(language) {
	var content    = "var foo = 'bar';";
	var syncResult = color(content, language, function(highlighted_code) {
		if(highlighted_code == syncResult) {
			console.log('OK : synchronized result');
		} else {
			console.log('ERR : synchronized result : "%s" != "%s"',highlighted_code, syncResult)
		}
	});
	console.log('syncResult', syncResult);
}

test('javascript');