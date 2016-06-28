/**
 * Copyright 2012-2016 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Rainbow is a simple code syntax highlighter
 *
 * @see rainbowco.de
 */
import Raindrop from './raindrop';
import * as util from './util';
import rainbowWorker from './worker';

/**
 * An array of the language patterns specified for each language
 *
 * @type {Object}
 */
const patterns = {};

/**
 * An array of languages and whether they should bypass the
 * default patterns
 *
 * @type {Object}
 */
const bypass = {};

/**
 * A mapping of language aliases
 *
 * @type {Object}
 */
const aliases = {};

/**
 * Global class added to each span in the highlighted code
 *
 * @type {null|string}
 */
let globalClass;

/**
 * Callback to fire after each block is highlighted
 *
 * @type {null|Function}
 */
let onHighlightCallback;

const isNode = util.isNode();
const isWorker = util.isWorker();

let cachedWorker = null;
function _getWorker() {
    if (isNode || cachedWorker === null) {
        cachedWorker = util.createWorker(rainbowWorker, [Raindrop, util]);
    }

    return cachedWorker;
}

/**
 * Helper for matching up callbacks directly with the
 * post message requests to a web worker.
 *
 * @param {object} message      data to send to web worker
 * @param {Function} callback   callback function for worker to reply to
 * @return {void}
 */
function _messageWorker(message, callback) {
    const worker = _getWorker();

    function _listen(e) {
        if (e.data.id === message.id) {
            callback(e.data);
            worker.removeEventListener('message', _listen);
        }
    }

    worker.addEventListener('message', _listen);
    worker.postMessage(message);
}

/**
 * Browser Only - Handles response from web worker, updates DOM with
 * resulting code, and fires callback
 *
 * @param {Element} element
 * @param {object} waitingOn
 * @param {Function} callback
 * @return {void}
 */
function _generateHandler(element, waitingOn, callback) {
    return function _handleResponseFromWorker(data) {
        element.innerHTML = data.result;
        element.classList.remove('loading');
        element.classList.remove('stop-animation');
        // element.addEventListener('animationend', (e) => {
        //     if (e.animationName === 'fade-in') {
        //         setTimeout(() => {
        //             element.classList.remove('decrease-delay');
        //         }, 1000);
        //     }
        // });

        if (onHighlightCallback) {
            onHighlightCallback(element, data.lang);
        }

        if (--waitingOn.c === 0) {
            callback();
        }
    };
}

/**
 * Gets options needed to pass into Raindrop
 *
 * @return {object}
 */
function _getRaindropOptions() {
    return {
        patterns,
        bypass,
        aliases,
        globalClass
    };
}

/**
 * Gets data to send to webworker
 *
 * @param  {string} code
 * @param  {string} lang
 * @return {object}
 */
function _getWorkerData(code, lang) {
    lang = aliases[lang] || lang;

    const workerData = {
        id: String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now(),
        code,
        lang,
        options: _getRaindropOptions(),
        isNode
    };

    return workerData;
}

/**
 * Browser Only - Sends messages to web worker to highlight elements passed
 * in
 *
 * @param {Array} codeBlocks
 * @param {Function} callback
 * @return {void}
 */
function _highlightCodeBlocks(codeBlocks, callback) {
    const waitingOn = { c: 0 };
    for (const block of codeBlocks) {
        const language = util.getLanguageForBlock(block);
        if (block.classList.contains('rainbow') || !language) {
            continue;
        }

        // This cancels the pending animation to fade the code in on load
        // since we want to delay doing this until it is actually
        // highlighted
        block.classList.add('stop-animation');
        block.classList.add('rainbow');

        // for long files show a spinner
        if (block.innerHTML.length > 20000) {
            block.classList.add('loading');
        }

        ++waitingOn.c;
        _messageWorker(_getWorkerData(block.innerHTML, language), _generateHandler(block, waitingOn, callback));
    }

    if (waitingOn.c === 0) {
        callback();
    }
}

/**
 * Browser Only - Start highlighting all the code blocks
 *
 * @param {Element} node       HTMLElement to search within
 * @param {Function} callback
 * @return {void}
 */
function _highlight(node, callback) {
    callback = callback || function() {};

    // The first argument can be an Event or a DOM Element.
    //
    // I was originally checking instanceof Event but that made it break
    // when using mootools.
    //
    // @see https://github.com/ccampbell/rainbow/issues/32
    node = node && typeof node.getElementsByTagName === 'function' ? node : document;

    const preBlocks = node.getElementsByTagName('pre');
    const codeBlocks = node.getElementsByTagName('code');
    const finalPreBlocks = [];
    const finalCodeBlocks = [];

    // First loop through all pre blocks to find which ones to highlight
    for (const preBlock of preBlocks) {

        // Strip whitespace around code tags when they are inside of a pre
        // tag.  This makes the themes look better because you can't
        // accidentally add extra linebreaks at the start and end.
        //
        // When the pre tag contains a code tag then strip any extra
        // whitespace.
        //
        // For example:
        //
        // <pre>
        //      <code>var foo = true;</code>
        // </pre>
        //
        // will become:
        //
        // <pre><code>var foo = true;</code></pre>
        //
        // If you want to preserve whitespace you can use a pre tag on
        // its own without a code tag inside of it.
        if (preBlock.getElementsByTagName('code').length) {

            // This fixes a race condition when Rainbow.color is called before
            // the previous color call has finished.
            if (!preBlock.getAttribute('data-trimmed')) {
                preBlock.setAttribute('data-trimmed', true);
                preBlock.innerHTML = preBlock.innerHTML.trim();
            }
            continue;
        }

        // If the pre block has no code blocks then we are going to want to
        // process it directly.
        finalPreBlocks.push(preBlock);
    }

    // @see http://stackoverflow.com/questions/2735067/how-to-convert-a-dom-node-list-to-an-array-in-javascript
    // We are going to process all <code> blocks
    for (const codeBlock of codeBlocks) {
        finalCodeBlocks.push(codeBlock);
    }

    _highlightCodeBlocks(finalCodeBlocks.concat(finalPreBlocks), callback);
}

/**
 * Callback to let you do stuff in your app after a piece of code has
 * been highlighted
 *
 * @param {Function} callback
 * @return {void}
 */
function onHighlight(callback) {
    onHighlightCallback = callback;
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
function addClass(name) {
    globalClass = name;
}

/**
 * Extends the language pattern matches
 *
 * @param {string} language         name of language
 * @param {object} patterns         object of patterns to add on
 * @param {boolean|null} bypass     if `true` this will not inherit the
 *                                  default language patterns
 */
function extend(...args) {
    let [localLanguage, localPatterns, localBypass] = args;

    // If there is only one argument then we assume that we want to
    // extend the default language rules.
    if (args.length === 1) {
        localPatterns = localLanguage;
        localLanguage = 'generic';
        localBypass = null;
    }

    bypass[localLanguage] = localBypass;
    patterns[localLanguage] = localPatterns.concat(patterns[localLanguage] || []);
}

/**
 * Starts the magic rainbow
 *
 * @return {void}
 */
function color(...args) {
    // If you want to straight up highlight a string you can pass the
    // string of code, the language, and a callback function.
    //
    // Example:
    //
    // Rainbow.color(code, language, function(highlightedCode, language) {
    //     // this code block is now highlighted
    // });
    if (typeof args[0] === 'string') {
        const workerData = _getWorkerData(args[0], args[1]);
        _messageWorker(workerData, (function(cb) {
            return function(data) {
                if (cb) {
                    cb(data.result, data.lang);
                }
            };
        }(args[2])));
        return;
    }

    // If you pass a callback function then we rerun the color function
    // on all the code and call the callback function on complete.
    //
    // Example:
    //
    // Rainbow.color(function() {
    //     console.log('All matching tags on the page are now highlighted');
    // });
    if (typeof args[0] === 'function') {
        _highlight(0, args[0]);
        return;
    }

    // Otherwise we use whatever node you passed in with an optional
    // callback function as the second parameter.
    //
    // Example:
    //
    // var preElement = document.createElement('pre');
    // var codeElement = document.createElement('code');
    // codeElement.setAttribute('data-language', 'javascript');
    // codeElement.innerHTML = '// Here is some JavaScript';
    // preElement.appendChild(codeElement);
    // Rainbow.color(preElement, function() {
    //     // New element is now highlighted
    // });
    //
    // If you don't pass an element it will default to `document`
    _highlight(args[0], args[1]);
}

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
function addAlias(alias, originalLanguage) {
    aliases[alias] = originalLanguage;
}

/**
 * public methods
 */
const _rainbow = {
    extend,
    onHighlight,
    addClass,
    addAlias,
    color
};

if (isNode) {
    _rainbow.colorSync = function(code, lang) {
        const drop = new Raindrop(_getRaindropOptions());
        return drop.refract(code, aliases[lang] || lang);
    };
}

// In the browser hook it up to color on page load
if (!isNode && !isWorker) {
    document.addEventListener('DOMContentLoaded', _rainbow.color, false);
}

// From a node worker, handle the postMessage requests to it
if (isWorker) {
    self.onmessage = rainbowWorker;
}

export default _rainbow;
