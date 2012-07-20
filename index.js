// TODO : Adding synchronous support


// Expose Rainbow
var Rainbow = module.exports = require("./js/rainbow.js");

// Load at least generic language
require("./js/language/generic.js");


// Overide the color function with the only required usage 
// on server side.
// Adding automatique language loading
var _super_color = Rainbow.color;
Rainbow.color = function(src, language, callback) {
	require('./js/language/' + language + '.js');
	return _super_color.call(Rainbow, src, language, callback);
}
