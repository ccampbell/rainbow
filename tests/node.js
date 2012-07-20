var color   = require('..').color
  , fs      = require('fs')
;


function test(language) {
	var content = fs.readFileSync(__dirname + '/language/'+language+'-test.js', 'utf8');
	color(content, language, function(highlighted_code) {
		console.log('<html><body><pre>' + highlighted_code + '</pre></body></html>');
	})
}

test('javascript');