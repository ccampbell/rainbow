(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.Rainbow = factory());
}(this, function () { 'use strict';

    function _addGlobal(thing) {
        if (typeof thing === 'function') {
            return ("\n" + (thing.toString()));
        }

        var toAdd = '';
        if (typeof thing === 'object') {
            for (var key in thing) {
                toAdd += _addGlobal(thing[key]);
            }
        }

        return toAdd;
    }

    function isNode$1() {
        /* globals module */
        return typeof module !== 'undefined' && typeof module.exports === 'object';
    }

    function isWorker$1() {
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
    function createWorker(fn, globals) {
        if (isNode$1()) {
            /* globals global, require, __filename */
            global.Worker = require('webworker-threads').Worker;
            return new Worker(__filename);
        }

        if (!Array.isArray(globals)) {
            globals = [globals];
        }

        var code = '';
        for (var i = 0, list = globals; i < list.length; i += 1) {
            var thing = list[i];

            code += _addGlobal(thing);
        }

        // This is an awful hack, but something to do with how uglify renames stuff
        // and rollup means that the variable the worker.js is using to reference
        // Prism will not be the same one available in this context
        var prismName = globals[0].toString().match(/function (\w*?)\(/)[1];
        var str = fn.toString();
        str = str.replace(/=new \w*/, ("= new " + prismName));

        var fullString = code + "\tthis.onmessage =" + str;

        var blob = new Blob([fullString], { type: 'text/javascript' });
        return new Worker((window.URL || window.webkitURL).createObjectURL(blob));
    }

    /**
     * Browser Only - Gets the language for this block of code
     *
     * @param {Element} block
     * @return {string|null}
     */
    function getLanguageForBlock(block) {

        // If this doesn't have a language but the parent does then use that.
        //
        // This means if for example you have: <pre data-language="php">
        // with a bunch of <code> blocks inside then you do not have
        // to specify the language for each block.
        var language = block.getAttribute('data-language') || block.parentNode.getAttribute('data-language');

        // This adds support for specifying language via a CSS class.
        //
        // You can use the Google Code Prettify style: <pre class="lang-php">
        // or the HTML5 style: <pre><code class="language-php">
        if (!language) {
            var pattern = /\blang(?:uage)?-(\w+)/;
            var match = block.className.match(pattern) || block.parentNode.className.match(pattern);

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
    function hasCompleteOverlap(start1, end1, start2, end2) {

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
    function htmlEntities(code) {
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
    function indexOfGroup(match, groupNumber) {
        var index = 0;

        for (var i = 1; i < groupNumber; ++i) {
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
    function intersects(start1, end1, start2, end2) {
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
    function keys(object) {
        var locations = [];

        for (var location in object) {
            if (object.hasOwnProperty(location)) {
                locations.push(location);
            }
        }

        // numeric descending
        return locations.sort(function (a, b) { return b - a; });
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
    function replaceAtPosition(position, replace, replaceWith, code) {
        var subString = code.substr(position);
        return code.substr(0, position) + subString.replace(replace, replaceWith);
    }


    var util = Object.freeze({
        isNode: isNode$1,
        isWorker: isWorker$1,
        createWorker: createWorker,
        getLanguageForBlock: getLanguageForBlock,
        hasCompleteOverlap: hasCompleteOverlap,
        htmlEntities: htmlEntities,
        indexOfGroup: indexOfGroup,
        intersects: intersects,
        keys: keys,
        replaceAtPosition: replaceAtPosition
    });

    /**
     * Prism is a class used to highlight individual blocks of code
     *
     * @class
     */
    var Prism = function Prism(options) {
        /**
         * Object of replacements to process at the end of the processing
         *
         * @type {Object}
         */
        var replacements = {};

        /**
         * Language associated with this Prism object
         *
         * @type {string}
         */
        var currentLanguage;

        /**
         * Object of start and end positions of blocks to be replaced
         *
         * @type {Object}
         */
        var replacementPositions = {};

        /**
         * Determines if the match passed in falls inside of an existing match.
         * This prevents a regex pattern from matching inside of another pattern
         * that matches a larger amount of code.
         *
         * For example this prevents a keyword from matching `function` if there
         * is already a match for `function (.*)`.
         *
         * @param {number} startstart position of new match
         * @param {number} end  end position of new match
         * @return {boolean}
         */
        function _matchIsInsideOtherMatch(start, end) {
            for (var key in replacementPositions) {
                key = parseInt(key, 10);

                // If this block completely overlaps with another block
                // then we should remove the other block and return `false`.
                if (hasCompleteOverlap(key, replacementPositions[key], start, end)) {
                    delete replacementPositions[key];
                    delete replacements[key];
                }

                if (intersects(key, replacementPositions[key], start, end)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Takes a string of code and wraps it in a span tag based on the name
         *
         * @param {string} name    name of the pattern (ie keyword.regex)
         * @param {string} code    block of code to wrap
         * @param {string} globalClass class to apply to every span
         * @return {string}
         */
        function _wrapCodeInSpan(name, code) {
            var className = name.replace(/\./g, ' ');

            var globalClass = options.globalClass;
            if (globalClass) {
                className += " " + globalClass;
            }

            return ("<span class=\"" + className + "\">" + code + "</span>");
        }

        /**
         * Process replacements in the string of code to actually update
         * the markup
         *
         * @param {string} code     the code to process replacements in
         * @return {string}
         */
        function _processReplacements(code) {
            var positions = keys(replacements);
            for (var i = 0, list = positions; i < list.length; i += 1) {
                var position = list[i];

                var replacement = replacements[position];
                code = replaceAtPosition(position, replacement.replace, replacement.with, code);
            }
            return code;
        }

        /**
         * Matches a regex pattern against a block of code, finds all matches
         * that should be processed, and stores the positions of where they
         * should be replaced within the string.
         *
         * This is where pretty much all the work is done but it should not
         * be called directly.
         *
         * @param {Object} pattern
         * @param {string} code
         * @return {void}
         */
        function _processPattern(pattern, code) {
            var regex = pattern.pattern;
            if (!regex) {
                return;
            }

            var match = regex.exec(code);
            if (!match) {
                return;
            }

            // Treat match 0 the same way as name
            if (!pattern.name && typeof pattern.matches[0] === 'string') {
                pattern.name = pattern.matches[0];
                delete pattern.matches[0];
            }

            var replacement = match[0];
            var startPos = match.index;
            var endPos = match[0].length + startPos;

            // If this is not a child match and it falls inside of another
            // match that already happened we should skip it and continue
            // processing.
            if (_matchIsInsideOtherMatch(startPos, endPos)) {
                _processPattern(pattern, code);
                return;
            }

            /**
             * Callback for when a match was successfully processed
             *
             * @param {string} repl
             * @return {void}
             */
            function onMatchSuccess(repl) {

                // If this match has a name then wrap it in a span tag
                if (pattern.name) {
                    repl = _wrapCodeInSpan(pattern.name, repl);
                }

                // For debugging
                // console.log('Replace ' + match[0] + ' with ' + replacement + ' at position ' + startPos + ' to ' + endPos);

                // Store what needs to be replaced with what at this position
                replacements[startPos] = {
                    'replace': match[0],
                    'with': repl
                };

                // Store the range of this match so we can use it for
                // comparisons with other matches later.
                replacementPositions[startPos] = endPos;

                _processPattern(pattern, code);
            }

            /**
             * Helper function for processing a sub group
             *
             * @param {number} groupKey  index of group
             * @return {void}
             */
            function _processGroup(groupKey) {
                var block = match[groupKey];

                // If there is no match here then move on
                if (!block) {
                    return;
                }

                var group = pattern.matches[groupKey];
                var language = group.language;

                /**
                 * Process group is what group we should use to actually process
                 * this match group.
                 *
                 * For example if the subgroup pattern looks like this:
                 *
                 * 2: {
                 * 'name': 'keyword',
                 * 'pattern': /true/g
                 * }
                 *
                 * then we use that as is, but if it looks like this:
                 *
                 * 2: {
                 * 'name': 'keyword',
                 * 'matches': {
                 *      'name': 'special',
                 *      'pattern': /whatever/g
                 *  }
                 * }
                 *
                 * we treat the 'matches' part as the pattern and keep
                 * the name around to wrap it with later
                 */
                var groupToProcess = group.name && group.matches ? group.matches : group;

                /**
                 * Takes the code block matched at this group, replaces it
                 * with the highlighted block, and optionally wraps it with
                 * a span with a name
                 *
                 * @param {string} passedBlock
                 * @param {string} replaceBlock
                 * @param {string|null} matchName
                 */
                var _getReplacement = function(passedBlock, replaceBlock, matchName) {
                    replacement = replaceAtPosition(indexOfGroup(match, groupKey), passedBlock, matchName ? _wrapCodeInSpan(matchName, replaceBlock) : replaceBlock, replacement);
                    return;
                };

                // If this is a string then this match is directly mapped
                // to selector so all we have to do is wrap it in a span
                // and continue.
                if (typeof group === 'string') {
                    _getReplacement(block, block, group);
                    return;
                }

                var localCode;
                var prism = new Prism(options);

                // If this is a sublanguage go and process the block using
                // that language
                if (language) {
                    localCode = prism.refract(block, language);
                    _getReplacement(block, localCode);
                    return;
                }

                // The process group can be a single pattern or an array of
                // patterns. `_processCodeWithPatterns` always expects an array
                // so we convert it here.
                localCode = prism.refract(block, currentLanguage, groupToProcess.length ? groupToProcess : [groupToProcess]);
                _getReplacement(block, localCode, group.matches ? group.name : 0);
            }

            // If this pattern has sub matches for different groups in the regex
            // then we should process them one at a time by running them through
            // the _processGroup function to generate the new replacement.
            //
            // We use the `keys` function to run through them backwards because
            // the match position of earlier matches will not change depending
            // on what gets replaced in later matches.
            var groupKeys = keys(pattern.matches);
            for (var i = 0, list = groupKeys; i < list.length; i += 1) {
                var groupKey = list[i];

                _processGroup(groupKey);
            }

            // Finally, call `onMatchSuccess` with the replacement
            onMatchSuccess(replacement);
        }

        /**
         * Processes a block of code using specified patterns
         *
         * @param {string} code
         * @param {Array} patterns
         * @return {string}
         */
        function _processCodeWithPatterns(code, patterns) {
            for (var i = 0, list = patterns; i < list.length; i += 1) {
                var pattern = list[i];

                _processPattern(pattern, code);
            }

            // We are done processing the patterns so we should actually replace
            // what needs to be replaced in the code.
            return _processReplacements(code);
        }

        /**
         * Returns a list of regex patterns for this language
         *
         * @param {string} language
         * @return {Array}
         */
        function getPatternsForLanguage(language) {
            var patterns = options.patterns[language] || [];
            while (options.inheritenceMap[language]) {
                language = options.inheritenceMap[language];
                patterns = patterns.concat(options.patterns[language]);
            }

            return patterns;
        }

        /**
         * Takes a string of code and highlights it according to the language
         * specified
         *
         * @param {string} code
         * @param {string} language
         * @param {object} patterns optionally specify a list of patterns
         * @return {string}
         */
        function _highlightBlockForLanguage(code, language, patterns) {
            currentLanguage = language;
            patterns = patterns || getPatternsForLanguage(language);
            return _processCodeWithPatterns(htmlEntities(code), patterns);
        }

        this.refract = _highlightBlockForLanguage;
    };

    function rainbowWorker(e) {
        var message = e.data;

        var prism = new Prism(message.options);
        var result = prism.refract(message.code, message.lang);

        function _reply() {
            self.postMessage({
                id: message.id,
                lang: message.lang,
                result: result
            });
        }

        // I realized down the road I might look at this and wonder what is going on
        // so probably it is not a bad idea to leave a comment.
        //
        // This is needed because right now the node library for simulating web
        // workers “webworker-threads” will keep the worker open and it causes
        // scripts running from the command line to hang unless the worker is
        // explicitly closed.
        //
        // This means for node we will spawn a new thread for every asynchronous
        // block we are highlighting, but in the browser we will keep a single
        // worker open for all requests.
        if (message.isNode) {
            _reply();
            self.close();
            return;
        }

        setTimeout(function () {
            _reply();
        }, message.options.delay * 1000);
    }

    /**
     * An array of the language patterns specified for each language
     *
     * @type {Object}
     */
    var patterns = {};

    /**
     * An object of languages mapping to what language they should inherit from
     *
     * @type {Object}
     */
    var inheritenceMap = {};

    /**
     * A mapping of language aliases
     *
     * @type {Object}
     */
    var aliases = {};

    /**
     * Representation of the actual rainbow object
     *
     * @type {Object}
     */
    var Rainbow = {};

    /**
     * Callback to fire after each block is highlighted
     *
     * @type {null|Function}
     */
    var onHighlightCallback;

    var isNode = isNode$1();
    var isWorker = isWorker$1();

    var cachedWorker = null;
    function _getWorker() {
        if (isNode || cachedWorker === null) {
            cachedWorker = createWorker(rainbowWorker, [Prism, util]);
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
        var worker = _getWorker();

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
     * @return {object}
     */
    function _getPrismOptions(options) {
        return {
            patterns: patterns,
            inheritenceMap: inheritenceMap,
            aliases: aliases,
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
        var options = {};
        if (typeof lang === 'object') {
            options = lang;
            lang = options.language;
        }

        lang = aliases[lang] || lang;

        var workerData = {
            id: String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now(),
            code: code,
            lang: lang,
            options: _getPrismOptions(options),
            isNode: isNode
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
        var waitingOn = { c: 0 };
        for (var i = 0, list = codeBlocks; i < list.length; i += 1) {
            var block = list[i];

            var language = getLanguageForBlock(block);
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

            var globalClass = block.getAttribute('data-global-class');
            var delay = parseInt(block.getAttribute('data-delay'), 10);

            ++waitingOn.c;
            _messageWorker(_getWorkerData(block.innerHTML, { language: language, globalClass: globalClass, delay: delay }), _generateHandler(block, waitingOn, callback));
        }

        if (waitingOn.c === 0) {
            callback();
        }
    }

    function _addPreloader(preBlock) {
        var preloader = document.createElement('div');
        preloader.className = 'preloader';
        for (var i = 0; i < 7; i++) {
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

        var preBlocks = node.getElementsByTagName('pre');
        var codeBlocks = node.getElementsByTagName('code');
        var finalPreBlocks = [];
        var finalCodeBlocks = [];

        // First loop through all pre blocks to find which ones to highlight
        for (var i = 0, list = preBlocks; i < list.length; i += 1) {
            var preBlock = list[i];

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
        for (var i$1 = 0, list$1 = codeBlocks; i$1 < list$1.length; i$1 += 1) {
            var codeBlock = list$1[i$1];

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

    /**
     * Starts the magic rainbow
     *
     * @return {void}
     */
    function color() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];


        // If you want to straight up highlight a string you can pass the
        // string of code, the language, and a callback function.
        //
        // Example:
        //
        // Rainbow.color(code, language, function(highlightedCode, language) {
        //     // this code block is now highlighted
        // });
        if (typeof args[0] === 'string') {
            var workerData = _getWorkerData(args[0], args[1]);
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
        extend: extend,
        onHighlight: onHighlight,
        addAlias: addAlias,
        color: color
    };

    if (isNode) {
        Rainbow.colorSync = function(code, lang) {
            var workerData = _getWorkerData(code, lang);
            var prism = new Prism(workerData.options);
            return prism.refract(workerData.code, workerData.lang);
        };
    }

    // In the browser hook it up to color on page load
    if (!isNode && !isWorker) {
        document.addEventListener('DOMContentLoaded', function (event) {
            if (!Rainbow.defer) {
                Rainbow.color(event);
            }
        }, false);
    }

    // From a node worker, handle the postMessage requests to it
    if (isWorker) {
        self.onmessage = rainbowWorker;
    }

    var Rainbow$1 = Rainbow;

    return Rainbow$1;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3ByaXNtLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9yYWluYm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIF9hZGRHbG9iYWwodGhpbmcpIHtcbiAgICBpZiAodHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBgXFxuJHt0aGluZy50b1N0cmluZygpfWA7XG4gICAgfVxuXG4gICAgbGV0IHRvQWRkID0gJyc7XG4gICAgaWYgKHR5cGVvZiB0aGluZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpbmcpIHtcbiAgICAgICAgICAgIHRvQWRkICs9IF9hZGRHbG9iYWwodGhpbmdba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG9BZGQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGUoKSB7XG4gICAgLyogZ2xvYmFscyBtb2R1bGUgKi9cbiAgICByZXR1cm4gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0Jztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzV29ya2VyKCkge1xuICAgIHJldHVybiB0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJztcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdXNhYmxlIHdlYiB3b3JrZXIgZnJvbSBhbiBhbm9ueW1vdXMgZnVuY3Rpb25cbiAqXG4gKiBtb3N0bHkgYm9ycm93ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vemV2ZXJvL3dvcmtlci1jcmVhdGVcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtBcnJheX0gZ2xvYmFscyBnbG9iYWwgZnVuY3Rpb25zIHRoYXQgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB3b3JrZXIgc2NvcGVcbiAqIEByZXR1cm4ge1dvcmtlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdvcmtlcihmbiwgZ2xvYmFscykge1xuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgICAvKiBnbG9iYWxzIGdsb2JhbCwgcmVxdWlyZSwgX19maWxlbmFtZSAqL1xuICAgICAgICBnbG9iYWwuV29ya2VyID0gcmVxdWlyZSgnd2Vid29ya2VyLXRocmVhZHMnKS5Xb3JrZXI7XG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKF9fZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShnbG9iYWxzKSkge1xuICAgICAgICBnbG9iYWxzID0gW2dsb2JhbHNdO1xuICAgIH1cblxuICAgIGxldCBjb2RlID0gJyc7XG4gICAgZm9yIChjb25zdCB0aGluZyBvZiBnbG9iYWxzKSB7XG4gICAgICAgIGNvZGUgKz0gX2FkZEdsb2JhbCh0aGluZyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBhbiBhd2Z1bCBoYWNrLCBidXQgc29tZXRoaW5nIHRvIGRvIHdpdGggaG93IHVnbGlmeSByZW5hbWVzIHN0dWZmXG4gICAgLy8gYW5kIHJvbGx1cCBtZWFucyB0aGF0IHRoZSB2YXJpYWJsZSB0aGUgd29ya2VyLmpzIGlzIHVzaW5nIHRvIHJlZmVyZW5jZVxuICAgIC8vIFByaXNtIHdpbGwgbm90IGJlIHRoZSBzYW1lIG9uZSBhdmFpbGFibGUgaW4gdGhpcyBjb250ZXh0XG4gICAgY29uc3QgcHJpc21OYW1lID0gZ2xvYmFsc1swXS50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvbiAoXFx3Kj8pXFwoLylbMV07XG4gICAgbGV0IHN0ciA9IGZuLnRvU3RyaW5nKCk7XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLz1uZXcgXFx3Ki8sIGA9IG5ldyAke3ByaXNtTmFtZX1gKTtcblxuICAgIGNvbnN0IGZ1bGxTdHJpbmcgPSBgJHtjb2RlfVxcdHRoaXMub25tZXNzYWdlID0ke3N0cn1gO1xuXG4gICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtmdWxsU3RyaW5nXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KTtcbiAgICByZXR1cm4gbmV3IFdvcmtlcigod2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMKS5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEdldHMgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGJsb2NrIG9mIGNvZGVcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJsb2NrXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spIHtcblxuICAgIC8vIElmIHRoaXMgZG9lc24ndCBoYXZlIGEgbGFuZ3VhZ2UgYnV0IHRoZSBwYXJlbnQgZG9lcyB0aGVuIHVzZSB0aGF0LlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBpZiBmb3IgZXhhbXBsZSB5b3UgaGF2ZTogPHByZSBkYXRhLWxhbmd1YWdlPVwicGhwXCI+XG4gICAgLy8gd2l0aCBhIGJ1bmNoIG9mIDxjb2RlPiBibG9ja3MgaW5zaWRlIHRoZW4geW91IGRvIG5vdCBoYXZlXG4gICAgLy8gdG8gc3BlY2lmeSB0aGUgbGFuZ3VhZ2UgZm9yIGVhY2ggYmxvY2suXG4gICAgbGV0IGxhbmd1YWdlID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJykgfHwgYmxvY2sucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnKTtcblxuICAgIC8vIFRoaXMgYWRkcyBzdXBwb3J0IGZvciBzcGVjaWZ5aW5nIGxhbmd1YWdlIHZpYSBhIENTUyBjbGFzcy5cbiAgICAvL1xuICAgIC8vIFlvdSBjYW4gdXNlIHRoZSBHb29nbGUgQ29kZSBQcmV0dGlmeSBzdHlsZTogPHByZSBjbGFzcz1cImxhbmctcGhwXCI+XG4gICAgLy8gb3IgdGhlIEhUTUw1IHN0eWxlOiA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtcGhwXCI+XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1xcYmxhbmcoPzp1YWdlKT8tKFxcdyspLztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBibG9jay5jbGFzc05hbWUubWF0Y2gocGF0dGVybikgfHwgYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBsYW5ndWFnZSA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGRpZmZlcmVudCBtYXRjaGVzIGhhdmUgY29tcGxldGUgb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXJcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQxICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICBlbmQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDIgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQyICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29tcGxldGVPdmVybGFwKHN0YXJ0MSwgZW5kMSwgc3RhcnQyLCBlbmQyKSB7XG5cbiAgICAvLyBJZiB0aGUgc3RhcnRpbmcgYW5kIGVuZCBwb3NpdGlvbnMgYXJlIGV4YWN0bHkgdGhlIHNhbWVcbiAgICAvLyB0aGVuIHRoZSBmaXJzdCBvbmUgc2hvdWxkIHN0YXkgYW5kIHRoaXMgb25lIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChzdGFydDIgPT09IHN0YXJ0MSAmJiBlbmQyID09PSBlbmQxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQyIDw9IHN0YXJ0MSAmJiBlbmQyID49IGVuZDE7XG59XG5cbi8qKlxuICogRW5jb2RlcyA8IGFuZCA+IGFzIGh0bWwgZW50aXRpZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaHRtbEVudGl0aWVzKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyYoPyFbXFx3XFwjXSs7KS9nLCAnJmFtcDsnKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvdXQgdGhlIHBvc2l0aW9uIG9mIGdyb3VwIG1hdGNoIGZvciBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICpcbiAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTg1NTk0L2hvdy10by1maW5kLWluZGV4LW9mLWdyb3Vwcy1pbi1tYXRjaFxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBOdW1iZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBOdW1iZXIpIHtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cE51bWJlcjsgKytpKSB7XG4gICAgICAgIGlmIChtYXRjaFtpXSkge1xuICAgICAgICAgICAgaW5kZXggKz0gbWF0Y2hbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBuZXcgbWF0Y2ggaW50ZXJzZWN0cyB3aXRoIGFuIGV4aXN0aW5nIG9uZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDEgICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICAgZW5kIHBvc2l0aW9uIG9mIGV4aXN0aW5nIG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQyICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZDIgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhzdGFydDEsIGVuZDEsIHN0YXJ0MiwgZW5kMikge1xuICAgIGlmIChzdGFydDIgPj0gc3RhcnQxICYmIHN0YXJ0MiA8IGVuZDEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuZDIgPiBzdGFydDEgJiYgZW5kMiA8IGVuZDE7XG59XG5cbi8qKlxuICogU29ydHMgYW4gb2JqZWN0cyBrZXlzIGJ5IGluZGV4IGRlc2NlbmRpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgbG9jYXRpb25zLnB1c2gobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbnVtZXJpYyBkZXNjZW5kaW5nXG4gICAgcmV0dXJuIGxvY2F0aW9ucy5zb3J0KChhLCBiKSA9PiBiIC0gYSk7XG59XG5cbi8qKlxuICogU3Vic3RyaW5nIHJlcGxhY2UgY2FsbCB0byByZXBsYWNlIHBhcnQgb2YgYSBzdHJpbmcgYXQgYSBjZXJ0YWluIHBvc2l0aW9uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uICAgICAgICAgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGhhcHBlblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2UgICAgICAgICAgdGhlIHRleHQgd2Ugd2FudCB0byByZXBsYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZVdpdGggICAgICB0aGUgdGV4dCB3ZSB3YW50IHRvIHJlcGxhY2UgaXQgd2l0aFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICAgICAgdGhlIGNvZGUgd2UgYXJlIGRvaW5nIHRoZSByZXBsYWNpbmcgaW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlLCByZXBsYWNlV2l0aCwgY29kZSkge1xuICAgIGNvbnN0IHN1YlN0cmluZyA9IGNvZGUuc3Vic3RyKHBvc2l0aW9uKTtcbiAgICByZXR1cm4gY29kZS5zdWJzdHIoMCwgcG9zaXRpb24pICsgc3ViU3RyaW5nLnJlcGxhY2UocmVwbGFjZSwgcmVwbGFjZVdpdGgpO1xufVxuIiwiaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIFByaXNtIGlzIGEgY2xhc3MgdXNlZCB0byBoaWdobGlnaHQgaW5kaXZpZHVhbCBibG9ja3Mgb2YgY29kZVxuICpcbiAqIEBjbGFzc1xuICovXG5jbGFzcyBQcmlzbSB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICAvKipcbiAgICAgICAgICogT2JqZWN0IG9mIHJlcGxhY2VtZW50cyB0byBwcm9jZXNzIGF0IHRoZSBlbmQgb2YgdGhlIHByb2Nlc3NpbmdcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMYW5ndWFnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBQcmlzbSBvYmplY3RcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGxldCBjdXJyZW50TGFuZ3VhZ2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9iamVjdCBvZiBzdGFydCBhbmQgZW5kIHBvc2l0aW9ucyBvZiBibG9ja3MgdG8gYmUgcmVwbGFjZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50UG9zaXRpb25zID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgaWYgdGhlIG1hdGNoIHBhc3NlZCBpbiBmYWxscyBpbnNpZGUgb2YgYW4gZXhpc3RpbmcgbWF0Y2guXG4gICAgICAgICAqIFRoaXMgcHJldmVudHMgYSByZWdleCBwYXR0ZXJuIGZyb20gbWF0Y2hpbmcgaW5zaWRlIG9mIGFub3RoZXIgcGF0dGVyblxuICAgICAgICAgKiB0aGF0IG1hdGNoZXMgYSBsYXJnZXIgYW1vdW50IG9mIGNvZGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBleGFtcGxlIHRoaXMgcHJldmVudHMgYSBrZXl3b3JkIGZyb20gbWF0Y2hpbmcgYGZ1bmN0aW9uYCBpZiB0aGVyZVxuICAgICAgICAgKiBpcyBhbHJlYWR5IGEgbWF0Y2ggZm9yIGBmdW5jdGlvbiAoLiopYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0ICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZW5kICAgICAgZW5kIHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX21hdGNoSXNJbnNpZGVPdGhlck1hdGNoKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiByZXBsYWNlbWVudFBvc2l0aW9ucykge1xuICAgICAgICAgICAgICAgIGtleSA9IHBhcnNlSW50KGtleSwgMTApO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBibG9jayBjb21wbGV0ZWx5IG92ZXJsYXBzIHdpdGggYW5vdGhlciBibG9ja1xuICAgICAgICAgICAgICAgIC8vIHRoZW4gd2Ugc2hvdWxkIHJlbW92ZSB0aGUgb3RoZXIgYmxvY2sgYW5kIHJldHVybiBgZmFsc2VgLlxuICAgICAgICAgICAgICAgIGlmICh1dGlsLmhhc0NvbXBsZXRlT3ZlcmxhcChrZXksIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV0sIHN0YXJ0LCBlbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXBsYWNlbWVudFBvc2l0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVwbGFjZW1lbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHV0aWwuaW50ZXJzZWN0cyhrZXksIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV0sIHN0YXJ0LCBlbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRha2VzIGEgc3RyaW5nIG9mIGNvZGUgYW5kIHdyYXBzIGl0IGluIGEgc3BhbiB0YWcgYmFzZWQgb24gdGhlIG5hbWVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgICAgICAgIG5hbWUgb2YgdGhlIHBhdHRlcm4gKGllIGtleXdvcmQucmVnZXgpXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICAgICBibG9jayBvZiBjb2RlIHRvIHdyYXBcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbENsYXNzIGNsYXNzIHRvIGFwcGx5IHRvIGV2ZXJ5IHNwYW5cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3dyYXBDb2RlSW5TcGFuKG5hbWUsIGNvZGUpIHtcbiAgICAgICAgICAgIGxldCBjbGFzc05hbWUgPSBuYW1lLnJlcGxhY2UoL1xcLi9nLCAnICcpO1xuXG4gICAgICAgICAgICBjb25zdCBnbG9iYWxDbGFzcyA9IG9wdGlvbnMuZ2xvYmFsQ2xhc3M7XG4gICAgICAgICAgICBpZiAoZ2xvYmFsQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgKz0gYCAke2dsb2JhbENsYXNzfWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBgPHNwYW4gY2xhc3M9XCIke2NsYXNzTmFtZX1cIj4ke2NvZGV9PC9zcGFuPmA7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvY2VzcyByZXBsYWNlbWVudHMgaW4gdGhlIHN0cmluZyBvZiBjb2RlIHRvIGFjdHVhbGx5IHVwZGF0ZVxuICAgICAgICAgKiB0aGUgbWFya3VwXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICAgICAgdGhlIGNvZGUgdG8gcHJvY2VzcyByZXBsYWNlbWVudHMgaW5cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NSZXBsYWNlbWVudHMoY29kZSkge1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gdXRpbC5rZXlzKHJlcGxhY2VtZW50cyk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBvc2l0aW9uIG9mIHBvc2l0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnRzW3Bvc2l0aW9uXTtcbiAgICAgICAgICAgICAgICBjb2RlID0gdXRpbC5yZXBsYWNlQXRQb3NpdGlvbihwb3NpdGlvbiwgcmVwbGFjZW1lbnQucmVwbGFjZSwgcmVwbGFjZW1lbnQud2l0aCwgY29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXRjaGVzIGEgcmVnZXggcGF0dGVybiBhZ2FpbnN0IGEgYmxvY2sgb2YgY29kZSwgZmluZHMgYWxsIG1hdGNoZXNcbiAgICAgICAgICogdGhhdCBzaG91bGQgYmUgcHJvY2Vzc2VkLCBhbmQgc3RvcmVzIHRoZSBwb3NpdGlvbnMgb2Ygd2hlcmUgdGhleVxuICAgICAgICAgKiBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aGluIHRoZSBzdHJpbmcuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgaXMgd2hlcmUgcHJldHR5IG11Y2ggYWxsIHRoZSB3b3JrIGlzIGRvbmUgYnV0IGl0IHNob3VsZCBub3RcbiAgICAgICAgICogYmUgY2FsbGVkIGRpcmVjdGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcGF0dGVyblxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NQYXR0ZXJuKHBhdHRlcm4sIGNvZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gcGF0dGVybi5wYXR0ZXJuO1xuICAgICAgICAgICAgaWYgKCFyZWdleCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleC5leGVjKGNvZGUpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJlYXQgbWF0Y2ggMCB0aGUgc2FtZSB3YXkgYXMgbmFtZVxuICAgICAgICAgICAgaWYgKCFwYXR0ZXJuLm5hbWUgJiYgdHlwZW9mIHBhdHRlcm4ubWF0Y2hlc1swXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLm5hbWUgPSBwYXR0ZXJuLm1hdGNoZXNbMF07XG4gICAgICAgICAgICAgICAgZGVsZXRlIHBhdHRlcm4ubWF0Y2hlc1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHJlcGxhY2VtZW50ID0gbWF0Y2hbMF07XG4gICAgICAgICAgICBjb25zdCBzdGFydFBvcyA9IG1hdGNoLmluZGV4O1xuICAgICAgICAgICAgY29uc3QgZW5kUG9zID0gbWF0Y2hbMF0ubGVuZ3RoICsgc3RhcnRQb3M7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IGEgY2hpbGQgbWF0Y2ggYW5kIGl0IGZhbGxzIGluc2lkZSBvZiBhbm90aGVyXG4gICAgICAgICAgICAvLyBtYXRjaCB0aGF0IGFscmVhZHkgaGFwcGVuZWQgd2Ugc2hvdWxkIHNraXAgaXQgYW5kIGNvbnRpbnVlXG4gICAgICAgICAgICAvLyBwcm9jZXNzaW5nLlxuICAgICAgICAgICAgaWYgKF9tYXRjaElzSW5zaWRlT3RoZXJNYXRjaChzdGFydFBvcywgZW5kUG9zKSkge1xuICAgICAgICAgICAgICAgIF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCBjb2RlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsbGJhY2sgZm9yIHdoZW4gYSBtYXRjaCB3YXMgc3VjY2Vzc2Z1bGx5IHByb2Nlc3NlZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBsXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1hdGNoU3VjY2VzcyhyZXBsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIG1hdGNoIGhhcyBhIG5hbWUgdGhlbiB3cmFwIGl0IGluIGEgc3BhbiB0YWdcbiAgICAgICAgICAgICAgICBpZiAocGF0dGVybi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGwgPSBfd3JhcENvZGVJblNwYW4ocGF0dGVybi5uYW1lLCByZXBsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBGb3IgZGVidWdnaW5nXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1JlcGxhY2UgJyArIG1hdGNoWzBdICsgJyB3aXRoICcgKyByZXBsYWNlbWVudCArICcgYXQgcG9zaXRpb24gJyArIHN0YXJ0UG9zICsgJyB0byAnICsgZW5kUG9zKTtcblxuICAgICAgICAgICAgICAgIC8vIFN0b3JlIHdoYXQgbmVlZHMgdG8gYmUgcmVwbGFjZWQgd2l0aCB3aGF0IGF0IHRoaXMgcG9zaXRpb25cbiAgICAgICAgICAgICAgICByZXBsYWNlbWVudHNbc3RhcnRQb3NdID0ge1xuICAgICAgICAgICAgICAgICAgICAncmVwbGFjZSc6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAnd2l0aCc6IHJlcGxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlIHJhbmdlIG9mIHRoaXMgbWF0Y2ggc28gd2UgY2FuIHVzZSBpdCBmb3JcbiAgICAgICAgICAgICAgICAvLyBjb21wYXJpc29ucyB3aXRoIG90aGVyIG1hdGNoZXMgbGF0ZXIuXG4gICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQb3NpdGlvbnNbc3RhcnRQb3NdID0gZW5kUG9zO1xuXG4gICAgICAgICAgICAgICAgX3Byb2Nlc3NQYXR0ZXJuKHBhdHRlcm4sIGNvZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhlbHBlciBmdW5jdGlvbiBmb3IgcHJvY2Vzc2luZyBhIHN1YiBncm91cFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBncm91cEtleSAgICAgIGluZGV4IG9mIGdyb3VwXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc0dyb3VwKGdyb3VwS2V5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvY2sgPSBtYXRjaFtncm91cEtleV07XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBtYXRjaCBoZXJlIHRoZW4gbW92ZSBvblxuICAgICAgICAgICAgICAgIGlmICghYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gcGF0dGVybi5tYXRjaGVzW2dyb3VwS2V5XTtcbiAgICAgICAgICAgICAgICBjb25zdCBsYW5ndWFnZSA9IGdyb3VwLmxhbmd1YWdlO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUHJvY2VzcyBncm91cCBpcyB3aGF0IGdyb3VwIHdlIHNob3VsZCB1c2UgdG8gYWN0dWFsbHkgcHJvY2Vzc1xuICAgICAgICAgICAgICAgICAqIHRoaXMgbWF0Y2ggZ3JvdXAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBGb3IgZXhhbXBsZSBpZiB0aGUgc3ViZ3JvdXAgcGF0dGVybiBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAyOiB7XG4gICAgICAgICAgICAgICAgICogICAgICduYW1lJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAqICAgICAncGF0dGVybic6IC90cnVlL2dcbiAgICAgICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiB0aGVuIHdlIHVzZSB0aGF0IGFzIGlzLCBidXQgaWYgaXQgbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogMjoge1xuICAgICAgICAgICAgICAgICAqICAgICAnbmFtZSc6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgICAgICAgKiAgICAgJ21hdGNoZXMnOiB7XG4gICAgICAgICAgICAgICAgICogICAgICAgICAgJ25hbWUnOiAnc3BlY2lhbCcsXG4gICAgICAgICAgICAgICAgICogICAgICAgICAgJ3BhdHRlcm4nOiAvd2hhdGV2ZXIvZ1xuICAgICAgICAgICAgICAgICAqICAgICAgfVxuICAgICAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIHdlIHRyZWF0IHRoZSAnbWF0Y2hlcycgcGFydCBhcyB0aGUgcGF0dGVybiBhbmQga2VlcFxuICAgICAgICAgICAgICAgICAqIHRoZSBuYW1lIGFyb3VuZCB0byB3cmFwIGl0IHdpdGggbGF0ZXJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBjb25zdCBncm91cFRvUHJvY2VzcyA9IGdyb3VwLm5hbWUgJiYgZ3JvdXAubWF0Y2hlcyA/IGdyb3VwLm1hdGNoZXMgOiBncm91cDtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRha2VzIHRoZSBjb2RlIGJsb2NrIG1hdGNoZWQgYXQgdGhpcyBncm91cCwgcmVwbGFjZXMgaXRcbiAgICAgICAgICAgICAgICAgKiB3aXRoIHRoZSBoaWdobGlnaHRlZCBibG9jaywgYW5kIG9wdGlvbmFsbHkgd3JhcHMgaXQgd2l0aFxuICAgICAgICAgICAgICAgICAqIGEgc3BhbiB3aXRoIGEgbmFtZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3NlZEJsb2NrXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2VCbG9ja1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IG1hdGNoTmFtZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IF9nZXRSZXBsYWNlbWVudCA9IGZ1bmN0aW9uKHBhc3NlZEJsb2NrLCByZXBsYWNlQmxvY2ssIG1hdGNoTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXBsYWNlbWVudCA9IHV0aWwucmVwbGFjZUF0UG9zaXRpb24odXRpbC5pbmRleE9mR3JvdXAobWF0Y2gsIGdyb3VwS2V5KSwgcGFzc2VkQmxvY2ssIG1hdGNoTmFtZSA/IF93cmFwQ29kZUluU3BhbihtYXRjaE5hbWUsIHJlcGxhY2VCbG9jaykgOiByZXBsYWNlQmxvY2ssIHJlcGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgc3RyaW5nIHRoZW4gdGhpcyBtYXRjaCBpcyBkaXJlY3RseSBtYXBwZWRcbiAgICAgICAgICAgICAgICAvLyB0byBzZWxlY3RvciBzbyBhbGwgd2UgaGF2ZSB0byBkbyBpcyB3cmFwIGl0IGluIGEgc3BhblxuICAgICAgICAgICAgICAgIC8vIGFuZCBjb250aW51ZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdyb3VwID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGJsb2NrLCBncm91cCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgbG9jYWxDb2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHN1Ymxhbmd1YWdlIGdvIGFuZCBwcm9jZXNzIHRoZSBibG9jayB1c2luZ1xuICAgICAgICAgICAgICAgIC8vIHRoYXQgbGFuZ3VhZ2VcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDb2RlID0gcHJpc20ucmVmcmFjdChibG9jaywgbGFuZ3VhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGxvY2FsQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcHJvY2VzcyBncm91cCBjYW4gYmUgYSBzaW5nbGUgcGF0dGVybiBvciBhbiBhcnJheSBvZlxuICAgICAgICAgICAgICAgIC8vIHBhdHRlcm5zLiBgX3Byb2Nlc3NDb2RlV2l0aFBhdHRlcm5zYCBhbHdheXMgZXhwZWN0cyBhbiBhcnJheVxuICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNvbnZlcnQgaXQgaGVyZS5cbiAgICAgICAgICAgICAgICBsb2NhbENvZGUgPSBwcmlzbS5yZWZyYWN0KGJsb2NrLCBjdXJyZW50TGFuZ3VhZ2UsIGdyb3VwVG9Qcm9jZXNzLmxlbmd0aCA/IGdyb3VwVG9Qcm9jZXNzIDogW2dyb3VwVG9Qcm9jZXNzXSk7XG4gICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBsb2NhbENvZGUsIGdyb3VwLm1hdGNoZXMgPyBncm91cC5uYW1lIDogMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgcGF0dGVybiBoYXMgc3ViIG1hdGNoZXMgZm9yIGRpZmZlcmVudCBncm91cHMgaW4gdGhlIHJlZ2V4XG4gICAgICAgICAgICAvLyB0aGVuIHdlIHNob3VsZCBwcm9jZXNzIHRoZW0gb25lIGF0IGEgdGltZSBieSBydW5uaW5nIHRoZW0gdGhyb3VnaFxuICAgICAgICAgICAgLy8gdGhlIF9wcm9jZXNzR3JvdXAgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgdGhlIG5ldyByZXBsYWNlbWVudC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXZSB1c2UgdGhlIGBrZXlzYCBmdW5jdGlvbiB0byBydW4gdGhyb3VnaCB0aGVtIGJhY2t3YXJkcyBiZWNhdXNlXG4gICAgICAgICAgICAvLyB0aGUgbWF0Y2ggcG9zaXRpb24gb2YgZWFybGllciBtYXRjaGVzIHdpbGwgbm90IGNoYW5nZSBkZXBlbmRpbmdcbiAgICAgICAgICAgIC8vIG9uIHdoYXQgZ2V0cyByZXBsYWNlZCBpbiBsYXRlciBtYXRjaGVzLlxuICAgICAgICAgICAgY29uc3QgZ3JvdXBLZXlzID0gdXRpbC5rZXlzKHBhdHRlcm4ubWF0Y2hlcyk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGdyb3VwS2V5IG9mIGdyb3VwS2V5cykge1xuICAgICAgICAgICAgICAgIF9wcm9jZXNzR3JvdXAoZ3JvdXBLZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaW5hbGx5LCBjYWxsIGBvbk1hdGNoU3VjY2Vzc2Agd2l0aCB0aGUgcmVwbGFjZW1lbnRcbiAgICAgICAgICAgIG9uTWF0Y2hTdWNjZXNzKHJlcGxhY2VtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzZXMgYSBibG9jayBvZiBjb2RlIHVzaW5nIHNwZWNpZmllZCBwYXR0ZXJuc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXR0ZXJuc1xuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc0NvZGVXaXRoUGF0dGVybnMoY29kZSwgcGF0dGVybnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgICAgICAgICAgIF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCBjb2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2UgYXJlIGRvbmUgcHJvY2Vzc2luZyB0aGUgcGF0dGVybnMgc28gd2Ugc2hvdWxkIGFjdHVhbGx5IHJlcGxhY2VcbiAgICAgICAgICAgIC8vIHdoYXQgbmVlZHMgdG8gYmUgcmVwbGFjZWQgaW4gdGhlIGNvZGUuXG4gICAgICAgICAgICByZXR1cm4gX3Byb2Nlc3NSZXBsYWNlbWVudHMoY29kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIGxpc3Qgb2YgcmVnZXggcGF0dGVybnMgZm9yIHRoaXMgbGFuZ3VhZ2VcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0UGF0dGVybnNGb3JMYW5ndWFnZShsYW5ndWFnZSkge1xuICAgICAgICAgICAgbGV0IHBhdHRlcm5zID0gb3B0aW9ucy5wYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW107XG4gICAgICAgICAgICB3aGlsZSAob3B0aW9ucy5pbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0pIHtcbiAgICAgICAgICAgICAgICBsYW5ndWFnZSA9IG9wdGlvbnMuaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdO1xuICAgICAgICAgICAgICAgIHBhdHRlcm5zID0gcGF0dGVybnMuY29uY2F0KG9wdGlvbnMucGF0dGVybnNbbGFuZ3VhZ2VdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBhdHRlcm5zO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRha2VzIGEgc3RyaW5nIG9mIGNvZGUgYW5kIGhpZ2hsaWdodHMgaXQgYWNjb3JkaW5nIHRvIHRoZSBsYW5ndWFnZVxuICAgICAgICAgKiBzcGVjaWZpZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXR0ZXJucyBvcHRpb25hbGx5IHNwZWNpZnkgYSBsaXN0IG9mIHBhdHRlcm5zXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9oaWdobGlnaHRCbG9ja0Zvckxhbmd1YWdlKGNvZGUsIGxhbmd1YWdlLCBwYXR0ZXJucykge1xuICAgICAgICAgICAgY3VycmVudExhbmd1YWdlID0gbGFuZ3VhZ2U7XG4gICAgICAgICAgICBwYXR0ZXJucyA9IHBhdHRlcm5zIHx8IGdldFBhdHRlcm5zRm9yTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgICAgICAgICAgcmV0dXJuIF9wcm9jZXNzQ29kZVdpdGhQYXR0ZXJucyh1dGlsLmh0bWxFbnRpdGllcyhjb2RlKSwgcGF0dGVybnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyYWN0ID0gX2hpZ2hsaWdodEJsb2NrRm9yTGFuZ3VhZ2U7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcmlzbTtcbiIsImltcG9ydCBQcmlzbSBmcm9tICcuL3ByaXNtJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmFpbmJvd1dvcmtlcihlKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKG1lc3NhZ2Uub3B0aW9ucyk7XG4gICAgY29uc3QgcmVzdWx0ID0gcHJpc20ucmVmcmFjdChtZXNzYWdlLmNvZGUsIG1lc3NhZ2UubGFuZyk7XG5cbiAgICBmdW5jdGlvbiBfcmVwbHkoKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgaWQ6IG1lc3NhZ2UuaWQsXG4gICAgICAgICAgICBsYW5nOiBtZXNzYWdlLmxhbmcsXG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSSByZWFsaXplZCBkb3duIHRoZSByb2FkIEkgbWlnaHQgbG9vayBhdCB0aGlzIGFuZCB3b25kZXIgd2hhdCBpcyBnb2luZyBvblxuICAgIC8vIHNvIHByb2JhYmx5IGl0IGlzIG5vdCBhIGJhZCBpZGVhIHRvIGxlYXZlIGEgY29tbWVudC5cbiAgICAvL1xuICAgIC8vIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgcmlnaHQgbm93IHRoZSBub2RlIGxpYnJhcnkgZm9yIHNpbXVsYXRpbmcgd2ViXG4gICAgLy8gd29ya2VycyDigJx3ZWJ3b3JrZXItdGhyZWFkc+KAnSB3aWxsIGtlZXAgdGhlIHdvcmtlciBvcGVuIGFuZCBpdCBjYXVzZXNcbiAgICAvLyBzY3JpcHRzIHJ1bm5pbmcgZnJvbSB0aGUgY29tbWFuZCBsaW5lIHRvIGhhbmcgdW5sZXNzIHRoZSB3b3JrZXIgaXNcbiAgICAvLyBleHBsaWNpdGx5IGNsb3NlZC5cbiAgICAvL1xuICAgIC8vIFRoaXMgbWVhbnMgZm9yIG5vZGUgd2Ugd2lsbCBzcGF3biBhIG5ldyB0aHJlYWQgZm9yIGV2ZXJ5IGFzeW5jaHJvbm91c1xuICAgIC8vIGJsb2NrIHdlIGFyZSBoaWdobGlnaHRpbmcsIGJ1dCBpbiB0aGUgYnJvd3NlciB3ZSB3aWxsIGtlZXAgYSBzaW5nbGVcbiAgICAvLyB3b3JrZXIgb3BlbiBmb3IgYWxsIHJlcXVlc3RzLlxuICAgIGlmIChtZXNzYWdlLmlzTm9kZSkge1xuICAgICAgICBfcmVwbHkoKTtcbiAgICAgICAgc2VsZi5jbG9zZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIF9yZXBseSgpO1xuICAgIH0sIG1lc3NhZ2Uub3B0aW9ucy5kZWxheSAqIDEwMDApO1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IENyYWlnIENhbXBiZWxsXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogUmFpbmJvdyBpcyBhIHNpbXBsZSBjb2RlIHN5bnRheCBoaWdobGlnaHRlclxuICpcbiAqIEBzZWUgcmFpbmJvd2NvLmRlXG4gKi9cbmltcG9ydCBQcmlzbSBmcm9tICcuL3ByaXNtJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsJztcbmltcG9ydCByYWluYm93V29ya2VyIGZyb20gJy4vd29ya2VyJztcblxuLyoqXG4gKiBBbiBhcnJheSBvZiB0aGUgbGFuZ3VhZ2UgcGF0dGVybnMgc3BlY2lmaWVkIGZvciBlYWNoIGxhbmd1YWdlXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgcGF0dGVybnMgPSB7fTtcblxuLyoqXG4gKiBBbiBvYmplY3Qgb2YgbGFuZ3VhZ2VzIG1hcHBpbmcgdG8gd2hhdCBsYW5ndWFnZSB0aGV5IHNob3VsZCBpbmhlcml0IGZyb21cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCBpbmhlcml0ZW5jZU1hcCA9IHt9O1xuXG4vKipcbiAqIEEgbWFwcGluZyBvZiBsYW5ndWFnZSBhbGlhc2VzXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgYWxpYXNlcyA9IHt9O1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIHRoZSBhY3R1YWwgcmFpbmJvdyBvYmplY3RcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5sZXQgUmFpbmJvdyA9IHt9O1xuXG4vKipcbiAqIENhbGxiYWNrIHRvIGZpcmUgYWZ0ZXIgZWFjaCBibG9jayBpcyBoaWdobGlnaHRlZFxuICpcbiAqIEB0eXBlIHtudWxsfEZ1bmN0aW9ufVxuICovXG5sZXQgb25IaWdobGlnaHRDYWxsYmFjaztcblxuY29uc3QgaXNOb2RlID0gdXRpbC5pc05vZGUoKTtcbmNvbnN0IGlzV29ya2VyID0gdXRpbC5pc1dvcmtlcigpO1xuXG5sZXQgY2FjaGVkV29ya2VyID0gbnVsbDtcbmZ1bmN0aW9uIF9nZXRXb3JrZXIoKSB7XG4gICAgaWYgKGlzTm9kZSB8fCBjYWNoZWRXb3JrZXIgPT09IG51bGwpIHtcbiAgICAgICAgY2FjaGVkV29ya2VyID0gdXRpbC5jcmVhdGVXb3JrZXIocmFpbmJvd1dvcmtlciwgW1ByaXNtLCB1dGlsXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhY2hlZFdvcmtlcjtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZm9yIG1hdGNoaW5nIHVwIGNhbGxiYWNrcyBkaXJlY3RseSB3aXRoIHRoZVxuICogcG9zdCBtZXNzYWdlIHJlcXVlc3RzIHRvIGEgd2ViIHdvcmtlci5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gbWVzc2FnZSAgICAgIGRhdGEgdG8gc2VuZCB0byB3ZWIgd29ya2VyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAgIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciB3b3JrZXIgdG8gcmVwbHkgdG9cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9tZXNzYWdlV29ya2VyKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgd29ya2VyID0gX2dldFdvcmtlcigpO1xuXG4gICAgZnVuY3Rpb24gX2xpc3RlbihlKSB7XG4gICAgICAgIGlmIChlLmRhdGEuaWQgPT09IG1lc3NhZ2UuaWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGUuZGF0YSk7XG4gICAgICAgICAgICB3b3JrZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF9saXN0ZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBfbGlzdGVuKTtcbiAgICB3b3JrZXIucG9zdE1lc3NhZ2UobWVzc2FnZSk7XG59XG5cbi8qKlxuICogQnJvd3NlciBPbmx5IC0gSGFuZGxlcyByZXNwb25zZSBmcm9tIHdlYiB3b3JrZXIsIHVwZGF0ZXMgRE9NIHdpdGhcbiAqIHJlc3VsdGluZyBjb2RlLCBhbmQgZmlyZXMgY2FsbGJhY2tcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSB3YWl0aW5nT25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfZ2VuZXJhdGVIYW5kbGVyKGVsZW1lbnQsIHdhaXRpbmdPbiwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gX2hhbmRsZVJlc3BvbnNlRnJvbVdvcmtlcihkYXRhKSB7XG4gICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gZGF0YS5yZXN1bHQ7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuXG4gICAgICAgIGlmIChlbGVtZW50LnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ1BSRScpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIChlKSA9PiB7XG4gICAgICAgIC8vICAgICBpZiAoZS5hbmltYXRpb25OYW1lID09PSAnZmFkZS1pbicpIHtcbiAgICAgICAgLy8gICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdkZWNyZWFzZS1kZWxheScpO1xuICAgICAgICAvLyAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9KTtcblxuICAgICAgICBpZiAob25IaWdobGlnaHRDYWxsYmFjaykge1xuICAgICAgICAgICAgb25IaWdobGlnaHRDYWxsYmFjayhlbGVtZW50LCBkYXRhLmxhbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKC0td2FpdGluZ09uLmMgPT09IDApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vKipcbiAqIEdldHMgb3B0aW9ucyBuZWVkZWQgdG8gcGFzcyBpbnRvIFByaXNtXG4gKlxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBfZ2V0UHJpc21PcHRpb25zKG9wdGlvbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBwYXR0ZXJucyxcbiAgICAgICAgaW5oZXJpdGVuY2VNYXAsXG4gICAgICAgIGFsaWFzZXMsXG4gICAgICAgIGdsb2JhbENsYXNzOiBvcHRpb25zLmdsb2JhbENsYXNzLFxuICAgICAgICBkZWxheTogIWlzTmFOKG9wdGlvbnMuZGVsYXkpID8gb3B0aW9ucy5kZWxheSA6IDBcbiAgICB9O1xufVxuXG4vKipcbiAqIEdldHMgZGF0YSB0byBzZW5kIHRvIHdlYndvcmtlclxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHBhcmFtICB7c3RyaW5nfSBsYW5nXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIF9nZXRXb3JrZXJEYXRhKGNvZGUsIGxhbmcpIHtcbiAgICBsZXQgb3B0aW9ucyA9IHt9O1xuICAgIGlmICh0eXBlb2YgbGFuZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgb3B0aW9ucyA9IGxhbmc7XG4gICAgICAgIGxhbmcgPSBvcHRpb25zLmxhbmd1YWdlO1xuICAgIH1cblxuICAgIGxhbmcgPSBhbGlhc2VzW2xhbmddIHx8IGxhbmc7XG5cbiAgICBjb25zdCB3b3JrZXJEYXRhID0ge1xuICAgICAgICBpZDogU3RyaW5nLmZyb21DaGFyQ29kZSg2NSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI2KSkgKyBEYXRlLm5vdygpLFxuICAgICAgICBjb2RlLFxuICAgICAgICBsYW5nLFxuICAgICAgICBvcHRpb25zOiBfZ2V0UHJpc21PcHRpb25zKG9wdGlvbnMpLFxuICAgICAgICBpc05vZGVcbiAgICB9O1xuXG4gICAgcmV0dXJuIHdvcmtlckRhdGE7XG59XG5cbi8qKlxuICogQnJvd3NlciBPbmx5IC0gU2VuZHMgbWVzc2FnZXMgdG8gd2ViIHdvcmtlciB0byBoaWdobGlnaHQgZWxlbWVudHMgcGFzc2VkXG4gKiBpblxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGNvZGVCbG9ja3NcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfaGlnaGxpZ2h0Q29kZUJsb2Nrcyhjb2RlQmxvY2tzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHdhaXRpbmdPbiA9IHsgYzogMCB9O1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgY29kZUJsb2Nrcykge1xuICAgICAgICBjb25zdCBsYW5ndWFnZSA9IHV0aWwuZ2V0TGFuZ3VhZ2VGb3JCbG9jayhibG9jayk7XG4gICAgICAgIGlmIChibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ3JhaW5ib3cnKSB8fCAhbGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBjYW5jZWxzIHRoZSBwZW5kaW5nIGFuaW1hdGlvbiB0byBmYWRlIHRoZSBjb2RlIGluIG9uIGxvYWRcbiAgICAgICAgLy8gc2luY2Ugd2Ugd2FudCB0byBkZWxheSBkb2luZyB0aGlzIHVudGlsIGl0IGlzIGFjdHVhbGx5XG4gICAgICAgIC8vIGhpZ2hsaWdodGVkXG4gICAgICAgIGJsb2NrLmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgICAgICAgYmxvY2suY2xhc3NMaXN0LmFkZCgncmFpbmJvdycpO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRvIGFsc28gYWRkIHRoZSBsb2FkaW5nIGNsYXNzIHRvIHRoZSBwcmUgdGFnXG4gICAgICAgIC8vIGJlY2F1c2UgdGhhdCBpcyBob3cgd2Ugd2lsbCBrbm93IHRvIHNob3cgYSBwcmVsb2FkZXJcbiAgICAgICAgaWYgKGJsb2NrLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ1BSRScpIHtcbiAgICAgICAgICAgIGJsb2NrLnBhcmVudE5vZGUuY2xhc3NMaXN0LmFkZCgnbG9hZGluZycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZ2xvYmFsQ2xhc3MgPSBibG9jay5nZXRBdHRyaWJ1dGUoJ2RhdGEtZ2xvYmFsLWNsYXNzJyk7XG4gICAgICAgIGNvbnN0IGRlbGF5ID0gcGFyc2VJbnQoYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWRlbGF5JyksIDEwKTtcblxuICAgICAgICArK3dhaXRpbmdPbi5jO1xuICAgICAgICBfbWVzc2FnZVdvcmtlcihfZ2V0V29ya2VyRGF0YShibG9jay5pbm5lckhUTUwsIHsgbGFuZ3VhZ2UsIGdsb2JhbENsYXNzLCBkZWxheSB9KSwgX2dlbmVyYXRlSGFuZGxlcihibG9jaywgd2FpdGluZ09uLCBjYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICh3YWl0aW5nT24uYyA9PT0gMCkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX2FkZFByZWxvYWRlcihwcmVCbG9jaykge1xuICAgIGNvbnN0IHByZWxvYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHByZWxvYWRlci5jbGFzc05hbWUgPSAncHJlbG9hZGVyJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICBwcmVsb2FkZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xuICAgIH1cbiAgICBwcmVCbG9jay5hcHBlbmRDaGlsZChwcmVsb2FkZXIpO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIFN0YXJ0IGhpZ2hsaWdodGluZyBhbGwgdGhlIGNvZGUgYmxvY2tzXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBub2RlICAgICAgIEhUTUxFbGVtZW50IHRvIHNlYXJjaCB3aXRoaW5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfaGlnaGxpZ2h0KG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xuXG4gICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IGNhbiBiZSBhbiBFdmVudCBvciBhIERPTSBFbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSSB3YXMgb3JpZ2luYWxseSBjaGVja2luZyBpbnN0YW5jZW9mIEV2ZW50IGJ1dCB0aGF0IG1hZGUgaXQgYnJlYWtcbiAgICAvLyB3aGVuIHVzaW5nIG1vb3Rvb2xzLlxuICAgIC8vXG4gICAgLy8gQHNlZSBodHRwczovL2dpdGh1Yi5jb20vY2NhbXBiZWxsL3JhaW5ib3cvaXNzdWVzLzMyXG4gICAgbm9kZSA9IG5vZGUgJiYgdHlwZW9mIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUgPT09ICdmdW5jdGlvbicgPyBub2RlIDogZG9jdW1lbnQ7XG5cbiAgICBjb25zdCBwcmVCbG9ja3MgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwcmUnKTtcbiAgICBjb25zdCBjb2RlQmxvY2tzID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpO1xuICAgIGNvbnN0IGZpbmFsUHJlQmxvY2tzID0gW107XG4gICAgY29uc3QgZmluYWxDb2RlQmxvY2tzID0gW107XG5cbiAgICAvLyBGaXJzdCBsb29wIHRocm91Z2ggYWxsIHByZSBibG9ja3MgdG8gZmluZCB3aGljaCBvbmVzIHRvIGhpZ2hsaWdodFxuICAgIGZvciAoY29uc3QgcHJlQmxvY2sgb2YgcHJlQmxvY2tzKSB7XG4gICAgICAgIF9hZGRQcmVsb2FkZXIocHJlQmxvY2spO1xuXG4gICAgICAgIC8vIFN0cmlwIHdoaXRlc3BhY2UgYXJvdW5kIGNvZGUgdGFncyB3aGVuIHRoZXkgYXJlIGluc2lkZSBvZiBhIHByZVxuICAgICAgICAvLyB0YWcuICBUaGlzIG1ha2VzIHRoZSB0aGVtZXMgbG9vayBiZXR0ZXIgYmVjYXVzZSB5b3UgY2FuJ3RcbiAgICAgICAgLy8gYWNjaWRlbnRhbGx5IGFkZCBleHRyYSBsaW5lYnJlYWtzIGF0IHRoZSBzdGFydCBhbmQgZW5kLlxuICAgICAgICAvL1xuICAgICAgICAvLyBXaGVuIHRoZSBwcmUgdGFnIGNvbnRhaW5zIGEgY29kZSB0YWcgdGhlbiBzdHJpcCBhbnkgZXh0cmFcbiAgICAgICAgLy8gd2hpdGVzcGFjZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIDxwcmU+XG4gICAgICAgIC8vICAgICAgPGNvZGU+dmFyIGZvbyA9IHRydWU7PC9jb2RlPlxuICAgICAgICAvLyA8L3ByZT5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gd2lsbCBiZWNvbWU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIDxwcmU+PGNvZGU+dmFyIGZvbyA9IHRydWU7PC9jb2RlPjwvcHJlPlxuICAgICAgICAvL1xuICAgICAgICAvLyBJZiB5b3Ugd2FudCB0byBwcmVzZXJ2ZSB3aGl0ZXNwYWNlIHlvdSBjYW4gdXNlIGEgcHJlIHRhZyBvblxuICAgICAgICAvLyBpdHMgb3duIHdpdGhvdXQgYSBjb2RlIHRhZyBpbnNpZGUgb2YgaXQuXG4gICAgICAgIGlmIChwcmVCbG9jay5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAvLyBUaGlzIGZpeGVzIGEgcmFjZSBjb25kaXRpb24gd2hlbiBSYWluYm93LmNvbG9yIGlzIGNhbGxlZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHRoZSBwcmV2aW91cyBjb2xvciBjYWxsIGhhcyBmaW5pc2hlZC5cbiAgICAgICAgICAgIGlmICghcHJlQmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLXRyaW1tZWQnKSkge1xuICAgICAgICAgICAgICAgIHByZUJsb2NrLnNldEF0dHJpYnV0ZSgnZGF0YS10cmltbWVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcHJlQmxvY2suaW5uZXJIVE1MID0gcHJlQmxvY2suaW5uZXJIVE1MLnRyaW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHByZSBibG9jayBoYXMgbm8gY29kZSBibG9ja3MgdGhlbiB3ZSBhcmUgZ29pbmcgdG8gd2FudCB0b1xuICAgICAgICAvLyBwcm9jZXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICBmaW5hbFByZUJsb2Nrcy5wdXNoKHByZUJsb2NrKTtcbiAgICB9XG5cbiAgICAvLyBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjczNTA2Ny9ob3ctdG8tY29udmVydC1hLWRvbS1ub2RlLWxpc3QtdG8tYW4tYXJyYXktaW4tamF2YXNjcmlwdFxuICAgIC8vIFdlIGFyZSBnb2luZyB0byBwcm9jZXNzIGFsbCA8Y29kZT4gYmxvY2tzXG4gICAgZm9yIChjb25zdCBjb2RlQmxvY2sgb2YgY29kZUJsb2Nrcykge1xuICAgICAgICBmaW5hbENvZGVCbG9ja3MucHVzaChjb2RlQmxvY2spO1xuICAgIH1cblxuICAgIF9oaWdobGlnaHRDb2RlQmxvY2tzKGZpbmFsQ29kZUJsb2Nrcy5jb25jYXQoZmluYWxQcmVCbG9ja3MpLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgdG8gbGV0IHlvdSBkbyBzdHVmZiBpbiB5b3VyIGFwcCBhZnRlciBhIHBpZWNlIG9mIGNvZGUgaGFzXG4gKiBiZWVuIGhpZ2hsaWdodGVkXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIG9uSGlnaGxpZ2h0KGNhbGxiYWNrKSB7XG4gICAgb25IaWdobGlnaHRDYWxsYmFjayA9IGNhbGxiYWNrO1xufVxuXG4vKipcbiAqIEV4dGVuZHMgdGhlIGxhbmd1YWdlIHBhdHRlcm4gbWF0Y2hlc1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSAgICAgICAgICAgIG5hbWUgb2YgbGFuZ3VhZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBsYW5ndWFnZVBhdHRlcm5zICAgIG9iamVjdCBvZiBwYXR0ZXJucyB0byBhZGQgb25cbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gaW5oZXJpdHMgIG9wdGlvbmFsIGxhbmd1YWdlIHRoYXQgdGhpcyBsYW5ndWFnZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGluaGVyaXQgcnVsZXMgZnJvbVxuICovXG5mdW5jdGlvbiBleHRlbmQobGFuZ3VhZ2UsIGxhbmd1YWdlUGF0dGVybnMsIGluaGVyaXRzKSB7XG5cbiAgICAvLyBJZiB3ZSBleHRlbmQgYSBsYW5ndWFnZSBhZ2FpbiB3ZSBzaG91bGRuJ3QgbmVlZCB0byBzcGVjaWZ5IHRoZVxuICAgIC8vIGluaGVyaXRlbmNlIGZvciBpdC4gRm9yIGV4YW1wbGUsIGlmIHlvdSBhcmUgYWRkaW5nIHNwZWNpYWwgaGlnaGxpZ2h0aW5nXG4gICAgLy8gZm9yIGEgamF2YXNjcmlwdCBmdW5jdGlvbiB0aGF0IGlzIG5vdCBpbiB0aGUgYmFzZSBqYXZhc2NyaXB0IHJ1bGVzLCB5b3VcbiAgICAvLyBzaG91bGQgYmUgYWJsZSB0byBkb1xuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5leHRlbmQoJ2phdmFzY3JpcHQnLCBbIOKApiBdKTtcbiAgICAvL1xuICAgIC8vIFdpdGhvdXQgc3BlY2lmeWluZyBhIGxhbmd1YWdlIGl0IHNob3VsZCBpbmhlcml0IChnZW5lcmljIGluIHRoaXMgY2FzZSlcbiAgICBpZiAoIWluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXSkge1xuICAgICAgICBpbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0gPSBpbmhlcml0cztcbiAgICB9XG5cbiAgICBwYXR0ZXJuc1tsYW5ndWFnZV0gPSBsYW5ndWFnZVBhdHRlcm5zLmNvbmNhdChwYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW10pO1xufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgbWFnaWMgcmFpbmJvd1xuICpcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGNvbG9yKC4uLmFyZ3MpIHtcblxuICAgIC8vIElmIHlvdSB3YW50IHRvIHN0cmFpZ2h0IHVwIGhpZ2hsaWdodCBhIHN0cmluZyB5b3UgY2FuIHBhc3MgdGhlXG4gICAgLy8gc3RyaW5nIG9mIGNvZGUsIHRoZSBsYW5ndWFnZSwgYW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5jb2xvcihjb2RlLCBsYW5ndWFnZSwgZnVuY3Rpb24oaGlnaGxpZ2h0ZWRDb2RlLCBsYW5ndWFnZSkge1xuICAgIC8vICAgICAvLyB0aGlzIGNvZGUgYmxvY2sgaXMgbm93IGhpZ2hsaWdodGVkXG4gICAgLy8gfSk7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCB3b3JrZXJEYXRhID0gX2dldFdvcmtlckRhdGEoYXJnc1swXSwgYXJnc1sxXSk7XG4gICAgICAgIF9tZXNzYWdlV29ya2VyKHdvcmtlckRhdGEsIChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZGF0YS5yZXN1bHQsIGRhdGEubGFuZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfShhcmdzWzJdKSkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgeW91IHBhc3MgYSBjYWxsYmFjayBmdW5jdGlvbiB0aGVuIHdlIHJlcnVuIHRoZSBjb2xvciBmdW5jdGlvblxuICAgIC8vIG9uIGFsbCB0aGUgY29kZSBhbmQgY2FsbCB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gb24gY29tcGxldGUuXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5jb2xvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coJ0FsbCBtYXRjaGluZyB0YWdzIG9uIHRoZSBwYWdlIGFyZSBub3cgaGlnaGxpZ2h0ZWQnKTtcbiAgICAvLyB9KTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgX2hpZ2hsaWdodCgwLCBhcmdzWzBdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSB3ZSB1c2Ugd2hhdGV2ZXIgbm9kZSB5b3UgcGFzc2VkIGluIHdpdGggYW4gb3B0aW9uYWxcbiAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlci5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyB2YXIgcHJlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICAgIC8vIHZhciBjb2RlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcbiAgICAvLyBjb2RlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnLCAnamF2YXNjcmlwdCcpO1xuICAgIC8vIGNvZGVFbGVtZW50LmlubmVySFRNTCA9ICcvLyBIZXJlIGlzIHNvbWUgSmF2YVNjcmlwdCc7XG4gICAgLy8gcHJlRWxlbWVudC5hcHBlbmRDaGlsZChjb2RlRWxlbWVudCk7XG4gICAgLy8gUmFpbmJvdy5jb2xvcihwcmVFbGVtZW50LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgLy8gTmV3IGVsZW1lbnQgaXMgbm93IGhpZ2hsaWdodGVkXG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBJZiB5b3UgZG9uJ3QgcGFzcyBhbiBlbGVtZW50IGl0IHdpbGwgZGVmYXVsdCB0byBgZG9jdW1lbnRgXG4gICAgX2hpZ2hsaWdodChhcmdzWzBdLCBhcmdzWzFdKTtcbn1cblxuLyoqXG4gKiBNZXRob2QgdG8gYWRkIGFuIGFsaWFzIGZvciBhbiBleGlzdGluZyBsYW5ndWFnZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB5b3Ugd2FudCB0byBoYXZlIFwiY29mZmVlXCIgbWFwIHRvIFwiY29mZmVlc2NyaXB0XCJcbiAqXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jY2FtcGJlbGwvcmFpbmJvdy9pc3N1ZXMvMTU0XG4gKiBAcGFyYW0ge3N0cmluZ30gYWxpYXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbExhbmd1YWdlXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBhZGRBbGlhcyhhbGlhcywgb3JpZ2luYWxMYW5ndWFnZSkge1xuICAgIGFsaWFzZXNbYWxpYXNdID0gb3JpZ2luYWxMYW5ndWFnZTtcbn1cblxuLyoqXG4gKiBwdWJsaWMgbWV0aG9kc1xuICovXG5SYWluYm93ID0ge1xuICAgIGV4dGVuZCxcbiAgICBvbkhpZ2hsaWdodCxcbiAgICBhZGRBbGlhcyxcbiAgICBjb2xvclxufTtcblxuaWYgKGlzTm9kZSkge1xuICAgIFJhaW5ib3cuY29sb3JTeW5jID0gZnVuY3Rpb24oY29kZSwgbGFuZykge1xuICAgICAgICBjb25zdCB3b3JrZXJEYXRhID0gX2dldFdvcmtlckRhdGEoY29kZSwgbGFuZyk7XG4gICAgICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKHdvcmtlckRhdGEub3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBwcmlzbS5yZWZyYWN0KHdvcmtlckRhdGEuY29kZSwgd29ya2VyRGF0YS5sYW5nKTtcbiAgICB9O1xufVxuXG4vLyBJbiB0aGUgYnJvd3NlciBob29rIGl0IHVwIHRvIGNvbG9yIG9uIHBhZ2UgbG9hZFxuaWYgKCFpc05vZGUgJiYgIWlzV29ya2VyKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIVJhaW5ib3cuZGVmZXIpIHtcbiAgICAgICAgICAgIFJhaW5ib3cuY29sb3IoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSwgZmFsc2UpO1xufVxuXG4vLyBGcm9tIGEgbm9kZSB3b3JrZXIsIGhhbmRsZSB0aGUgcG9zdE1lc3NhZ2UgcmVxdWVzdHMgdG8gaXRcbmlmIChpc1dvcmtlcikge1xuICAgIHNlbGYub25tZXNzYWdlID0gcmFpbmJvd1dvcmtlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgUmFpbmJvdztcbiJdLCJuYW1lcyI6WyJsZXQiLCJjb25zdCIsImlzTm9kZSIsImlzV29ya2VyIiwidXRpbC5oYXNDb21wbGV0ZU92ZXJsYXAiLCJ1dGlsLmludGVyc2VjdHMiLCJ1dGlsLmtleXMiLCJ1dGlsLnJlcGxhY2VBdFBvc2l0aW9uIiwidXRpbC5pbmRleE9mR3JvdXAiLCJ1dGlsLmh0bWxFbnRpdGllcyIsInV0aWwuaXNOb2RlIiwidXRpbC5pc1dvcmtlciIsInV0aWwuY3JlYXRlV29ya2VyIiwidXRpbC5nZXRMYW5ndWFnZUZvckJsb2NrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7SUFBQSxTQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7UUFDdkIsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVLEVBQUU7WUFDN0IsT0FBTyxDQUFBLElBQUcsSUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUEsQ0FBRSxDQUFDO1NBQ2xDOztRQUVEQSxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDZixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUMzQixLQUFLQyxJQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUU7Z0JBQ3JCLEtBQUssSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDbkM7U0FDSjs7UUFFRCxPQUFPLEtBQUssQ0FBQztLQUNoQjs7QUFFRCxBQUFPLElBQUEsU0FBU0MsUUFBTSxHQUFHOztRQUVyQixPQUFPLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxPQUFPLE1BQU0sQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDO0tBQzlFOztBQUVELEFBQU8sSUFBQSxTQUFTQyxVQUFRLEdBQUc7UUFDdkIsT0FBTyxPQUFPLFFBQVEsS0FBSyxXQUFXLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxDQUFDO0tBQ3pFOzs7Ozs7Ozs7OztBQVdELEFBQU8sSUFBQSxTQUFTLFlBQVksQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFO1FBQ3RDLElBQUlELFFBQU0sRUFBRSxFQUFFOztZQUVWLE1BQU0sQ0FBQyxNQUFN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