(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.Rainbow = factory());
}(this, function () { 'use strict';

    function isNode$1() {
        /* globals module */
        return typeof module !== 'undefined' && typeof module.exports === 'object';
    }

    function isWorker$1() {
        return typeof document === 'undefined' && typeof self !== 'undefined';
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

        // This is needed to fix an issue where $ signs do not render in the
        // highlighted code
        //
        // @see https://github.com/ccampbell/rainbow/issues/208
        replaceWith = replaceWith.replace(/\$/g, '$$$$');

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
    function createWorker(fn, Prism) {
        if (isNode$1()) {
            /* globals global, require, __filename */
            global.Worker = require('web-worker');
            return new Worker(__filename);
        }

        var prismFunction = Prism.toString();

        var code = keys.toString();
        code += htmlEntities.toString();
        code += hasCompleteOverlap.toString();
        code += intersects.toString();
        code += replaceAtPosition.toString();
        code += indexOfGroup.toString();
        code += prismFunction;

        var fullString = code + "\tthis.onmessage=" + (fn.toString());

        var blob = new Blob([fullString], { type: 'text/javascript' });
        return new Worker((window.URL || window.webkitURL).createObjectURL(blob));
    }

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
         * It is so we can create a new regex object for each call to
         * _processPattern to avoid state carrying over when running exec
         * multiple times.
         *
         * The global flag should not be carried over because we are simulating
         * it by processing the regex in a loop so we only care about the first
         * match in each string. This also seems to improve performance quite a
         * bit.
         *
         * @param {RegExp} regex
         * @return {string}
         */
        function _cloneRegex(regex) {
            var flags = '';

            if (regex.ignoreCase) {
                flags += 'i';
            }

            if (regex.multiline) {
                flags += 'm';
            }

            return new RegExp(regex.source, flags);
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
         * @param {number} offset
         * @return {mixed}
         */
        function _processPattern(pattern, code, offset) {
            if ( offset === void 0 ) offset = 0;

            var regex = pattern.pattern;
            if (!regex) {
                return false;
            }

            // Since we are simulating global regex matching we need to also
            // make sure to stop after one match if the pattern is not global
            var shouldStop = !regex.global;

            regex = _cloneRegex(regex);
            var match = regex.exec(code);
            if (!match) {
                return false;
            }

            // Treat match 0 the same way as name
            if (!pattern.name && pattern.matches && typeof pattern.matches[0] === 'string') {
                pattern.name = pattern.matches[0];
                delete pattern.matches[0];
            }

            var replacement = match[0];
                var startPos = match.index + offset;
            var endPos = match[0].length + startPos;

            // In some cases when the regex matches a group such as \s* it is
            // possible for there to be a match, but have the start position
            // equal the end position. In those cases we should be able to stop
            // matching. Otherwise this can lead to an infinite loop.
            if (startPos === endPos) {
                return false;
            }

            // If this is not a child match and it falls inside of another
            // match that already happened we should skip it and continue
            // processing.
            if (_matchIsInsideOtherMatch(startPos, endPos)) {
                return {
                    remaining: code.substr(endPos - offset),
                    offset: endPos
                };
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

                if (shouldStop) {
                    return false;
                }

                return {
                    remaining: code.substr(endPos - offset),
                    offset: endPos
                };
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
            return onMatchSuccess(replacement);
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

                var result = _processPattern(pattern, code);
                while (result) {
                    result = _processPattern(pattern, result.remaining, result.offset);
                }
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
                patterns = patterns.concat(options.patterns[language] || []);
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

        if (message.isNode) {
            _reply();
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

    /**
     * Counter for block ids
     * @see https://github.com/ccampbell/rainbow/issues/207
     */
    var id = 0;

    var isNode = isNode$1();
    var isWorker = isWorker$1();

    var cachedWorker = null;
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
        var worker = _getWorker();

        function _listen(e) {
            if (e.data.id === message.id) {
                callback(e.data);
                worker.removeEventListener('message', _listen);

                // I realized down the road I might look at this and wonder what is going on
                // so probably it is not a bad idea to leave a comment.
                //
                // This is needed because right now the node library for simulating web
                // workers “web-worker” will keep the worker open and it causes
                // scripts running from the command line to hang unless the worker is
                // explicitly closed.
                //
                // This means for node we will spawn a new thread for every asynchronous
                // block we are highlighting, but in the browser we will keep a single
                // worker open for all requests.
                if (isNode) {
                    worker.terminate();
                }
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
            element.classList.add('rainbow-show');

            if (element.parentNode.tagName === 'PRE') {
                element.parentNode.classList.remove('loading');
                element.parentNode.classList.add('rainbow-show');
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
            id: id++,
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

    function remove(language) {
        delete inheritenceMap[language];
        delete patterns[language];
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
        remove: remove,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3ByaXNtLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9yYWluYm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICAvKiBnbG9iYWxzIG1vZHVsZSAqL1xuICAgIHJldHVybiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXb3JrZXIoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEdldHMgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGJsb2NrIG9mIGNvZGVcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJsb2NrXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spIHtcblxuICAgIC8vIElmIHRoaXMgZG9lc24ndCBoYXZlIGEgbGFuZ3VhZ2UgYnV0IHRoZSBwYXJlbnQgZG9lcyB0aGVuIHVzZSB0aGF0LlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBpZiBmb3IgZXhhbXBsZSB5b3UgaGF2ZTogPHByZSBkYXRhLWxhbmd1YWdlPVwicGhwXCI+XG4gICAgLy8gd2l0aCBhIGJ1bmNoIG9mIDxjb2RlPiBibG9ja3MgaW5zaWRlIHRoZW4geW91IGRvIG5vdCBoYXZlXG4gICAgLy8gdG8gc3BlY2lmeSB0aGUgbGFuZ3VhZ2UgZm9yIGVhY2ggYmxvY2suXG4gICAgbGV0IGxhbmd1YWdlID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJykgfHwgYmxvY2sucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnKTtcblxuICAgIC8vIFRoaXMgYWRkcyBzdXBwb3J0IGZvciBzcGVjaWZ5aW5nIGxhbmd1YWdlIHZpYSBhIENTUyBjbGFzcy5cbiAgICAvL1xuICAgIC8vIFlvdSBjYW4gdXNlIHRoZSBHb29nbGUgQ29kZSBQcmV0dGlmeSBzdHlsZTogPHByZSBjbGFzcz1cImxhbmctcGhwXCI+XG4gICAgLy8gb3IgdGhlIEhUTUw1IHN0eWxlOiA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtcGhwXCI+XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1xcYmxhbmcoPzp1YWdlKT8tKFxcdyspLztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBibG9jay5jbGFzc05hbWUubWF0Y2gocGF0dGVybikgfHwgYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBsYW5ndWFnZSA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGRpZmZlcmVudCBtYXRjaGVzIGhhdmUgY29tcGxldGUgb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXJcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQxICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICBlbmQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDIgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQyICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29tcGxldGVPdmVybGFwKHN0YXJ0MSwgZW5kMSwgc3RhcnQyLCBlbmQyKSB7XG5cbiAgICAvLyBJZiB0aGUgc3RhcnRpbmcgYW5kIGVuZCBwb3NpdGlvbnMgYXJlIGV4YWN0bHkgdGhlIHNhbWVcbiAgICAvLyB0aGVuIHRoZSBmaXJzdCBvbmUgc2hvdWxkIHN0YXkgYW5kIHRoaXMgb25lIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChzdGFydDIgPT09IHN0YXJ0MSAmJiBlbmQyID09PSBlbmQxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQyIDw9IHN0YXJ0MSAmJiBlbmQyID49IGVuZDE7XG59XG5cbi8qKlxuICogRW5jb2RlcyA8IGFuZCA+IGFzIGh0bWwgZW50aXRpZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaHRtbEVudGl0aWVzKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyYoPyFbXFx3XFwjXSs7KS9nLCAnJmFtcDsnKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvdXQgdGhlIHBvc2l0aW9uIG9mIGdyb3VwIG1hdGNoIGZvciBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICpcbiAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTg1NTk0L2hvdy10by1maW5kLWluZGV4LW9mLWdyb3Vwcy1pbi1tYXRjaFxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBOdW1iZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBOdW1iZXIpIHtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cE51bWJlcjsgKytpKSB7XG4gICAgICAgIGlmIChtYXRjaFtpXSkge1xuICAgICAgICAgICAgaW5kZXggKz0gbWF0Y2hbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBuZXcgbWF0Y2ggaW50ZXJzZWN0cyB3aXRoIGFuIGV4aXN0aW5nIG9uZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDEgICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICAgZW5kIHBvc2l0aW9uIG9mIGV4aXN0aW5nIG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQyICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZDIgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhzdGFydDEsIGVuZDEsIHN0YXJ0MiwgZW5kMikge1xuICAgIGlmIChzdGFydDIgPj0gc3RhcnQxICYmIHN0YXJ0MiA8IGVuZDEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuZDIgPiBzdGFydDEgJiYgZW5kMiA8IGVuZDE7XG59XG5cbi8qKlxuICogU29ydHMgYW4gb2JqZWN0cyBrZXlzIGJ5IGluZGV4IGRlc2NlbmRpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgbG9jYXRpb25zLnB1c2gobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbnVtZXJpYyBkZXNjZW5kaW5nXG4gICAgcmV0dXJuIGxvY2F0aW9ucy5zb3J0KChhLCBiKSA9PiBiIC0gYSk7XG59XG5cbi8qKlxuICogU3Vic3RyaW5nIHJlcGxhY2UgY2FsbCB0byByZXBsYWNlIHBhcnQgb2YgYSBzdHJpbmcgYXQgYSBjZXJ0YWluIHBvc2l0aW9uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uICAgICAgICAgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGhhcHBlblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2UgICAgICAgICAgdGhlIHRleHQgd2Ugd2FudCB0byByZXBsYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZVdpdGggICAgICB0aGUgdGV4dCB3ZSB3YW50IHRvIHJlcGxhY2UgaXQgd2l0aFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICAgICAgdGhlIGNvZGUgd2UgYXJlIGRvaW5nIHRoZSByZXBsYWNpbmcgaW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlLCByZXBsYWNlV2l0aCwgY29kZSkge1xuICAgIGNvbnN0IHN1YlN0cmluZyA9IGNvZGUuc3Vic3RyKHBvc2l0aW9uKTtcblxuICAgIC8vIFRoaXMgaXMgbmVlZGVkIHRvIGZpeCBhbiBpc3N1ZSB3aGVyZSAkIHNpZ25zIGRvIG5vdCByZW5kZXIgaW4gdGhlXG4gICAgLy8gaGlnaGxpZ2h0ZWQgY29kZVxuICAgIC8vXG4gICAgLy8gQHNlZSBodHRwczovL2dpdGh1Yi5jb20vY2NhbXBiZWxsL3JhaW5ib3cvaXNzdWVzLzIwOFxuICAgIHJlcGxhY2VXaXRoID0gcmVwbGFjZVdpdGgucmVwbGFjZSgvXFwkL2csICckJCQkJyk7XG5cbiAgICByZXR1cm4gY29kZS5zdWJzdHIoMCwgcG9zaXRpb24pICsgc3ViU3RyaW5nLnJlcGxhY2UocmVwbGFjZSwgcmVwbGFjZVdpdGgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB1c2FibGUgd2ViIHdvcmtlciBmcm9tIGFuIGFub255bW91cyBmdW5jdGlvblxuICpcbiAqIG1vc3RseSBib3Jyb3dlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS96ZXZlcm8vd29ya2VyLWNyZWF0ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1ByaXNtfSBQcmlzbVxuICogQHJldHVybiB7V29ya2VyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV29ya2VyKGZuLCBQcmlzbSkge1xuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgICAvKiBnbG9iYWxzIGdsb2JhbCwgcmVxdWlyZSwgX19maWxlbmFtZSAqL1xuICAgICAgICBnbG9iYWwuV29ya2VyID0gcmVxdWlyZSgnd2ViLXdvcmtlcicpO1xuICAgICAgICByZXR1cm4gbmV3IFdvcmtlcihfX2ZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlzbUZ1bmN0aW9uID0gUHJpc20udG9TdHJpbmcoKTtcblxuICAgIGxldCBjb2RlID0ga2V5cy50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gaHRtbEVudGl0aWVzLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBoYXNDb21wbGV0ZU92ZXJsYXAudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGludGVyc2VjdHMudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IHJlcGxhY2VBdFBvc2l0aW9uLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBpbmRleE9mR3JvdXAudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IHByaXNtRnVuY3Rpb247XG5cbiAgICBjb25zdCBmdWxsU3RyaW5nID0gYCR7Y29kZX1cXHR0aGlzLm9ubWVzc2FnZT0ke2ZuLnRvU3RyaW5nKCl9YDtcblxuICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbZnVsbFN0cmluZ10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSk7XG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoKHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpKTtcbn1cbiIsImltcG9ydCB7IHJlcGxhY2VBdFBvc2l0aW9uLCBpbmRleE9mR3JvdXAsIGtleXMsIGh0bWxFbnRpdGllcywgaGFzQ29tcGxldGVPdmVybGFwLCBpbnRlcnNlY3RzIH0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBQcmlzbSBpcyBhIGNsYXNzIHVzZWQgdG8gaGlnaGxpZ2h0IGluZGl2aWR1YWwgYmxvY2tzIG9mIGNvZGVcbiAqXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgUHJpc20ge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9iamVjdCBvZiByZXBsYWNlbWVudHMgdG8gcHJvY2VzcyBhdCB0aGUgZW5kIG9mIHRoZSBwcm9jZXNzaW5nXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXBsYWNlbWVudHMgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGFuZ3VhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgUHJpc20gb2JqZWN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY3VycmVudExhbmd1YWdlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPYmplY3Qgb2Ygc3RhcnQgYW5kIGVuZCBwb3NpdGlvbnMgb2YgYmxvY2tzIHRvIGJlIHJlcGxhY2VkXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXBsYWNlbWVudFBvc2l0aW9ucyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBtYXRjaCBwYXNzZWQgaW4gZmFsbHMgaW5zaWRlIG9mIGFuIGV4aXN0aW5nIG1hdGNoLlxuICAgICAgICAgKiBUaGlzIHByZXZlbnRzIGEgcmVnZXggcGF0dGVybiBmcm9tIG1hdGNoaW5nIGluc2lkZSBvZiBhbm90aGVyIHBhdHRlcm5cbiAgICAgICAgICogdGhhdCBtYXRjaGVzIGEgbGFyZ2VyIGFtb3VudCBvZiBjb2RlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHByZXZlbnRzIGEga2V5d29yZCBmcm9tIG1hdGNoaW5nIGBmdW5jdGlvbmAgaWYgdGhlcmVcbiAgICAgICAgICogaXMgYWxyZWFkeSBhIG1hdGNoIGZvciBgZnVuY3Rpb24gKC4qKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCAgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGVuZCAgICAgIGVuZCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9tYXRjaElzSW5zaWRlT3RoZXJNYXRjaChzdGFydCwgZW5kKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gcmVwbGFjZW1lbnRQb3NpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBwYXJzZUludChrZXksIDEwKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgYmxvY2sgY29tcGxldGVseSBvdmVybGFwcyB3aXRoIGFub3RoZXIgYmxvY2tcbiAgICAgICAgICAgICAgICAvLyB0aGVuIHdlIHNob3VsZCByZW1vdmUgdGhlIG90aGVyIGJsb2NrIGFuZCByZXR1cm4gYGZhbHNlYC5cbiAgICAgICAgICAgICAgICBpZiAoaGFzQ29tcGxldGVPdmVybGFwKGtleSwgcmVwbGFjZW1lbnRQb3NpdGlvbnNba2V5XSwgc3RhcnQsIGVuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXBsYWNlbWVudHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0cyhrZXksIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV0sIHN0YXJ0LCBlbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRha2VzIGEgc3RyaW5nIG9mIGNvZGUgYW5kIHdyYXBzIGl0IGluIGEgc3BhbiB0YWcgYmFzZWQgb24gdGhlIG5hbWVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgICAgICAgIG5hbWUgb2YgdGhlIHBhdHRlcm4gKGllIGtleXdvcmQucmVnZXgpXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICAgICBibG9jayBvZiBjb2RlIHRvIHdyYXBcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbENsYXNzIGNsYXNzIHRvIGFwcGx5IHRvIGV2ZXJ5IHNwYW5cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3dyYXBDb2RlSW5TcGFuKG5hbWUsIGNvZGUpIHtcbiAgICAgICAgICAgIGxldCBjbGFzc05hbWUgPSBuYW1lLnJlcGxhY2UoL1xcLi9nLCAnICcpO1xuXG4gICAgICAgICAgICBjb25zdCBnbG9iYWxDbGFzcyA9IG9wdGlvbnMuZ2xvYmFsQ2xhc3M7XG4gICAgICAgICAgICBpZiAoZ2xvYmFsQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgKz0gYCAke2dsb2JhbENsYXNzfWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBgPHNwYW4gY2xhc3M9XCIke2NsYXNzTmFtZX1cIj4ke2NvZGV9PC9zcGFuPmA7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvY2VzcyByZXBsYWNlbWVudHMgaW4gdGhlIHN0cmluZyBvZiBjb2RlIHRvIGFjdHVhbGx5IHVwZGF0ZVxuICAgICAgICAgKiB0aGUgbWFya3VwXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICAgICAgdGhlIGNvZGUgdG8gcHJvY2VzcyByZXBsYWNlbWVudHMgaW5cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NSZXBsYWNlbWVudHMoY29kZSkge1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb25zID0ga2V5cyhyZXBsYWNlbWVudHMpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiBwb3NpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50c1twb3NpdGlvbl07XG4gICAgICAgICAgICAgICAgY29kZSA9IHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlbWVudC5yZXBsYWNlLCByZXBsYWNlbWVudC53aXRoLCBjb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0IGlzIHNvIHdlIGNhbiBjcmVhdGUgYSBuZXcgcmVnZXggb2JqZWN0IGZvciBlYWNoIGNhbGwgdG9cbiAgICAgICAgICogX3Byb2Nlc3NQYXR0ZXJuIHRvIGF2b2lkIHN0YXRlIGNhcnJ5aW5nIG92ZXIgd2hlbiBydW5uaW5nIGV4ZWNcbiAgICAgICAgICogbXVsdGlwbGUgdGltZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBnbG9iYWwgZmxhZyBzaG91bGQgbm90IGJlIGNhcnJpZWQgb3ZlciBiZWNhdXNlIHdlIGFyZSBzaW11bGF0aW5nXG4gICAgICAgICAqIGl0IGJ5IHByb2Nlc3NpbmcgdGhlIHJlZ2V4IGluIGEgbG9vcCBzbyB3ZSBvbmx5IGNhcmUgYWJvdXQgdGhlIGZpcnN0XG4gICAgICAgICAqIG1hdGNoIGluIGVhY2ggc3RyaW5nLiBUaGlzIGFsc28gc2VlbXMgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZSBxdWl0ZSBhXG4gICAgICAgICAqIGJpdC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtSZWdFeHB9IHJlZ2V4XG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9jbG9uZVJlZ2V4KHJlZ2V4KSB7XG4gICAgICAgICAgICBsZXQgZmxhZ3MgPSAnJztcblxuICAgICAgICAgICAgaWYgKHJlZ2V4Lmlnbm9yZUNhc2UpIHtcbiAgICAgICAgICAgICAgICBmbGFncyArPSAnaSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZWdleC5tdWx0aWxpbmUpIHtcbiAgICAgICAgICAgICAgICBmbGFncyArPSAnbSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LnNvdXJjZSwgZmxhZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1hdGNoZXMgYSByZWdleCBwYXR0ZXJuIGFnYWluc3QgYSBibG9jayBvZiBjb2RlLCBmaW5kcyBhbGwgbWF0Y2hlc1xuICAgICAgICAgKiB0aGF0IHNob3VsZCBiZSBwcm9jZXNzZWQsIGFuZCBzdG9yZXMgdGhlIHBvc2l0aW9ucyBvZiB3aGVyZSB0aGV5XG4gICAgICAgICAqIHNob3VsZCBiZSByZXBsYWNlZCB3aXRoaW4gdGhlIHN0cmluZy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBpcyB3aGVyZSBwcmV0dHkgbXVjaCBhbGwgdGhlIHdvcmsgaXMgZG9uZSBidXQgaXQgc2hvdWxkIG5vdFxuICAgICAgICAgKiBiZSBjYWxsZWQgZGlyZWN0bHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXR0ZXJuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICAgICAgICogQHJldHVybiB7bWl4ZWR9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc1BhdHRlcm4ocGF0dGVybiwgY29kZSwgb2Zmc2V0ID0gMCkge1xuICAgICAgICAgICAgbGV0IHJlZ2V4ID0gcGF0dGVybi5wYXR0ZXJuO1xuICAgICAgICAgICAgaWYgKCFyZWdleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2luY2Ugd2UgYXJlIHNpbXVsYXRpbmcgZ2xvYmFsIHJlZ2V4IG1hdGNoaW5nIHdlIG5lZWQgdG8gYWxzb1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRvIHN0b3AgYWZ0ZXIgb25lIG1hdGNoIGlmIHRoZSBwYXR0ZXJuIGlzIG5vdCBnbG9iYWxcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZFN0b3AgPSAhcmVnZXguZ2xvYmFsO1xuXG4gICAgICAgICAgICByZWdleCA9IF9jbG9uZVJlZ2V4KHJlZ2V4KTtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVnZXguZXhlYyhjb2RlKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyZWF0IG1hdGNoIDAgdGhlIHNhbWUgd2F5IGFzIG5hbWVcbiAgICAgICAgICAgIGlmICghcGF0dGVybi5uYW1lICYmIHBhdHRlcm4ubWF0Y2hlcyAmJiB0eXBlb2YgcGF0dGVybi5tYXRjaGVzWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHBhdHRlcm4ubmFtZSA9IHBhdHRlcm4ubWF0Y2hlc1swXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgcGF0dGVybi5tYXRjaGVzWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgcmVwbGFjZW1lbnQgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0UG9zID0gbWF0Y2guaW5kZXggKyBvZmZzZXQ7XG4gICAgICAgICAgICBjb25zdCBlbmRQb3MgPSBtYXRjaFswXS5sZW5ndGggKyBzdGFydFBvcztcblxuICAgICAgICAgICAgLy8gSW4gc29tZSBjYXNlcyB3aGVuIHRoZSByZWdleCBtYXRjaGVzIGEgZ3JvdXAgc3VjaCBhcyBcXHMqIGl0IGlzXG4gICAgICAgICAgICAvLyBwb3NzaWJsZSBmb3IgdGhlcmUgdG8gYmUgYSBtYXRjaCwgYnV0IGhhdmUgdGhlIHN0YXJ0IHBvc2l0aW9uXG4gICAgICAgICAgICAvLyBlcXVhbCB0aGUgZW5kIHBvc2l0aW9uLiBJbiB0aG9zZSBjYXNlcyB3ZSBzaG91bGQgYmUgYWJsZSB0byBzdG9wXG4gICAgICAgICAgICAvLyBtYXRjaGluZy4gT3RoZXJ3aXNlIHRoaXMgY2FuIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAgICAgICAgIGlmIChzdGFydFBvcyA9PT0gZW5kUG9zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCBhIGNoaWxkIG1hdGNoIGFuZCBpdCBmYWxscyBpbnNpZGUgb2YgYW5vdGhlclxuICAgICAgICAgICAgLy8gbWF0Y2ggdGhhdCBhbHJlYWR5IGhhcHBlbmVkIHdlIHNob3VsZCBza2lwIGl0IGFuZCBjb250aW51ZVxuICAgICAgICAgICAgLy8gcHJvY2Vzc2luZy5cbiAgICAgICAgICAgIGlmIChfbWF0Y2hJc0luc2lkZU90aGVyTWF0Y2goc3RhcnRQb3MsIGVuZFBvcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmc6IGNvZGUuc3Vic3RyKGVuZFBvcyAtIG9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogZW5kUG9zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxsYmFjayBmb3Igd2hlbiBhIG1hdGNoIHdhcyBzdWNjZXNzZnVsbHkgcHJvY2Vzc2VkXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcGxcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uTWF0Y2hTdWNjZXNzKHJlcGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgbWF0Y2ggaGFzIGEgbmFtZSB0aGVuIHdyYXAgaXQgaW4gYSBzcGFuIHRhZ1xuICAgICAgICAgICAgICAgIGlmIChwYXR0ZXJuLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwbCA9IF93cmFwQ29kZUluU3BhbihwYXR0ZXJuLm5hbWUsIHJlcGwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZvciBkZWJ1Z2dpbmdcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVwbGFjZSAnICsgbWF0Y2hbMF0gKyAnIHdpdGggJyArIHJlcGxhY2VtZW50ICsgJyBhdCBwb3NpdGlvbiAnICsgc3RhcnRQb3MgKyAnIHRvICcgKyBlbmRQb3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgd2hhdCBuZWVkcyB0byBiZSByZXBsYWNlZCB3aXRoIHdoYXQgYXQgdGhpcyBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50c1tzdGFydFBvc10gPSB7XG4gICAgICAgICAgICAgICAgICAgICdyZXBsYWNlJzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICd3aXRoJzogcmVwbFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgcmFuZ2Ugb2YgdGhpcyBtYXRjaCBzbyB3ZSBjYW4gdXNlIGl0IGZvclxuICAgICAgICAgICAgICAgIC8vIGNvbXBhcmlzb25zIHdpdGggb3RoZXIgbWF0Y2hlcyBsYXRlci5cbiAgICAgICAgICAgICAgICByZXBsYWNlbWVudFBvc2l0aW9uc1tzdGFydFBvc10gPSBlbmRQb3M7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkU3RvcCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nOiBjb2RlLnN1YnN0cihlbmRQb3MgLSBvZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGVuZFBvc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGVscGVyIGZ1bmN0aW9uIGZvciBwcm9jZXNzaW5nIGEgc3ViIGdyb3VwXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGdyb3VwS2V5ICAgICAgaW5kZXggb2YgZ3JvdXBcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzR3JvdXAoZ3JvdXBLZXkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBibG9jayA9IG1hdGNoW2dyb3VwS2V5XTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIG1hdGNoIGhlcmUgdGhlbiBtb3ZlIG9uXG4gICAgICAgICAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSBwYXR0ZXJuLm1hdGNoZXNbZ3JvdXBLZXldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ3JvdXAubGFuZ3VhZ2U7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBQcm9jZXNzIGdyb3VwIGlzIHdoYXQgZ3JvdXAgd2Ugc2hvdWxkIHVzZSB0byBhY3R1YWxseSBwcm9jZXNzXG4gICAgICAgICAgICAgICAgICogdGhpcyBtYXRjaCBncm91cC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEZvciBleGFtcGxlIGlmIHRoZSBzdWJncm91cCBwYXR0ZXJuIGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIDI6IHtcbiAgICAgICAgICAgICAgICAgKiAgICAgJ25hbWUnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICogICAgICdwYXR0ZXJuJzogL3RydWUvZ1xuICAgICAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIHRoZW4gd2UgdXNlIHRoYXQgYXMgaXMsIGJ1dCBpZiBpdCBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAyOiB7XG4gICAgICAgICAgICAgICAgICogICAgICduYW1lJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAqICAgICAnbWF0Y2hlcyc6IHtcbiAgICAgICAgICAgICAgICAgKiAgICAgICAgICAnbmFtZSc6ICdzcGVjaWFsJyxcbiAgICAgICAgICAgICAgICAgKiAgICAgICAgICAncGF0dGVybic6IC93aGF0ZXZlci9nXG4gICAgICAgICAgICAgICAgICogICAgICB9XG4gICAgICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogd2UgdHJlYXQgdGhlICdtYXRjaGVzJyBwYXJ0IGFzIHRoZSBwYXR0ZXJuIGFuZCBrZWVwXG4gICAgICAgICAgICAgICAgICogdGhlIG5hbWUgYXJvdW5kIHRvIHdyYXAgaXQgd2l0aCBsYXRlclxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwVG9Qcm9jZXNzID0gZ3JvdXAubmFtZSAmJiBncm91cC5tYXRjaGVzID8gZ3JvdXAubWF0Y2hlcyA6IGdyb3VwO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGFrZXMgdGhlIGNvZGUgYmxvY2sgbWF0Y2hlZCBhdCB0aGlzIGdyb3VwLCByZXBsYWNlcyBpdFxuICAgICAgICAgICAgICAgICAqIHdpdGggdGhlIGhpZ2hsaWdodGVkIGJsb2NrLCBhbmQgb3B0aW9uYWxseSB3cmFwcyBpdCB3aXRoXG4gICAgICAgICAgICAgICAgICogYSBzcGFuIHdpdGggYSBuYW1lXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc2VkQmxvY2tcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZUJsb2NrXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gbWF0Y2hOYW1lXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc3QgX2dldFJlcGxhY2VtZW50ID0gZnVuY3Rpb24ocGFzc2VkQmxvY2ssIHJlcGxhY2VCbG9jaywgbWF0Y2hOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZUF0UG9zaXRpb24oaW5kZXhPZkdyb3VwKG1hdGNoLCBncm91cEtleSksIHBhc3NlZEJsb2NrLCBtYXRjaE5hbWUgPyBfd3JhcENvZGVJblNwYW4obWF0Y2hOYW1lLCByZXBsYWNlQmxvY2spIDogcmVwbGFjZUJsb2NrLCByZXBsYWNlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHN0cmluZyB0aGVuIHRoaXMgbWF0Y2ggaXMgZGlyZWN0bHkgbWFwcGVkXG4gICAgICAgICAgICAgICAgLy8gdG8gc2VsZWN0b3Igc28gYWxsIHdlIGhhdmUgdG8gZG8gaXMgd3JhcCBpdCBpbiBhIHNwYW5cbiAgICAgICAgICAgICAgICAvLyBhbmQgY29udGludWUuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBncm91cCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBibG9jaywgZ3JvdXApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGxvY2FsQ29kZTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmlzbSA9IG5ldyBQcmlzbShvcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBzdWJsYW5ndWFnZSBnbyBhbmQgcHJvY2VzcyB0aGUgYmxvY2sgdXNpbmdcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGxhbmd1YWdlXG4gICAgICAgICAgICAgICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQ29kZSA9IHByaXNtLnJlZnJhY3QoYmxvY2ssIGxhbmd1YWdlKTtcbiAgICAgICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBsb2NhbENvZGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHByb2Nlc3MgZ3JvdXAgY2FuIGJlIGEgc2luZ2xlIHBhdHRlcm4gb3IgYW4gYXJyYXkgb2ZcbiAgICAgICAgICAgICAgICAvLyBwYXR0ZXJucy4gYF9wcm9jZXNzQ29kZVdpdGhQYXR0ZXJuc2AgYWx3YXlzIGV4cGVjdHMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAvLyBzbyB3ZSBjb252ZXJ0IGl0IGhlcmUuXG4gICAgICAgICAgICAgICAgbG9jYWxDb2RlID0gcHJpc20ucmVmcmFjdChibG9jaywgY3VycmVudExhbmd1YWdlLCBncm91cFRvUHJvY2Vzcy5sZW5ndGggPyBncm91cFRvUHJvY2VzcyA6IFtncm91cFRvUHJvY2Vzc10pO1xuICAgICAgICAgICAgICAgIF9nZXRSZXBsYWNlbWVudChibG9jaywgbG9jYWxDb2RlLCBncm91cC5tYXRjaGVzID8gZ3JvdXAubmFtZSA6IDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIHBhdHRlcm4gaGFzIHN1YiBtYXRjaGVzIGZvciBkaWZmZXJlbnQgZ3JvdXBzIGluIHRoZSByZWdleFxuICAgICAgICAgICAgLy8gdGhlbiB3ZSBzaG91bGQgcHJvY2VzcyB0aGVtIG9uZSBhdCBhIHRpbWUgYnkgcnVubmluZyB0aGVtIHRocm91Z2hcbiAgICAgICAgICAgIC8vIHRoZSBfcHJvY2Vzc0dyb3VwIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIHRoZSBuZXcgcmVwbGFjZW1lbnQuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2UgdXNlIHRoZSBga2V5c2AgZnVuY3Rpb24gdG8gcnVuIHRocm91Z2ggdGhlbSBiYWNrd2FyZHMgYmVjYXVzZVxuICAgICAgICAgICAgLy8gdGhlIG1hdGNoIHBvc2l0aW9uIG9mIGVhcmxpZXIgbWF0Y2hlcyB3aWxsIG5vdCBjaGFuZ2UgZGVwZW5kaW5nXG4gICAgICAgICAgICAvLyBvbiB3aGF0IGdldHMgcmVwbGFjZWQgaW4gbGF0ZXIgbWF0Y2hlcy5cbiAgICAgICAgICAgIGNvbnN0IGdyb3VwS2V5cyA9IGtleXMocGF0dGVybi5tYXRjaGVzKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZ3JvdXBLZXkgb2YgZ3JvdXBLZXlzKSB7XG4gICAgICAgICAgICAgICAgX3Byb2Nlc3NHcm91cChncm91cEtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZpbmFsbHksIGNhbGwgYG9uTWF0Y2hTdWNjZXNzYCB3aXRoIHRoZSByZXBsYWNlbWVudFxuICAgICAgICAgICAgcmV0dXJuIG9uTWF0Y2hTdWNjZXNzKHJlcGxhY2VtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzZXMgYSBibG9jayBvZiBjb2RlIHVzaW5nIHNwZWNpZmllZCBwYXR0ZXJuc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXR0ZXJuc1xuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc0NvZGVXaXRoUGF0dGVybnMoY29kZSwgcGF0dGVybnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBfcHJvY2Vzc1BhdHRlcm4ocGF0dGVybiwgY29kZSk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBfcHJvY2Vzc1BhdHRlcm4ocGF0dGVybiwgcmVzdWx0LnJlbWFpbmluZywgcmVzdWx0Lm9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZSBhcmUgZG9uZSBwcm9jZXNzaW5nIHRoZSBwYXR0ZXJucyBzbyB3ZSBzaG91bGQgYWN0dWFsbHkgcmVwbGFjZVxuICAgICAgICAgICAgLy8gd2hhdCBuZWVkcyB0byBiZSByZXBsYWNlZCBpbiB0aGUgY29kZS5cbiAgICAgICAgICAgIHJldHVybiBfcHJvY2Vzc1JlcGxhY2VtZW50cyhjb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiByZWdleCBwYXR0ZXJucyBmb3IgdGhpcyBsYW5ndWFnZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRQYXR0ZXJuc0Zvckxhbmd1YWdlKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICBsZXQgcGF0dGVybnMgPSBvcHRpb25zLnBhdHRlcm5zW2xhbmd1YWdlXSB8fCBbXTtcbiAgICAgICAgICAgIHdoaWxlIChvcHRpb25zLmluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXSkge1xuICAgICAgICAgICAgICAgIGxhbmd1YWdlID0gb3B0aW9ucy5pbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV07XG4gICAgICAgICAgICAgICAgcGF0dGVybnMgPSBwYXR0ZXJucy5jb25jYXQob3B0aW9ucy5wYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGF0dGVybnM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGFrZXMgYSBzdHJpbmcgb2YgY29kZSBhbmQgaGlnaGxpZ2h0cyBpdCBhY2NvcmRpbmcgdG8gdGhlIGxhbmd1YWdlXG4gICAgICAgICAqIHNwZWNpZmllZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhdHRlcm5zIG9wdGlvbmFsbHkgc3BlY2lmeSBhIGxpc3Qgb2YgcGF0dGVybnNcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX2hpZ2hsaWdodEJsb2NrRm9yTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2UsIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBsYW5ndWFnZTtcbiAgICAgICAgICAgIHBhdHRlcm5zID0gcGF0dGVybnMgfHwgZ2V0UGF0dGVybnNGb3JMYW5ndWFnZShsYW5ndWFnZSk7XG4gICAgICAgICAgICByZXR1cm4gX3Byb2Nlc3NDb2RlV2l0aFBhdHRlcm5zKGh0bWxFbnRpdGllcyhjb2RlKSwgcGF0dGVybnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyYWN0ID0gX2hpZ2hsaWdodEJsb2NrRm9yTGFuZ3VhZ2U7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcmlzbTtcbiIsImltcG9ydCBQcmlzbSBmcm9tICcuL3ByaXNtJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmFpbmJvd1dvcmtlcihlKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKG1lc3NhZ2Uub3B0aW9ucyk7XG4gICAgY29uc3QgcmVzdWx0ID0gcHJpc20ucmVmcmFjdChtZXNzYWdlLmNvZGUsIG1lc3NhZ2UubGFuZyk7XG5cbiAgICBmdW5jdGlvbiBfcmVwbHkoKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgaWQ6IG1lc3NhZ2UuaWQsXG4gICAgICAgICAgICBsYW5nOiBtZXNzYWdlLmxhbmcsXG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG1lc3NhZ2UuaXNOb2RlKSB7XG4gICAgICAgIF9yZXBseSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIF9yZXBseSgpO1xuICAgIH0sIG1lc3NhZ2Uub3B0aW9ucy5kZWxheSAqIDEwMDApO1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IENyYWlnIENhbXBiZWxsXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogUmFpbmJvdyBpcyBhIHNpbXBsZSBjb2RlIHN5bnRheCBoaWdobGlnaHRlclxuICpcbiAqIEBzZWUgcmFpbmJvd2NvLmRlXG4gKi9cbmltcG9ydCBQcmlzbSBmcm9tICcuL3ByaXNtJztcbmltcG9ydCB7IGlzTm9kZSBhcyB1dGlsSXNOb2RlLCBpc1dvcmtlciBhcyB1dGlsSXNXb3JrZXIsIGNyZWF0ZVdvcmtlciwgZ2V0TGFuZ3VhZ2VGb3JCbG9jayB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgcmFpbmJvd1dvcmtlciBmcm9tICcuL3dvcmtlcic7XG5cbi8qKlxuICogQW4gYXJyYXkgb2YgdGhlIGxhbmd1YWdlIHBhdHRlcm5zIHNwZWNpZmllZCBmb3IgZWFjaCBsYW5ndWFnZVxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmNvbnN0IHBhdHRlcm5zID0ge307XG5cbi8qKlxuICogQW4gb2JqZWN0IG9mIGxhbmd1YWdlcyBtYXBwaW5nIHRvIHdoYXQgbGFuZ3VhZ2UgdGhleSBzaG91bGQgaW5oZXJpdCBmcm9tXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgaW5oZXJpdGVuY2VNYXAgPSB7fTtcblxuLyoqXG4gKiBBIG1hcHBpbmcgb2YgbGFuZ3VhZ2UgYWxpYXNlc1xuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmNvbnN0IGFsaWFzZXMgPSB7fTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiB0aGUgYWN0dWFsIHJhaW5ib3cgb2JqZWN0XG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xubGV0IFJhaW5ib3cgPSB7fTtcblxuLyoqXG4gKiBDYWxsYmFjayB0byBmaXJlIGFmdGVyIGVhY2ggYmxvY2sgaXMgaGlnaGxpZ2h0ZWRcbiAqXG4gKiBAdHlwZSB7bnVsbHxGdW5jdGlvbn1cbiAqL1xubGV0IG9uSGlnaGxpZ2h0Q2FsbGJhY2s7XG5cbi8qKlxuICogQ291bnRlciBmb3IgYmxvY2sgaWRzXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jY2FtcGJlbGwvcmFpbmJvdy9pc3N1ZXMvMjA3XG4gKi9cbmxldCBpZCA9IDA7XG5cbmNvbnN0IGlzTm9kZSA9IHV0aWxJc05vZGUoKTtcbmNvbnN0IGlzV29ya2VyID0gdXRpbElzV29ya2VyKCk7XG5cbmxldCBjYWNoZWRXb3JrZXIgPSBudWxsO1xuZnVuY3Rpb24gX2dldFdvcmtlcigpIHtcbiAgICBpZiAoaXNOb2RlIHx8IGNhY2hlZFdvcmtlciA9PT0gbnVsbCkge1xuICAgICAgICBjYWNoZWRXb3JrZXIgPSBjcmVhdGVXb3JrZXIocmFpbmJvd1dvcmtlciwgUHJpc20pO1xuICAgIH1cblxuICAgIHJldHVybiBjYWNoZWRXb3JrZXI7XG59XG5cbi8qKlxuICogSGVscGVyIGZvciBtYXRjaGluZyB1cCBjYWxsYmFja3MgZGlyZWN0bHkgd2l0aCB0aGVcbiAqIHBvc3QgbWVzc2FnZSByZXF1ZXN0cyB0byBhIHdlYiB3b3JrZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG1lc3NhZ2UgICAgICBkYXRhIHRvIHNlbmQgdG8gd2ViIHdvcmtlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgICBjYWxsYmFjayBmdW5jdGlvbiBmb3Igd29ya2VyIHRvIHJlcGx5IHRvXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfbWVzc2FnZVdvcmtlcihtZXNzYWdlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHdvcmtlciA9IF9nZXRXb3JrZXIoKTtcblxuICAgIGZ1bmN0aW9uIF9saXN0ZW4oZSkge1xuICAgICAgICBpZiAoZS5kYXRhLmlkID09PSBtZXNzYWdlLmlkKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlLmRhdGEpO1xuICAgICAgICAgICAgd29ya2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBfbGlzdGVuKTtcblxuICAgICAgICAgICAgLy8gSSByZWFsaXplZCBkb3duIHRoZSByb2FkIEkgbWlnaHQgbG9vayBhdCB0aGlzIGFuZCB3b25kZXIgd2hhdCBpcyBnb2luZyBvblxuICAgICAgICAgICAgLy8gc28gcHJvYmFibHkgaXQgaXMgbm90IGEgYmFkIGlkZWEgdG8gbGVhdmUgYSBjb21tZW50LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgcmlnaHQgbm93IHRoZSBub2RlIGxpYnJhcnkgZm9yIHNpbXVsYXRpbmcgd2ViXG4gICAgICAgICAgICAvLyB3b3JrZXJzIOKAnHdlYi13b3JrZXLigJ0gd2lsbCBrZWVwIHRoZSB3b3JrZXIgb3BlbiBhbmQgaXQgY2F1c2VzXG4gICAgICAgICAgICAvLyBzY3JpcHRzIHJ1bm5pbmcgZnJvbSB0aGUgY29tbWFuZCBsaW5lIHRvIGhhbmcgdW5sZXNzIHRoZSB3b3JrZXIgaXNcbiAgICAgICAgICAgIC8vIGV4cGxpY2l0bHkgY2xvc2VkLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoaXMgbWVhbnMgZm9yIG5vZGUgd2Ugd2lsbCBzcGF3biBhIG5ldyB0aHJlYWQgZm9yIGV2ZXJ5IGFzeW5jaHJvbm91c1xuICAgICAgICAgICAgLy8gYmxvY2sgd2UgYXJlIGhpZ2hsaWdodGluZywgYnV0IGluIHRoZSBicm93c2VyIHdlIHdpbGwga2VlcCBhIHNpbmdsZVxuICAgICAgICAgICAgLy8gd29ya2VyIG9wZW4gZm9yIGFsbCByZXF1ZXN0cy5cbiAgICAgICAgICAgIGlmIChpc05vZGUpIHtcbiAgICAgICAgICAgICAgICB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF9saXN0ZW4pO1xuICAgIHdvcmtlci5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBCcm93c2VyIE9ubHkgLSBIYW5kbGVzIHJlc3BvbnNlIGZyb20gd2ViIHdvcmtlciwgdXBkYXRlcyBET00gd2l0aFxuICogcmVzdWx0aW5nIGNvZGUsIGFuZCBmaXJlcyBjYWxsYmFja1xuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtvYmplY3R9IHdhaXRpbmdPblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9nZW5lcmF0ZUhhbmRsZXIoZWxlbWVudCwgd2FpdGluZ09uLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiBfaGFuZGxlUmVzcG9uc2VGcm9tV29ya2VyKGRhdGEpIHtcbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBkYXRhLnJlc3VsdDtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgncmFpbmJvdy1zaG93Jyk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnQucGFyZW50Tm9kZS50YWdOYW1lID09PSAnUFJFJykge1xuICAgICAgICAgICAgZWxlbWVudC5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5jbGFzc0xpc3QuYWRkKCdyYWluYm93LXNob3cnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uZW5kJywgKGUpID0+IHtcbiAgICAgICAgLy8gICAgIGlmIChlLmFuaW1hdGlvbk5hbWUgPT09ICdmYWRlLWluJykge1xuICAgICAgICAvLyAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAvLyAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2RlY3JlYXNlLWRlbGF5Jyk7XG4gICAgICAgIC8vICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIGlmIChvbkhpZ2hsaWdodENhbGxiYWNrKSB7XG4gICAgICAgICAgICBvbkhpZ2hsaWdodENhbGxiYWNrKGVsZW1lbnQsIGRhdGEubGFuZyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoLS13YWl0aW5nT24uYyA9PT0gMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8qKlxuICogR2V0cyBvcHRpb25zIG5lZWRlZCB0byBwYXNzIGludG8gUHJpc21cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBfZ2V0UHJpc21PcHRpb25zKG9wdGlvbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBwYXR0ZXJucyxcbiAgICAgICAgaW5oZXJpdGVuY2VNYXAsXG4gICAgICAgIGFsaWFzZXMsXG4gICAgICAgIGdsb2JhbENsYXNzOiBvcHRpb25zLmdsb2JhbENsYXNzLFxuICAgICAgICBkZWxheTogIWlzTmFOKG9wdGlvbnMuZGVsYXkpID8gb3B0aW9ucy5kZWxheSA6IDBcbiAgICB9O1xufVxuXG4vKipcbiAqIEdldHMgZGF0YSB0byBzZW5kIHRvIHdlYndvcmtlclxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHBhcmFtICB7c3RyaW5nfSBsYW5nXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIF9nZXRXb3JrZXJEYXRhKGNvZGUsIGxhbmcpIHtcbiAgICBsZXQgb3B0aW9ucyA9IHt9O1xuICAgIGlmICh0eXBlb2YgbGFuZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgb3B0aW9ucyA9IGxhbmc7XG4gICAgICAgIGxhbmcgPSBvcHRpb25zLmxhbmd1YWdlO1xuICAgIH1cblxuICAgIGxhbmcgPSBhbGlhc2VzW2xhbmddIHx8IGxhbmc7XG5cbiAgICBjb25zdCB3b3JrZXJEYXRhID0ge1xuICAgICAgICBpZDogaWQrKyxcbiAgICAgICAgY29kZSxcbiAgICAgICAgbGFuZyxcbiAgICAgICAgb3B0aW9uczogX2dldFByaXNtT3B0aW9ucyhvcHRpb25zKSxcbiAgICAgICAgaXNOb2RlXG4gICAgfTtcblxuICAgIHJldHVybiB3b3JrZXJEYXRhO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIFNlbmRzIG1lc3NhZ2VzIHRvIHdlYiB3b3JrZXIgdG8gaGlnaGxpZ2h0IGVsZW1lbnRzIHBhc3NlZFxuICogaW5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBjb2RlQmxvY2tzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX2hpZ2hsaWdodENvZGVCbG9ja3MoY29kZUJsb2NrcywgY2FsbGJhY2spIHtcbiAgICBjb25zdCB3YWl0aW5nT24gPSB7IGM6IDAgfTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGNvZGVCbG9ja3MpIHtcbiAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBnZXRMYW5ndWFnZUZvckJsb2NrKGJsb2NrKTtcbiAgICAgICAgaWYgKGJsb2NrLmNsYXNzTGlzdC5jb250YWlucygncmFpbmJvdycpIHx8ICFsYW5ndWFnZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGNhbmNlbHMgdGhlIHBlbmRpbmcgYW5pbWF0aW9uIHRvIGZhZGUgdGhlIGNvZGUgaW4gb24gbG9hZFxuICAgICAgICAvLyBzaW5jZSB3ZSB3YW50IHRvIGRlbGF5IGRvaW5nIHRoaXMgdW50aWwgaXQgaXMgYWN0dWFsbHlcbiAgICAgICAgLy8gaGlnaGxpZ2h0ZWRcbiAgICAgICAgYmxvY2suY2xhc3NMaXN0LmFkZCgnbG9hZGluZycpO1xuICAgICAgICBibG9jay5jbGFzc0xpc3QuYWRkKCdyYWluYm93Jyk7XG5cbiAgICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgdG8gYWxzbyBhZGQgdGhlIGxvYWRpbmcgY2xhc3MgdG8gdGhlIHByZSB0YWdcbiAgICAgICAgLy8gYmVjYXVzZSB0aGF0IGlzIGhvdyB3ZSB3aWxsIGtub3cgdG8gc2hvdyBhIHByZWxvYWRlclxuICAgICAgICBpZiAoYmxvY2sucGFyZW50Tm9kZS50YWdOYW1lID09PSAnUFJFJykge1xuICAgICAgICAgICAgYmxvY2sucGFyZW50Tm9kZS5jbGFzc0xpc3QuYWRkKCdsb2FkaW5nJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBnbG9iYWxDbGFzcyA9IGJsb2NrLmdldEF0dHJpYnV0ZSgnZGF0YS1nbG9iYWwtY2xhc3MnKTtcbiAgICAgICAgY29uc3QgZGVsYXkgPSBwYXJzZUludChibG9jay5nZXRBdHRyaWJ1dGUoJ2RhdGEtZGVsYXknKSwgMTApO1xuXG4gICAgICAgICsrd2FpdGluZ09uLmM7XG4gICAgICAgIF9tZXNzYWdlV29ya2VyKF9nZXRXb3JrZXJEYXRhKGJsb2NrLmlubmVySFRNTCwgeyBsYW5ndWFnZSwgZ2xvYmFsQ2xhc3MsIGRlbGF5IH0pLCBfZ2VuZXJhdGVIYW5kbGVyKGJsb2NrLCB3YWl0aW5nT24sIGNhbGxiYWNrKSk7XG4gICAgfVxuXG4gICAgaWYgKHdhaXRpbmdPbi5jID09PSAwKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfYWRkUHJlbG9hZGVyKHByZUJsb2NrKSB7XG4gICAgY29uc3QgcHJlbG9hZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcHJlbG9hZGVyLmNsYXNzTmFtZSA9ICdwcmVsb2FkZXInO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIHByZWxvYWRlci5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSk7XG4gICAgfVxuICAgIHByZUJsb2NrLmFwcGVuZENoaWxkKHByZWxvYWRlcik7XG59XG5cbi8qKlxuICogQnJvd3NlciBPbmx5IC0gU3RhcnQgaGlnaGxpZ2h0aW5nIGFsbCB0aGUgY29kZSBibG9ja3NcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IG5vZGUgICAgICAgSFRNTEVsZW1lbnQgdG8gc2VhcmNoIHdpdGhpblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9oaWdobGlnaHQobm9kZSwgY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uKCkge307XG5cbiAgICAvLyBUaGUgZmlyc3QgYXJndW1lbnQgY2FuIGJlIGFuIEV2ZW50IG9yIGEgRE9NIEVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyBJIHdhcyBvcmlnaW5hbGx5IGNoZWNraW5nIGluc3RhbmNlb2YgRXZlbnQgYnV0IHRoYXQgbWFkZSBpdCBicmVha1xuICAgIC8vIHdoZW4gdXNpbmcgbW9vdG9vbHMuXG4gICAgLy9cbiAgICAvLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jY2FtcGJlbGwvcmFpbmJvdy9pc3N1ZXMvMzJcbiAgICBub2RlID0gbm9kZSAmJiB0eXBlb2Ygbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSA9PT0gJ2Z1bmN0aW9uJyA/IG5vZGUgOiBkb2N1bWVudDtcblxuICAgIGNvbnN0IHByZUJsb2NrcyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3ByZScpO1xuICAgIGNvbnN0IGNvZGVCbG9ja3MgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2RlJyk7XG4gICAgY29uc3QgZmluYWxQcmVCbG9ja3MgPSBbXTtcbiAgICBjb25zdCBmaW5hbENvZGVCbG9ja3MgPSBbXTtcblxuICAgIC8vIEZpcnN0IGxvb3AgdGhyb3VnaCBhbGwgcHJlIGJsb2NrcyB0byBmaW5kIHdoaWNoIG9uZXMgdG8gaGlnaGxpZ2h0XG4gICAgZm9yIChjb25zdCBwcmVCbG9jayBvZiBwcmVCbG9ja3MpIHtcbiAgICAgICAgX2FkZFByZWxvYWRlcihwcmVCbG9jayk7XG5cbiAgICAgICAgLy8gU3RyaXAgd2hpdGVzcGFjZSBhcm91bmQgY29kZSB0YWdzIHdoZW4gdGhleSBhcmUgaW5zaWRlIG9mIGEgcHJlXG4gICAgICAgIC8vIHRhZy4gIFRoaXMgbWFrZXMgdGhlIHRoZW1lcyBsb29rIGJldHRlciBiZWNhdXNlIHlvdSBjYW4ndFxuICAgICAgICAvLyBhY2NpZGVudGFsbHkgYWRkIGV4dHJhIGxpbmVicmVha3MgYXQgdGhlIHN0YXJ0IGFuZCBlbmQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdoZW4gdGhlIHByZSB0YWcgY29udGFpbnMgYSBjb2RlIHRhZyB0aGVuIHN0cmlwIGFueSBleHRyYVxuICAgICAgICAvLyB3aGl0ZXNwYWNlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBGb3IgZXhhbXBsZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gPHByZT5cbiAgICAgICAgLy8gICAgICA8Y29kZT52YXIgZm9vID0gdHJ1ZTs8L2NvZGU+XG4gICAgICAgIC8vIDwvcHJlPlxuICAgICAgICAvL1xuICAgICAgICAvLyB3aWxsIGJlY29tZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gPHByZT48Y29kZT52YXIgZm9vID0gdHJ1ZTs8L2NvZGU+PC9wcmU+XG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIHlvdSB3YW50IHRvIHByZXNlcnZlIHdoaXRlc3BhY2UgeW91IGNhbiB1c2UgYSBwcmUgdGFnIG9uXG4gICAgICAgIC8vIGl0cyBvd24gd2l0aG91dCBhIGNvZGUgdGFnIGluc2lkZSBvZiBpdC5cbiAgICAgICAgaWYgKHByZUJsb2NrLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2RlJykubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIC8vIFRoaXMgZml4ZXMgYSByYWNlIGNvbmRpdGlvbiB3aGVuIFJhaW5ib3cuY29sb3IgaXMgY2FsbGVkIGJlZm9yZVxuICAgICAgICAgICAgLy8gdGhlIHByZXZpb3VzIGNvbG9yIGNhbGwgaGFzIGZpbmlzaGVkLlxuICAgICAgICAgICAgaWYgKCFwcmVCbG9jay5nZXRBdHRyaWJ1dGUoJ2RhdGEtdHJpbW1lZCcpKSB7XG4gICAgICAgICAgICAgICAgcHJlQmxvY2suc2V0QXR0cmlidXRlKCdkYXRhLXRyaW1tZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBwcmVCbG9jay5pbm5lckhUTUwgPSBwcmVCbG9jay5pbm5lckhUTUwudHJpbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgcHJlIGJsb2NrIGhhcyBubyBjb2RlIGJsb2NrcyB0aGVuIHdlIGFyZSBnb2luZyB0byB3YW50IHRvXG4gICAgICAgIC8vIHByb2Nlc3MgaXQgZGlyZWN0bHkuXG4gICAgICAgIGZpbmFsUHJlQmxvY2tzLnB1c2gocHJlQmxvY2spO1xuICAgIH1cblxuICAgIC8vIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNzM1MDY3L2hvdy10by1jb252ZXJ0LWEtZG9tLW5vZGUtbGlzdC10by1hbi1hcnJheS1pbi1qYXZhc2NyaXB0XG4gICAgLy8gV2UgYXJlIGdvaW5nIHRvIHByb2Nlc3MgYWxsIDxjb2RlPiBibG9ja3NcbiAgICBmb3IgKGNvbnN0IGNvZGVCbG9jayBvZiBjb2RlQmxvY2tzKSB7XG4gICAgICAgIGZpbmFsQ29kZUJsb2Nrcy5wdXNoKGNvZGVCbG9jayk7XG4gICAgfVxuXG4gICAgX2hpZ2hsaWdodENvZGVCbG9ja3MoZmluYWxDb2RlQmxvY2tzLmNvbmNhdChmaW5hbFByZUJsb2NrcyksIGNhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBDYWxsYmFjayB0byBsZXQgeW91IGRvIHN0dWZmIGluIHlvdXIgYXBwIGFmdGVyIGEgcGllY2Ugb2YgY29kZSBoYXNcbiAqIGJlZW4gaGlnaGxpZ2h0ZWRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gb25IaWdobGlnaHQoY2FsbGJhY2spIHtcbiAgICBvbkhpZ2hsaWdodENhbGxiYWNrID0gY2FsbGJhY2s7XG59XG5cbi8qKlxuICogRXh0ZW5kcyB0aGUgbGFuZ3VhZ2UgcGF0dGVybiBtYXRjaGVzXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlICAgICAgICAgICAgbmFtZSBvZiBsYW5ndWFnZVxuICogQHBhcmFtIHtvYmplY3R9IGxhbmd1YWdlUGF0dGVybnMgICAgb2JqZWN0IG9mIHBhdHRlcm5zIHRvIGFkZCBvblxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBpbmhlcml0cyAgb3B0aW9uYWwgbGFuZ3VhZ2UgdGhhdCB0aGlzIGxhbmd1YWdlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG91bGQgaW5oZXJpdCBydWxlcyBmcm9tXG4gKi9cbmZ1bmN0aW9uIGV4dGVuZChsYW5ndWFnZSwgbGFuZ3VhZ2VQYXR0ZXJucywgaW5oZXJpdHMpIHtcblxuICAgIC8vIElmIHdlIGV4dGVuZCBhIGxhbmd1YWdlIGFnYWluIHdlIHNob3VsZG4ndCBuZWVkIHRvIHNwZWNpZnkgdGhlXG4gICAgLy8gaW5oZXJpdGVuY2UgZm9yIGl0LiBGb3IgZXhhbXBsZSwgaWYgeW91IGFyZSBhZGRpbmcgc3BlY2lhbCBoaWdobGlnaHRpbmdcbiAgICAvLyBmb3IgYSBqYXZhc2NyaXB0IGZ1bmN0aW9uIHRoYXQgaXMgbm90IGluIHRoZSBiYXNlIGphdmFzY3JpcHQgcnVsZXMsIHlvdVxuICAgIC8vIHNob3VsZCBiZSBhYmxlIHRvIGRvXG4gICAgLy9cbiAgICAvLyBSYWluYm93LmV4dGVuZCgnamF2YXNjcmlwdCcsIFsg4oCmIF0pO1xuICAgIC8vXG4gICAgLy8gV2l0aG91dCBzcGVjaWZ5aW5nIGEgbGFuZ3VhZ2UgaXQgc2hvdWxkIGluaGVyaXQgKGdlbmVyaWMgaW4gdGhpcyBjYXNlKVxuICAgIGlmICghaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdKSB7XG4gICAgICAgIGluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXSA9IGluaGVyaXRzO1xuICAgIH1cblxuICAgIHBhdHRlcm5zW2xhbmd1YWdlXSA9IGxhbmd1YWdlUGF0dGVybnMuY29uY2F0KHBhdHRlcm5zW2xhbmd1YWdlXSB8fCBbXSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZShsYW5ndWFnZSkge1xuICAgIGRlbGV0ZSBpbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV07XG4gICAgZGVsZXRlIHBhdHRlcm5zW2xhbmd1YWdlXTtcbn1cblxuLyoqXG4gKiBTdGFydHMgdGhlIG1hZ2ljIHJhaW5ib3dcbiAqXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBjb2xvciguLi5hcmdzKSB7XG5cbiAgICAvLyBJZiB5b3Ugd2FudCB0byBzdHJhaWdodCB1cCBoaWdobGlnaHQgYSBzdHJpbmcgeW91IGNhbiBwYXNzIHRoZVxuICAgIC8vIHN0cmluZyBvZiBjb2RlLCB0aGUgbGFuZ3VhZ2UsIGFuZCBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgIC8vXG4gICAgLy8gRXhhbXBsZTpcbiAgICAvL1xuICAgIC8vIFJhaW5ib3cuY29sb3IoY29kZSwgbGFuZ3VhZ2UsIGZ1bmN0aW9uKGhpZ2hsaWdodGVkQ29kZSwgbGFuZ3VhZ2UpIHtcbiAgICAvLyAgICAgLy8gdGhpcyBjb2RlIGJsb2NrIGlzIG5vdyBoaWdobGlnaHRlZFxuICAgIC8vIH0pO1xuICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3Qgd29ya2VyRGF0YSA9IF9nZXRXb3JrZXJEYXRhKGFyZ3NbMF0sIGFyZ3NbMV0pO1xuICAgICAgICBfbWVzc2FnZVdvcmtlcih3b3JrZXJEYXRhLCAoZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGRhdGEucmVzdWx0LCBkYXRhLmxhbmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0oYXJnc1syXSkpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHlvdSBwYXNzIGEgY2FsbGJhY2sgZnVuY3Rpb24gdGhlbiB3ZSByZXJ1biB0aGUgY29sb3IgZnVuY3Rpb25cbiAgICAvLyBvbiBhbGwgdGhlIGNvZGUgYW5kIGNhbGwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIG9uIGNvbXBsZXRlLlxuICAgIC8vXG4gICAgLy8gRXhhbXBsZTpcbiAgICAvL1xuICAgIC8vIFJhaW5ib3cuY29sb3IoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCdBbGwgbWF0Y2hpbmcgdGFncyBvbiB0aGUgcGFnZSBhcmUgbm93IGhpZ2hsaWdodGVkJyk7XG4gICAgLy8gfSk7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIF9oaWdobGlnaHQoMCwgYXJnc1swXSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2Ugd2UgdXNlIHdoYXRldmVyIG5vZGUgeW91IHBhc3NlZCBpbiB3aXRoIGFuIG9wdGlvbmFsXG4gICAgLy8gY2FsbGJhY2sgZnVuY3Rpb24gYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXIuXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gdmFyIHByZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcbiAgICAvLyB2YXIgY29kZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjb2RlJyk7XG4gICAgLy8gY29kZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJywgJ2phdmFzY3JpcHQnKTtcbiAgICAvLyBjb2RlRWxlbWVudC5pbm5lckhUTUwgPSAnLy8gSGVyZSBpcyBzb21lIEphdmFTY3JpcHQnO1xuICAgIC8vIHByZUVsZW1lbnQuYXBwZW5kQ2hpbGQoY29kZUVsZW1lbnQpO1xuICAgIC8vIFJhaW5ib3cuY29sb3IocHJlRWxlbWVudCwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIC8vIE5ldyBlbGVtZW50IGlzIG5vdyBoaWdobGlnaHRlZFxuICAgIC8vIH0pO1xuICAgIC8vXG4gICAgLy8gSWYgeW91IGRvbid0IHBhc3MgYW4gZWxlbWVudCBpdCB3aWxsIGRlZmF1bHQgdG8gYGRvY3VtZW50YFxuICAgIF9oaWdobGlnaHQoYXJnc1swXSwgYXJnc1sxXSk7XG59XG5cbi8qKlxuICogTWV0aG9kIHRvIGFkZCBhbiBhbGlhcyBmb3IgYW4gZXhpc3RpbmcgbGFuZ3VhZ2UuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgeW91IHdhbnQgdG8gaGF2ZSBcImNvZmZlZVwiIG1hcCB0byBcImNvZmZlZXNjcmlwdFwiXG4gKlxuICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vY2NhbXBiZWxsL3JhaW5ib3cvaXNzdWVzLzE1NFxuICogQHBhcmFtIHtzdHJpbmd9IGFsaWFzXG4gKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxMYW5ndWFnZVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gYWRkQWxpYXMoYWxpYXMsIG9yaWdpbmFsTGFuZ3VhZ2UpIHtcbiAgICBhbGlhc2VzW2FsaWFzXSA9IG9yaWdpbmFsTGFuZ3VhZ2U7XG59XG5cbi8qKlxuICogcHVibGljIG1ldGhvZHNcbiAqL1xuUmFpbmJvdyA9IHtcbiAgICBleHRlbmQsXG4gICAgcmVtb3ZlLFxuICAgIG9uSGlnaGxpZ2h0LFxuICAgIGFkZEFsaWFzLFxuICAgIGNvbG9yXG59O1xuXG5pZiAoaXNOb2RlKSB7XG4gICAgUmFpbmJvdy5jb2xvclN5bmMgPSBmdW5jdGlvbihjb2RlLCBsYW5nKSB7XG4gICAgICAgIGNvbnN0IHdvcmtlckRhdGEgPSBfZ2V0V29ya2VyRGF0YShjb2RlLCBsYW5nKTtcbiAgICAgICAgY29uc3QgcHJpc20gPSBuZXcgUHJpc20od29ya2VyRGF0YS5vcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHByaXNtLnJlZnJhY3Qod29ya2VyRGF0YS5jb2RlLCB3b3JrZXJEYXRhLmxhbmcpO1xuICAgIH07XG59XG5cbi8vIEluIHRoZSBicm93c2VyIGhvb2sgaXQgdXAgdG8gY29sb3Igb24gcGFnZSBsb2FkXG5pZiAoIWlzTm9kZSAmJiAhaXNXb3JrZXIpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmICghUmFpbmJvdy5kZWZlcikge1xuICAgICAgICAgICAgUmFpbmJvdy5jb2xvcihldmVudCk7XG4gICAgICAgIH1cbiAgICB9LCBmYWxzZSk7XG59XG5cbi8vIEZyb20gYSBub2RlIHdvcmtlciwgaGFuZGxlIHRoZSBwb3N0TWVzc2FnZSByZXF1ZXN0cyB0byBpdFxuaWYgKGlzV29ya2VyKSB7XG4gICAgc2VsZi5vbm1lc3NhZ2UgPSByYWluYm93V29ya2VyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBSYWluYm93O1xuIl0sIm5hbWVzIjpbImlzTm9kZSIsImlzV29ya2VyIiwibGV0IiwiY29uc3QiLCJ1dGlsSXNOb2RlIiwidXRpbElzV29ya2VyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7SUFDTyxTQUFTQSxRQUFNLEdBQUc7O1FBRXJCLE9BQU8sT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE9BQU8sTUFBTSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUM7S0FDOUU7O0FBRUQsQUFBTyxJQUFBLFNBQVNDLFVBQVEsR0FBRztRQUN2QixPQUFPLE9BQU8sUUFBUSxLQUFLLFdBQVcsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLENBQUM7S0FDekU7Ozs7Ozs7O0FBUUQsQUFBTyxJQUFBLFNBQVMsbUJBQW1CLENBQUMsS0FBSyxFQUFFOzs7Ozs7O1FBT3ZDQyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDOzs7Ozs7UUFNckcsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNYQyxJQUFNLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQztZQUN4Q0EsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElB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