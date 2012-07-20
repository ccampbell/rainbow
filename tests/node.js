var color   = require('..').color
  , fs      = require('fs')
;


function test(language) {
	var content    = "var foo = 'bar';"
	  , asyncResult, syncResult;

	syncResult = color(content, language, function(highlighted_code) {
		asyncResult = highlighted_code;
	});

	if(asyncResult == syncResult) {
		console.log('OK : synchronized result');
	} else {
		console.log('ERR : synchronized result : "%s" != "%s"',highlighted_code, syncResult)
	}
}

test('javascript');