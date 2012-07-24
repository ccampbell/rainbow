// Expose Rainbow as nodejs module
var Rainbow = module.exports = require("./js/rainbow.js");


// Extending color method with language auto-loading
Rainbow.color = ( function( _super ) {
    return function() {
        // Load automatically required language :
        if ((typeof arguments[0] == 'string') && (typeof(require) === "function")) {
            // To prevent using nodejs specific code inside
            // language files, and to keep original browser code
            // we temporarily expose Rainbow as a global object
            var oldRainbow = global.Rainbow;
            global.Rainbow = Rainbow;
            require('./js/language/' + (arguments[1] || 'generic') + '.js');
            // Restore global Rainbow (maybe 'undefined')
            global.Rainbow = oldRainbow;
        }
        return _super.apply( this, arguments );
    };
} )( Rainbow.color );