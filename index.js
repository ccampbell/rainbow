// Expose Rainbow as nodejs module
var Rainbow = module.exports = require("./js/rainbow.js");

/**
 * Convenience method to load languages with their dependencies
 *
 * @param  {string} language Language name
 */
Rainbow.loadLanguage = function(language) {
    // To prevent using nodejs specific code inside
    // language files, and to keep original browser code
    // we temporarily expose Rainbow as a global object
    // Original value - maybe undefined - is restored below
    var oldRainbow = global.Rainbow;
    global.Rainbow = Rainbow;

    // Load required language :
    require('./js/language/' + language);

    // Restore global Rainbow (maybe 'undefined')
    global.Rainbow = oldRainbow;
}


// Extending extend() to automaticaly load language dependencies
Rainbow.extend = ( function( _super ) {
    var loadedLanguages = [];
    return function(language, patterns, bypass) {

        loadedLanguages.push(language);

        function isLoaded(language) {
            return ~loadedLanguages.indexOf(language);
        }

        // Walk through patterns and load dependencies :
        function walk(node) {
            if(typeof(node) !== 'object') return;
            Object.keys(node).forEach(function(key) {
                if(key === 'language' && !isLoaded(node[key])) {
                    Rainbow.loadLanguage(node[key]);
                }
                walk(node[key]);
            });
        }

        walk(patterns);

        return _super.apply( this, arguments );
    };
} )( Rainbow.extend );



// Extending color() method with language auto-loading
Rainbow.color = ( function( _super ) {
    return function() {
        // Load automatically required language :
        if (typeof arguments[0] == 'string') {
            // Load required language :
            if(typeof(arguments[1]) === 'string') {
                Rainbow.loadLanguage(arguments[1]);
            }
        }
        return _super.apply( this, arguments );
    };
} )( Rainbow.color );


// Allways load generic language
Rainbow.loadLanguage('generic');