/**
 * An array of the language patterns specified for each language
 *
 * @type {Object}
 */
export const languagePatterns = {};

/**
 * An array of languages and whether they should bypass the
 * default patterns
 *
 * @type {Object}
 */
export const bypassDefaults = {};

/**
 * A mapping of language aliases
 *
 * @type {Object}
 */
export const aliases = {};

/**
 * Global class added to each span in the highlighted code
 *
 * @type {null|string}
 */
let globalClass;

/**
 * Method to add an alias for an existing language.
 *
 * For example if you want to have "coffee" map to "coffeescript"
 *
 * @see https://github.com/ccampbell/rainbow/issues/154
 * @param {string} alias
 * @param {string} originalLanguage
 * @return {void}
 */
export function addAlias(alias, originalLanguage) {
    aliases[alias] = originalLanguage;
}

function _addGlobal(thing) {
    if (typeof thing === 'function') {
        return `\n${thing.toString()}`;
    }

    let toAdd = '';
    if (typeof thing === 'object') {
        for (const key in thing) {
            toAdd += _addGlobal(thing[key]);
        }
    }

    return toAdd;
}

export function isNode() {
    /* globals module */
    return typeof module !== 'undefined' && typeof module.exports === 'object';
}

export function isWorker() {
    return typeof document === 'undefined' && typeof self !== 'undefined';
}

/**
 * Creates a usable web worker from an anonymous function
 *
 * mostly borrowed from https://github.com/zevero/worker-create
 *
 * @param {Function} fn
 * @param {Array} globals global functions that should be added to the worker scope
 * @return {Worker}
 */
export function createWorker(fn, globals) {
    if (isNode()) {
        /* globals global, require, __filename */
        global.Worker = require('webworker-threads').Worker;
        return new Worker(__filename);
    }

    if (!Array.isArray(globals)) {
        globals = [globals];
    }

    let code = '';
    for (const thing of globals) {
        code += _addGlobal(thing);
    }

    // This is an awful hack, but something to do with how uglify renames stuff
    // and rollup means that the variable the worker.js is using to reference
    // Raindrop will not be the same one available in this context
    const raindropName = globals[0].toString().match(/function (\w*?)\(/)[1];
    let str = fn.toString();
    str = str.replace(/=new \w*/, `= new ${raindropName}`);

    const fullString = `${code}\tthis.onmessage =${str}`;

    const blob = new Blob([fullString], { type: 'text/javascript' });
    return new Worker((window.URL || window.webkitURL).createObjectURL(blob));
}

/**
 * Extends the language pattern matches
 *
 * @param {string} language         name of language
 * @param {object} patterns         object of patterns to add on
 * @param {boolean|null} bypass     if `true` this will not inherit the
 *                                  default language patterns
 */
export function extend(...args) {
    let [language, patterns, bypass] = args;

    // If there is only one argument then we assume that we want to
    // extend the default language rules.
    if (args.length === 1) {
        patterns = language;
        language = 'generic';
        bypass = null;
    }

    bypassDefaults[language] = bypass;
    languagePatterns[language] = patterns.concat(languagePatterns[language] || []);
}

/**
 * Browser Only - Gets the language for this block of code
 *
 * @param {Element} block
 * @return {string|null}
 */
export function getLanguageForBlock(block) {

    // If this doesn't have a language but the parent does then use that.
    //
    // This means if for example you have: <pre data-language="php">
    // with a bunch of <code> blocks inside then you do not have
    // to specify the language for each block.
    let language = block.getAttribute('data-language') || block.parentNode.getAttribute('data-language');

    // This adds support for specifying language via a CSS class.
    //
    // You can use the Google Code Prettify style: <pre class="lang-php">
    // or the HTML5 style: <pre><code class="language-php">
    if (!language) {
        const pattern = /\blang(?:uage)?-(\w+)/;
        const match = block.className.match(pattern) || block.parentNode.className.match(pattern);

        if (match) {
            language = match[1];
        }
    }

    if (language) {
        return language.toLowerCase();
    }

    return null;
}

/**
 * Returns a list of regex patterns for this language
 *
 * @param {string} language
 * @return {Array}
 */
export function getPatternsForLanguage(language) {
    const langPatterns = isWorker() ? self.languagePatterns : languagePatterns;
    const bypass = isWorker() ? self.bypassDefaults : bypassDefaults;

    const patterns = langPatterns[language] || [];
    const defaultPatterns = langPatterns['generic'] || [];

    return bypass[language] ? patterns : patterns.concat(defaultPatterns);
}

/**
 * Determines if two different matches have complete overlap with each other
 *
 * @param {number} start1   start position of existing match
 * @param {number} end1     end position of existing match
 * @param {number} start2   start position of new match
 * @param {number} end2     end position of new match
 * @return {boolean}
 */
export function hasCompleteOverlap(start1, end1, start2, end2) {

    // If the starting and end positions are exactly the same
    // then the first one should stay and this one should be ignored.
    if (start2 === start1 && end2 === end1) {
        return false;
    }

    return start2 <= start1 && end2 >= end1;
}

/**
 * Encodes < and > as html entities
 *
 * @param {string} code
 * @return {string}
 */
export function htmlEntities(code) {
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&(?![\w\#]+;)/g, '&amp;');
}

/**
 * Finds out the position of group match for a regular expression
 *
 * @see http://stackoverflow.com/questions/1985594/how-to-find-index-of-groups-in-match
 * @param {Object} match
 * @param {number} groupNumber
 * @return {number}
 */
export function indexOfGroup(match, groupNumber) {
    let index = 0;

    for (let i = 1; i < groupNumber; ++i) {
        if (match[i]) {
            index += match[i].length;
        }
    }

    return index;
}

/**
 * Determines if a new match intersects with an existing one
 *
 * @param {number} start1    start position of existing match
 * @param {number} end1      end position of existing match
 * @param {number} start2    start position of new match
 * @param {number} end2      end position of new match
 * @return {boolean}
 */
export function intersects(start1, end1, start2, end2) {
    if (start2 >= start1 && start2 < end1) {
        return true;
    }

    return end2 > start1 && end2 < end1;
}

/**
 * Sorts an objects keys by index descending
 *
 * @param {Object} object
 * @return {Array}
 */
export function keys(object) {
    const locations = [];

    for (const location in object) {
        if (object.hasOwnProperty(location)) {
            locations.push(location);
        }
    }

    // numeric descending
    return locations.sort((a, b) => b - a);
}

/**
 * Substring replace call to replace part of a string at a certain position
 *
 * @param {number} position         the position where the replacement
 *                                  should happen
 * @param {string} replace          the text we want to replace
 * @param {string} replaceWith      the text we want to replace it with
 * @param {string} code             the code we are doing the replacing in
 * @return {string}
 */
export function replaceAtPosition(position, replace, replaceWith, code) {
    const subString = code.substr(position);
    return code.substr(0, position) + subString.replace(replace, replaceWith);
}

/**
 * Method to set a global class that will be applied to all spans.
 *
 * This is realy only useful for the effect on rainbowco.de where you can
 * force all blocks to not be highlighted and remove this class to
 * transition them to being highlighted.
 *
 * @param {string} className
 * @return {void}
 */
export function setGlobalClass(name) {
    globalClass = name;
}

export function getGlobalClass() {
    return globalClass;
}

/**
 * Takes a string of code and wraps it in a span tag based on the name
 *
 * @param {string} name        name of the pattern (ie keyword.regex)
 * @param {string} code        block of code to wrap
 * @param {string} globalClass class to apply to every span
 * @return {string}
 */
export function wrapCodeInSpan(name, code) {
    const gClass = isWorker() ? self.globalClass : globalClass;
    return `<span class="${name.replace(/\./g, ' ')}${(gClass ? ` ${gClass}` : '')}">${code}</span>`;
}
