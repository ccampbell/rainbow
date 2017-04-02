
export function isNode() {
    /* globals module */
    return typeof module !== 'undefined' && typeof module.exports === 'object';
}

export function isWorker() {
    return typeof document === 'undefined' && typeof self !== 'undefined';
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
 * Creates a usable web worker from an anonymous function
 *
 * mostly borrowed from https://github.com/zevero/worker-create
 *
 * @param {Function} fn
 * @param {Prism} Prism
 * @return {Worker}
 */
export function createWorker(fn, Prism) {
    if (isNode()) {
        /* globals global, require, __filename */
        global.Worker = require('webworker-threads').Worker;
        return new Worker(__filename);
    }

    const prismFunction = Prism.toString();

    let code = keys.toString();
    code += htmlEntities.toString();
    code += hasCompleteOverlap.toString();
    code += intersects.toString();
    code += replaceAtPosition.toString();
    code += indexOfGroup.toString();
    code += prismFunction;

    const fullString = `${code}\tthis.onmessage=${fn.toString()}`;

    const blob = new Blob([fullString], { type: 'text/javascript' });
    return new Worker((window.URL || window.webkitURL).createObjectURL(blob));
}
