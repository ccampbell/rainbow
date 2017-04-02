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
import Prism from './prism';
import { isNode as utilIsNode, isWorker as utilIsWorker, createWorker, getLanguageForBlock } from './util';
import rainbowWorker from './worker';

/**
 * An array of the language patterns specified for each language
 *
 * @type {Object}
 */
const patterns = {};

/**
 * An object of languages mapping to what language they should inherit from
 *
 * @type {Object}
 */
const inheritenceMap = {};

/**
 * A mapping of language aliases
 *
 * @type {Object}
 */
const aliases = {};

/**
 * Representation of the actual rainbow object
 *
 * @type {Object}
 */
let Rainbow = {};

/**
 * Callback to fire after each block is highlighted
 *
 * @type {null|Function}
 */
let onHighlightCallback;

/**
 * Counter for block ids
 * @see https://github.com/ccampbell/rainbow/issues/207
 */
let id = 0;

const isNode = utilIsNode();
const isWorker = utilIsWorker();

let cachedWorker = null;
function _getWorker() {
    if (isNode || cachedWorker === null) {
        cachedWorker = createWorker(rainbowWorker, Prism);
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

        if (element.parentNode.tagName === 'PRE') {
            element.parentNode.classList.remove('loading');
        }

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
 * Gets options needed to pass into Prism
 *
 * @param {object} options
 * @return {object}
 */
function _getPrismOptions(options) {
    return {
        patterns,
        inheritenceMap,
        aliases,
        globalClass: options.globalClass,
        delay: !isNaN(options.delay) ? options.delay : 0
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
    let options = {};
    if (typeof lang === 'object') {
        options = lang;
        lang = options.language;
    }

    lang = aliases[lang] || lang;

    const workerData = {
        id: id++,
        code,
        lang,
        options: _getPrismOptions(options),
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
        const language = getLanguageForBlock(block);
        if (block.classList.contains('rainbow') || !language) {
            continue;
        }

        // This cancels the pending animation to fade the code in on load
        // since we want to delay doing this until it is actually
        // highlighted
        block.classList.add('loading');
        block.classList.add('rainbow');

        // We need to make sure to also add the loading class to the pre tag
        // because that is how we will know to show a preloader
        if (block.parentNode.tagName === 'PRE') {
            block.parentNode.classList.add('loading');
        }

        const globalClass = block.getAttribute('data-global-class');
        const delay = parseInt(block.getAttribute('data-delay'), 10);

        ++waitingOn.c;
        _messageWorker(_getWorkerData(block.innerHTML, { language, globalClass, delay }), _generateHandler(block, waitingOn, callback));
    }

    if (waitingOn.c === 0) {
        callback();
    }
}

function _addPreloader(preBlock) {
    const preloader = document.createElement('div');
    preloader.className = 'preloader';
    for (let i = 0; i < 7; i++) {
        preloader.appendChild(document.createElement('div'));
    }
    preBlock.appendChild(preloader);
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
        _addPreloader(preBlock);

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
 * Extends the language pattern matches
 *
 * @param {string} language            name of language
 * @param {object} languagePatterns    object of patterns to add on
 * @param {string|undefined} inherits  optional language that this language
 *                                     should inherit rules from
 */
function extend(language, languagePatterns, inherits) {

    // If we extend a language again we shouldn't need to specify the
    // inheritence for it. For example, if you are adding special highlighting
    // for a javascript function that is not in the base javascript rules, you
    // should be able to do
    //
    // Rainbow.extend('javascript', [ … ]);
    //
    // Without specifying a language it should inherit (generic in this case)
    if (!inheritenceMap[language]) {
        inheritenceMap[language] = inherits;
    }

    patterns[language] = languagePatterns.concat(patterns[language] || []);
}

function remove(language) {
    delete inheritenceMap[language];
    delete patterns[language];
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
Rainbow = {
    extend,
    remove,
    onHighlight,
    addAlias,
    color
};

if (isNode) {
    Rainbow.colorSync = function(code, lang) {
        const workerData = _getWorkerData(code, lang);
        const prism = new Prism(workerData.options);
        return prism.refract(workerData.code, workerData.lang);
    };
}

// In the browser hook it up to color on page load
if (!isNode && !isWorker) {
    document.addEventListener('DOMContentLoaded', (event) => {
        if (!Rainbow.defer) {
            Rainbow.color(event);
        }
    }, false);
}

// From a node worker, handle the postMessage requests to it
if (isWorker) {
    self.onmessage = rainbowWorker;
}

export default Rainbow;
