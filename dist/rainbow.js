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
            global.Worker = require('webworker-threads').Worker;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3ByaXNtLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9yYWluYm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICAvKiBnbG9iYWxzIG1vZHVsZSAqL1xuICAgIHJldHVybiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXb3JrZXIoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEdldHMgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGJsb2NrIG9mIGNvZGVcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJsb2NrXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spIHtcblxuICAgIC8vIElmIHRoaXMgZG9lc24ndCBoYXZlIGEgbGFuZ3VhZ2UgYnV0IHRoZSBwYXJlbnQgZG9lcyB0aGVuIHVzZSB0aGF0LlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBpZiBmb3IgZXhhbXBsZSB5b3UgaGF2ZTogPHByZSBkYXRhLWxhbmd1YWdlPVwicGhwXCI+XG4gICAgLy8gd2l0aCBhIGJ1bmNoIG9mIDxjb2RlPiBibG9ja3MgaW5zaWRlIHRoZW4geW91IGRvIG5vdCBoYXZlXG4gICAgLy8gdG8gc3BlY2lmeSB0aGUgbGFuZ3VhZ2UgZm9yIGVhY2ggYmxvY2suXG4gICAgbGV0IGxhbmd1YWdlID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJykgfHwgYmxvY2sucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnKTtcblxuICAgIC8vIFRoaXMgYWRkcyBzdXBwb3J0IGZvciBzcGVjaWZ5aW5nIGxhbmd1YWdlIHZpYSBhIENTUyBjbGFzcy5cbiAgICAvL1xuICAgIC8vIFlvdSBjYW4gdXNlIHRoZSBHb29nbGUgQ29kZSBQcmV0dGlmeSBzdHlsZTogPHByZSBjbGFzcz1cImxhbmctcGhwXCI+XG4gICAgLy8gb3IgdGhlIEhUTUw1IHN0eWxlOiA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtcGhwXCI+XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1xcYmxhbmcoPzp1YWdlKT8tKFxcdyspLztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBibG9jay5jbGFzc05hbWUubWF0Y2gocGF0dGVybikgfHwgYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBsYW5ndWFnZSA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGRpZmZlcmVudCBtYXRjaGVzIGhhdmUgY29tcGxldGUgb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXJcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQxICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICBlbmQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDIgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQyICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29tcGxldGVPdmVybGFwKHN0YXJ0MSwgZW5kMSwgc3RhcnQyLCBlbmQyKSB7XG5cbiAgICAvLyBJZiB0aGUgc3RhcnRpbmcgYW5kIGVuZCBwb3NpdGlvbnMgYXJlIGV4YWN0bHkgdGhlIHNhbWVcbiAgICAvLyB0aGVuIHRoZSBmaXJzdCBvbmUgc2hvdWxkIHN0YXkgYW5kIHRoaXMgb25lIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChzdGFydDIgPT09IHN0YXJ0MSAmJiBlbmQyID09PSBlbmQxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQyIDw9IHN0YXJ0MSAmJiBlbmQyID49IGVuZDE7XG59XG5cbi8qKlxuICogRW5jb2RlcyA8IGFuZCA+IGFzIGh0bWwgZW50aXRpZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaHRtbEVudGl0aWVzKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyYoPyFbXFx3XFwjXSs7KS9nLCAnJmFtcDsnKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvdXQgdGhlIHBvc2l0aW9uIG9mIGdyb3VwIG1hdGNoIGZvciBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICpcbiAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTg1NTk0L2hvdy10by1maW5kLWluZGV4LW9mLWdyb3Vwcy1pbi1tYXRjaFxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBOdW1iZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBOdW1iZXIpIHtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cE51bWJlcjsgKytpKSB7XG4gICAgICAgIGlmIChtYXRjaFtpXSkge1xuICAgICAgICAgICAgaW5kZXggKz0gbWF0Y2hbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBuZXcgbWF0Y2ggaW50ZXJzZWN0cyB3aXRoIGFuIGV4aXN0aW5nIG9uZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDEgICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICAgZW5kIHBvc2l0aW9uIG9mIGV4aXN0aW5nIG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQyICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZDIgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhzdGFydDEsIGVuZDEsIHN0YXJ0MiwgZW5kMikge1xuICAgIGlmIChzdGFydDIgPj0gc3RhcnQxICYmIHN0YXJ0MiA8IGVuZDEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuZDIgPiBzdGFydDEgJiYgZW5kMiA8IGVuZDE7XG59XG5cbi8qKlxuICogU29ydHMgYW4gb2JqZWN0cyBrZXlzIGJ5IGluZGV4IGRlc2NlbmRpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgbG9jYXRpb25zLnB1c2gobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbnVtZXJpYyBkZXNjZW5kaW5nXG4gICAgcmV0dXJuIGxvY2F0aW9ucy5zb3J0KChhLCBiKSA9PiBiIC0gYSk7XG59XG5cbi8qKlxuICogU3Vic3RyaW5nIHJlcGxhY2UgY2FsbCB0byByZXBsYWNlIHBhcnQgb2YgYSBzdHJpbmcgYXQgYSBjZXJ0YWluIHBvc2l0aW9uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uICAgICAgICAgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGhhcHBlblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2UgICAgICAgICAgdGhlIHRleHQgd2Ugd2FudCB0byByZXBsYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZVdpdGggICAgICB0aGUgdGV4dCB3ZSB3YW50IHRvIHJlcGxhY2UgaXQgd2l0aFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICAgICAgdGhlIGNvZGUgd2UgYXJlIGRvaW5nIHRoZSByZXBsYWNpbmcgaW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlLCByZXBsYWNlV2l0aCwgY29kZSkge1xuICAgIGNvbnN0IHN1YlN0cmluZyA9IGNvZGUuc3Vic3RyKHBvc2l0aW9uKTtcbiAgICByZXR1cm4gY29kZS5zdWJzdHIoMCwgcG9zaXRpb24pICsgc3ViU3RyaW5nLnJlcGxhY2UocmVwbGFjZSwgcmVwbGFjZVdpdGgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB1c2FibGUgd2ViIHdvcmtlciBmcm9tIGFuIGFub255bW91cyBmdW5jdGlvblxuICpcbiAqIG1vc3RseSBib3Jyb3dlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS96ZXZlcm8vd29ya2VyLWNyZWF0ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1ByaXNtfSBQcmlzbVxuICogQHJldHVybiB7V29ya2VyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV29ya2VyKGZuLCBQcmlzbSkge1xuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgICAvKiBnbG9iYWxzIGdsb2JhbCwgcmVxdWlyZSwgX19maWxlbmFtZSAqL1xuICAgICAgICBnbG9iYWwuV29ya2VyID0gcmVxdWlyZSgnd2Vid29ya2VyLXRocmVhZHMnKS5Xb3JrZXI7XG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKF9fZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHByaXNtRnVuY3Rpb24gPSBQcmlzbS50b1N0cmluZygpO1xuXG4gICAgbGV0IGNvZGUgPSBrZXlzLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBodG1sRW50aXRpZXMudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGhhc0NvbXBsZXRlT3ZlcmxhcC50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gaW50ZXJzZWN0cy50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gcmVwbGFjZUF0UG9zaXRpb24udG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGluZGV4T2ZHcm91cC50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gcHJpc21GdW5jdGlvbjtcblxuICAgIGNvbnN0IGZ1bGxTdHJpbmcgPSBgJHtjb2RlfVxcdHRoaXMub25tZXNzYWdlPSR7Zm4udG9TdHJpbmcoKX1gO1xuXG4gICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtmdWxsU3RyaW5nXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KTtcbiAgICByZXR1cm4gbmV3IFdvcmtlcigod2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMKS5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xufVxuIiwiaW1wb3J0IHsgcmVwbGFjZUF0UG9zaXRpb24sIGluZGV4T2ZHcm91cCwga2V5cywgaHRtbEVudGl0aWVzLCBoYXNDb21wbGV0ZU92ZXJsYXAsIGludGVyc2VjdHMgfSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIFByaXNtIGlzIGEgY2xhc3MgdXNlZCB0byBoaWdobGlnaHQgaW5kaXZpZHVhbCBibG9ja3Mgb2YgY29kZVxuICpcbiAqIEBjbGFzc1xuICovXG5jbGFzcyBQcmlzbSB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICAvKipcbiAgICAgICAgICogT2JqZWN0IG9mIHJlcGxhY2VtZW50cyB0byBwcm9jZXNzIGF0IHRoZSBlbmQgb2YgdGhlIHByb2Nlc3NpbmdcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMYW5ndWFnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBQcmlzbSBvYmplY3RcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGxldCBjdXJyZW50TGFuZ3VhZ2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9iamVjdCBvZiBzdGFydCBhbmQgZW5kIHBvc2l0aW9ucyBvZiBibG9ja3MgdG8gYmUgcmVwbGFjZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50UG9zaXRpb25zID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgaWYgdGhlIG1hdGNoIHBhc3NlZCBpbiBmYWxscyBpbnNpZGUgb2YgYW4gZXhpc3RpbmcgbWF0Y2guXG4gICAgICAgICAqIFRoaXMgcHJldmVudHMgYSByZWdleCBwYXR0ZXJuIGZyb20gbWF0Y2hpbmcgaW5zaWRlIG9mIGFub3RoZXIgcGF0dGVyblxuICAgICAgICAgKiB0aGF0IG1hdGNoZXMgYSBsYXJnZXIgYW1vdW50IG9mIGNvZGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBleGFtcGxlIHRoaXMgcHJldmVudHMgYSBrZXl3b3JkIGZyb20gbWF0Y2hpbmcgYGZ1bmN0aW9uYCBpZiB0aGVyZVxuICAgICAgICAgKiBpcyBhbHJlYWR5IGEgbWF0Y2ggZm9yIGBmdW5jdGlvbiAoLiopYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0ICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZW5kICAgICAgZW5kIHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX21hdGNoSXNJbnNpZGVPdGhlck1hdGNoKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiByZXBsYWNlbWVudFBvc2l0aW9ucykge1xuICAgICAgICAgICAgICAgIGtleSA9IHBhcnNlSW50KGtleSwgMTApO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBibG9jayBjb21wbGV0ZWx5IG92ZXJsYXBzIHdpdGggYW5vdGhlciBibG9ja1xuICAgICAgICAgICAgICAgIC8vIHRoZW4gd2Ugc2hvdWxkIHJlbW92ZSB0aGUgb3RoZXIgYmxvY2sgYW5kIHJldHVybiBgZmFsc2VgLlxuICAgICAgICAgICAgICAgIGlmIChoYXNDb21wbGV0ZU92ZXJsYXAoa2V5LCByZXBsYWNlbWVudFBvc2l0aW9uc1trZXldLCBzdGFydCwgZW5kKSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVwbGFjZW1lbnRQb3NpdGlvbnNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlcGxhY2VtZW50c1trZXldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3RzKGtleSwgcmVwbGFjZW1lbnRQb3NpdGlvbnNba2V5XSwgc3RhcnQsIGVuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGFrZXMgYSBzdHJpbmcgb2YgY29kZSBhbmQgd3JhcHMgaXQgaW4gYSBzcGFuIHRhZyBiYXNlZCBvbiB0aGUgbmFtZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAgICAgICAgbmFtZSBvZiB0aGUgcGF0dGVybiAoaWUga2V5d29yZC5yZWdleClcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgIGJsb2NrIG9mIGNvZGUgdG8gd3JhcFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsQ2xhc3MgY2xhc3MgdG8gYXBwbHkgdG8gZXZlcnkgc3BhblxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfd3JhcENvZGVJblNwYW4obmFtZSwgY29kZSkge1xuICAgICAgICAgICAgbGV0IGNsYXNzTmFtZSA9IG5hbWUucmVwbGFjZSgvXFwuL2csICcgJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGdsb2JhbENsYXNzID0gb3B0aW9ucy5nbG9iYWxDbGFzcztcbiAgICAgICAgICAgIGlmIChnbG9iYWxDbGFzcykge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSBgICR7Z2xvYmFsQ2xhc3N9YDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cIiR7Y2xhc3NOYW1lfVwiPiR7Y29kZX08L3NwYW4+YDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzIHJlcGxhY2VtZW50cyBpbiB0aGUgc3RyaW5nIG9mIGNvZGUgdG8gYWN0dWFsbHkgdXBkYXRlXG4gICAgICAgICAqIHRoZSBtYXJrdXBcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICB0aGUgY29kZSB0byBwcm9jZXNzIHJlcGxhY2VtZW50cyBpblxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc1JlcGxhY2VtZW50cyhjb2RlKSB7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBrZXlzKHJlcGxhY2VtZW50cyk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBvc2l0aW9uIG9mIHBvc2l0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnRzW3Bvc2l0aW9uXTtcbiAgICAgICAgICAgICAgICBjb2RlID0gcmVwbGFjZUF0UG9zaXRpb24ocG9zaXRpb24sIHJlcGxhY2VtZW50LnJlcGxhY2UsIHJlcGxhY2VtZW50LndpdGgsIGNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZGU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSXQgaXMgc28gd2UgY2FuIGNyZWF0ZSBhIG5ldyByZWdleCBvYmplY3QgZm9yIGVhY2ggY2FsbCB0b1xuICAgICAgICAgKiBfcHJvY2Vzc1BhdHRlcm4gdG8gYXZvaWQgc3RhdGUgY2Fycnlpbmcgb3ZlciB3aGVuIHJ1bm5pbmcgZXhlY1xuICAgICAgICAgKiBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGdsb2JhbCBmbGFnIHNob3VsZCBub3QgYmUgY2FycmllZCBvdmVyIGJlY2F1c2Ugd2UgYXJlIHNpbXVsYXRpbmdcbiAgICAgICAgICogaXQgYnkgcHJvY2Vzc2luZyB0aGUgcmVnZXggaW4gYSBsb29wIHNvIHdlIG9ubHkgY2FyZSBhYm91dCB0aGUgZmlyc3RcbiAgICAgICAgICogbWF0Y2ggaW4gZWFjaCBzdHJpbmcuIFRoaXMgYWxzbyBzZWVtcyB0byBpbXByb3ZlIHBlcmZvcm1hbmNlIHF1aXRlIGFcbiAgICAgICAgICogYml0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gcmVnZXhcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX2Nsb25lUmVnZXgocmVnZXgpIHtcbiAgICAgICAgICAgIGxldCBmbGFncyA9ICcnO1xuXG4gICAgICAgICAgICBpZiAocmVnZXguaWdub3JlQ2FzZSkge1xuICAgICAgICAgICAgICAgIGZsYWdzICs9ICdpJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZ2V4Lm11bHRpbGluZSkge1xuICAgICAgICAgICAgICAgIGZsYWdzICs9ICdtJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAocmVnZXguc291cmNlLCBmbGFncyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogTWF0Y2hlcyBhIHJlZ2V4IHBhdHRlcm4gYWdhaW5zdCBhIGJsb2NrIG9mIGNvZGUsIGZpbmRzIGFsbCBtYXRjaGVzXG4gICAgICAgICAqIHRoYXQgc2hvdWxkIGJlIHByb2Nlc3NlZCwgYW5kIHN0b3JlcyB0aGUgcG9zaXRpb25zIG9mIHdoZXJlIHRoZXlcbiAgICAgICAgICogc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGhpbiB0aGUgc3RyaW5nLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIGlzIHdoZXJlIHByZXR0eSBtdWNoIGFsbCB0aGUgd29yayBpcyBkb25lIGJ1dCBpdCBzaG91bGQgbm90XG4gICAgICAgICAqIGJlIGNhbGxlZCBkaXJlY3RseS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBhdHRlcm5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgICAgICAgKiBAcmV0dXJuIHttaXhlZH1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCBjb2RlLCBvZmZzZXQgPSAwKSB7XG4gICAgICAgICAgICBsZXQgcmVnZXggPSBwYXR0ZXJuLnBhdHRlcm47XG4gICAgICAgICAgICBpZiAoIXJlZ2V4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTaW5jZSB3ZSBhcmUgc2ltdWxhdGluZyBnbG9iYWwgcmVnZXggbWF0Y2hpbmcgd2UgbmVlZCB0byBhbHNvXG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdG8gc3RvcCBhZnRlciBvbmUgbWF0Y2ggaWYgdGhlIHBhdHRlcm4gaXMgbm90IGdsb2JhbFxuICAgICAgICAgICAgY29uc3Qgc2hvdWxkU3RvcCA9ICFyZWdleC5nbG9iYWw7XG5cbiAgICAgICAgICAgIHJlZ2V4ID0gX2Nsb25lUmVnZXgocmVnZXgpO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleC5leGVjKGNvZGUpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJlYXQgbWF0Y2ggMCB0aGUgc2FtZSB3YXkgYXMgbmFtZVxuICAgICAgICAgICAgaWYgKCFwYXR0ZXJuLm5hbWUgJiYgcGF0dGVybi5tYXRjaGVzICYmIHR5cGVvZiBwYXR0ZXJuLm1hdGNoZXNbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcGF0dGVybi5uYW1lID0gcGF0dGVybi5tYXRjaGVzWzBdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXR0ZXJuLm1hdGNoZXNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCByZXBsYWNlbWVudCA9IG1hdGNoWzBdO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRQb3MgPSBtYXRjaC5pbmRleCArIG9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IGVuZFBvcyA9IG1hdGNoWzBdLmxlbmd0aCArIHN0YXJ0UG9zO1xuXG4gICAgICAgICAgICAvLyBJbiBzb21lIGNhc2VzIHdoZW4gdGhlIHJlZ2V4IG1hdGNoZXMgYSBncm91cCBzdWNoIGFzIFxccyogaXQgaXNcbiAgICAgICAgICAgIC8vIHBvc3NpYmxlIGZvciB0aGVyZSB0byBiZSBhIG1hdGNoLCBidXQgaGF2ZSB0aGUgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgICAgIC8vIGVxdWFsIHRoZSBlbmQgcG9zaXRpb24uIEluIHRob3NlIGNhc2VzIHdlIHNob3VsZCBiZSBhYmxlIHRvIHN0b3BcbiAgICAgICAgICAgIC8vIG1hdGNoaW5nLiBPdGhlcndpc2UgdGhpcyBjYW4gbGVhZCB0byBhbiBpbmZpbml0ZSBsb29wLlxuICAgICAgICAgICAgaWYgKHN0YXJ0UG9zID09PSBlbmRQb3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IGEgY2hpbGQgbWF0Y2ggYW5kIGl0IGZhbGxzIGluc2lkZSBvZiBhbm90aGVyXG4gICAgICAgICAgICAvLyBtYXRjaCB0aGF0IGFscmVhZHkgaGFwcGVuZWQgd2Ugc2hvdWxkIHNraXAgaXQgYW5kIGNvbnRpbnVlXG4gICAgICAgICAgICAvLyBwcm9jZXNzaW5nLlxuICAgICAgICAgICAgaWYgKF9tYXRjaElzSW5zaWRlT3RoZXJNYXRjaChzdGFydFBvcywgZW5kUG9zKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZzogY29kZS5zdWJzdHIoZW5kUG9zIC0gb2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBlbmRQb3NcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGxiYWNrIGZvciB3aGVuIGEgbWF0Y2ggd2FzIHN1Y2Nlc3NmdWxseSBwcm9jZXNzZWRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwbFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gb25NYXRjaFN1Y2Nlc3MocmVwbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBtYXRjaCBoYXMgYSBuYW1lIHRoZW4gd3JhcCBpdCBpbiBhIHNwYW4gdGFnXG4gICAgICAgICAgICAgICAgaWYgKHBhdHRlcm4ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXBsID0gX3dyYXBDb2RlSW5TcGFuKHBhdHRlcm4ubmFtZSwgcmVwbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIGRlYnVnZ2luZ1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdSZXBsYWNlICcgKyBtYXRjaFswXSArICcgd2l0aCAnICsgcmVwbGFjZW1lbnQgKyAnIGF0IHBvc2l0aW9uICcgKyBzdGFydFBvcyArICcgdG8gJyArIGVuZFBvcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBTdG9yZSB3aGF0IG5lZWRzIHRvIGJlIHJlcGxhY2VkIHdpdGggd2hhdCBhdCB0aGlzIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRzW3N0YXJ0UG9zXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3JlcGxhY2UnOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICAgICAgJ3dpdGgnOiByZXBsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSByYW5nZSBvZiB0aGlzIG1hdGNoIHNvIHdlIGNhbiB1c2UgaXQgZm9yXG4gICAgICAgICAgICAgICAgLy8gY29tcGFyaXNvbnMgd2l0aCBvdGhlciBtYXRjaGVzIGxhdGVyLlxuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50UG9zaXRpb25zW3N0YXJ0UG9zXSA9IGVuZFBvcztcblxuICAgICAgICAgICAgICAgIGlmIChzaG91bGRTdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmc6IGNvZGUuc3Vic3RyKGVuZFBvcyAtIG9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogZW5kUG9zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHByb2Nlc3NpbmcgYSBzdWIgZ3JvdXBcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBLZXkgICAgICBpbmRleCBvZiBncm91cFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NHcm91cChncm91cEtleSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrID0gbWF0Y2hbZ3JvdXBLZXldO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gbWF0Y2ggaGVyZSB0aGVuIG1vdmUgb25cbiAgICAgICAgICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBncm91cCA9IHBhdHRlcm4ubWF0Y2hlc1tncm91cEtleV07XG4gICAgICAgICAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBncm91cC5sYW5ndWFnZTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFByb2Nlc3MgZ3JvdXAgaXMgd2hhdCBncm91cCB3ZSBzaG91bGQgdXNlIHRvIGFjdHVhbGx5IHByb2Nlc3NcbiAgICAgICAgICAgICAgICAgKiB0aGlzIG1hdGNoIGdyb3VwLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogRm9yIGV4YW1wbGUgaWYgdGhlIHN1Ymdyb3VwIHBhdHRlcm4gbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogMjoge1xuICAgICAgICAgICAgICAgICAqICAgICAnbmFtZSc6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgICAgICAgKiAgICAgJ3BhdHRlcm4nOiAvdHJ1ZS9nXG4gICAgICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogdGhlbiB3ZSB1c2UgdGhhdCBhcyBpcywgYnV0IGlmIGl0IGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIDI6IHtcbiAgICAgICAgICAgICAgICAgKiAgICAgJ25hbWUnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICogICAgICdtYXRjaGVzJzoge1xuICAgICAgICAgICAgICAgICAqICAgICAgICAgICduYW1lJzogJ3NwZWNpYWwnLFxuICAgICAgICAgICAgICAgICAqICAgICAgICAgICdwYXR0ZXJuJzogL3doYXRldmVyL2dcbiAgICAgICAgICAgICAgICAgKiAgICAgIH1cbiAgICAgICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiB3ZSB0cmVhdCB0aGUgJ21hdGNoZXMnIHBhcnQgYXMgdGhlIHBhdHRlcm4gYW5kIGtlZXBcbiAgICAgICAgICAgICAgICAgKiB0aGUgbmFtZSBhcm91bmQgdG8gd3JhcCBpdCB3aXRoIGxhdGVyXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBUb1Byb2Nlc3MgPSBncm91cC5uYW1lICYmIGdyb3VwLm1hdGNoZXMgPyBncm91cC5tYXRjaGVzIDogZ3JvdXA7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUYWtlcyB0aGUgY29kZSBibG9jayBtYXRjaGVkIGF0IHRoaXMgZ3JvdXAsIHJlcGxhY2VzIGl0XG4gICAgICAgICAgICAgICAgICogd2l0aCB0aGUgaGlnaGxpZ2h0ZWQgYmxvY2ssIGFuZCBvcHRpb25hbGx5IHdyYXBzIGl0IHdpdGhcbiAgICAgICAgICAgICAgICAgKiBhIHNwYW4gd2l0aCBhIG5hbWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzZWRCbG9ja1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBsYWNlQmxvY2tcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBtYXRjaE5hbWVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBjb25zdCBfZ2V0UmVwbGFjZW1lbnQgPSBmdW5jdGlvbihwYXNzZWRCbG9jaywgcmVwbGFjZUJsb2NrLCBtYXRjaE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlQXRQb3NpdGlvbihpbmRleE9mR3JvdXAobWF0Y2gsIGdyb3VwS2V5KSwgcGFzc2VkQmxvY2ssIG1hdGNoTmFtZSA/IF93cmFwQ29kZUluU3BhbihtYXRjaE5hbWUsIHJlcGxhY2VCbG9jaykgOiByZXBsYWNlQmxvY2ssIHJlcGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgc3RyaW5nIHRoZW4gdGhpcyBtYXRjaCBpcyBkaXJlY3RseSBtYXBwZWRcbiAgICAgICAgICAgICAgICAvLyB0byBzZWxlY3RvciBzbyBhbGwgd2UgaGF2ZSB0byBkbyBpcyB3cmFwIGl0IGluIGEgc3BhblxuICAgICAgICAgICAgICAgIC8vIGFuZCBjb250aW51ZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdyb3VwID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGJsb2NrLCBncm91cCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgbG9jYWxDb2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHN1Ymxhbmd1YWdlIGdvIGFuZCBwcm9jZXNzIHRoZSBibG9jayB1c2luZ1xuICAgICAgICAgICAgICAgIC8vIHRoYXQgbGFuZ3VhZ2VcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDb2RlID0gcHJpc20ucmVmcmFjdChibG9jaywgbGFuZ3VhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGxvY2FsQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcHJvY2VzcyBncm91cCBjYW4gYmUgYSBzaW5nbGUgcGF0dGVybiBvciBhbiBhcnJheSBvZlxuICAgICAgICAgICAgICAgIC8vIHBhdHRlcm5zLiBgX3Byb2Nlc3NDb2RlV2l0aFBhdHRlcm5zYCBhbHdheXMgZXhwZWN0cyBhbiBhcnJheVxuICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNvbnZlcnQgaXQgaGVyZS5cbiAgICAgICAgICAgICAgICBsb2NhbENvZGUgPSBwcmlzbS5yZWZyYWN0KGJsb2NrLCBjdXJyZW50TGFuZ3VhZ2UsIGdyb3VwVG9Qcm9jZXNzLmxlbmd0aCA/IGdyb3VwVG9Qcm9jZXNzIDogW2dyb3VwVG9Qcm9jZXNzXSk7XG4gICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBsb2NhbENvZGUsIGdyb3VwLm1hdGNoZXMgPyBncm91cC5uYW1lIDogMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgcGF0dGVybiBoYXMgc3ViIG1hdGNoZXMgZm9yIGRpZmZlcmVudCBncm91cHMgaW4gdGhlIHJlZ2V4XG4gICAgICAgICAgICAvLyB0aGVuIHdlIHNob3VsZCBwcm9jZXNzIHRoZW0gb25lIGF0IGEgdGltZSBieSBydW5uaW5nIHRoZW0gdGhyb3VnaFxuICAgICAgICAgICAgLy8gdGhlIF9wcm9jZXNzR3JvdXAgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgdGhlIG5ldyByZXBsYWNlbWVudC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXZSB1c2UgdGhlIGBrZXlzYCBmdW5jdGlvbiB0byBydW4gdGhyb3VnaCB0aGVtIGJhY2t3YXJkcyBiZWNhdXNlXG4gICAgICAgICAgICAvLyB0aGUgbWF0Y2ggcG9zaXRpb24gb2YgZWFybGllciBtYXRjaGVzIHdpbGwgbm90IGNoYW5nZSBkZXBlbmRpbmdcbiAgICAgICAgICAgIC8vIG9uIHdoYXQgZ2V0cyByZXBsYWNlZCBpbiBsYXRlciBtYXRjaGVzLlxuICAgICAgICAgICAgY29uc3QgZ3JvdXBLZXlzID0ga2V5cyhwYXR0ZXJuLm1hdGNoZXMpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBncm91cEtleSBvZiBncm91cEtleXMpIHtcbiAgICAgICAgICAgICAgICBfcHJvY2Vzc0dyb3VwKGdyb3VwS2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluYWxseSwgY2FsbCBgb25NYXRjaFN1Y2Nlc3NgIHdpdGggdGhlIHJlcGxhY2VtZW50XG4gICAgICAgICAgICByZXR1cm4gb25NYXRjaFN1Y2Nlc3MocmVwbGFjZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb2Nlc3NlcyBhIGJsb2NrIG9mIGNvZGUgdXNpbmcgc3BlY2lmaWVkIHBhdHRlcm5zXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhdHRlcm5zXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzQ29kZVdpdGhQYXR0ZXJucyhjb2RlLCBwYXR0ZXJucykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCBjb2RlKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCByZXN1bHQucmVtYWluaW5nLCByZXN1bHQub2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdlIGFyZSBkb25lIHByb2Nlc3NpbmcgdGhlIHBhdHRlcm5zIHNvIHdlIHNob3VsZCBhY3R1YWxseSByZXBsYWNlXG4gICAgICAgICAgICAvLyB3aGF0IG5lZWRzIHRvIGJlIHJlcGxhY2VkIGluIHRoZSBjb2RlLlxuICAgICAgICAgICAgcmV0dXJuIF9wcm9jZXNzUmVwbGFjZW1lbnRzKGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgYSBsaXN0IG9mIHJlZ2V4IHBhdHRlcm5zIGZvciB0aGlzIGxhbmd1YWdlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldFBhdHRlcm5zRm9yTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIGxldCBwYXR0ZXJucyA9IG9wdGlvbnMucGF0dGVybnNbbGFuZ3VhZ2VdIHx8IFtdO1xuICAgICAgICAgICAgd2hpbGUgKG9wdGlvbnMuaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdKSB7XG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2UgPSBvcHRpb25zLmluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXTtcbiAgICAgICAgICAgICAgICBwYXR0ZXJucyA9IHBhdHRlcm5zLmNvbmNhdChvcHRpb25zLnBhdHRlcm5zW2xhbmd1YWdlXSB8fCBbXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwYXR0ZXJucztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYWtlcyBhIHN0cmluZyBvZiBjb2RlIGFuZCBoaWdobGlnaHRzIGl0IGFjY29yZGluZyB0byB0aGUgbGFuZ3VhZ2VcbiAgICAgICAgICogc3BlY2lmaWVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGF0dGVybnMgb3B0aW9uYWxseSBzcGVjaWZ5IGEgbGlzdCBvZiBwYXR0ZXJuc1xuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfaGlnaGxpZ2h0QmxvY2tGb3JMYW5ndWFnZShjb2RlLCBsYW5ndWFnZSwgcGF0dGVybnMpIHtcbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9IGxhbmd1YWdlO1xuICAgICAgICAgICAgcGF0dGVybnMgPSBwYXR0ZXJucyB8fCBnZXRQYXR0ZXJuc0Zvckxhbmd1YWdlKGxhbmd1YWdlKTtcbiAgICAgICAgICAgIHJldHVybiBfcHJvY2Vzc0NvZGVXaXRoUGF0dGVybnMoaHRtbEVudGl0aWVzKGNvZGUpLCBwYXR0ZXJucyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZnJhY3QgPSBfaGlnaGxpZ2h0QmxvY2tGb3JMYW5ndWFnZTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFByaXNtO1xuIiwiaW1wb3J0IFByaXNtIGZyb20gJy4vcHJpc20nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByYWluYm93V29ya2VyKGUpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgY29uc3QgcHJpc20gPSBuZXcgUHJpc20obWVzc2FnZS5vcHRpb25zKTtcbiAgICBjb25zdCByZXN1bHQgPSBwcmlzbS5yZWZyYWN0KG1lc3NhZ2UuY29kZSwgbWVzc2FnZS5sYW5nKTtcblxuICAgIGZ1bmN0aW9uIF9yZXBseSgpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBpZDogbWVzc2FnZS5pZCxcbiAgICAgICAgICAgIGxhbmc6IG1lc3NhZ2UubGFuZyxcbiAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBJIHJlYWxpemVkIGRvd24gdGhlIHJvYWQgSSBtaWdodCBsb29rIGF0IHRoaXMgYW5kIHdvbmRlciB3aGF0IGlzIGdvaW5nIG9uXG4gICAgLy8gc28gcHJvYmFibHkgaXQgaXMgbm90IGEgYmFkIGlkZWEgdG8gbGVhdmUgYSBjb21tZW50LlxuICAgIC8vXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSByaWdodCBub3cgdGhlIG5vZGUgbGlicmFyeSBmb3Igc2ltdWxhdGluZyB3ZWJcbiAgICAvLyB3b3JrZXJzIOKAnHdlYndvcmtlci10aHJlYWRz4oCdIHdpbGwga2VlcCB0aGUgd29ya2VyIG9wZW4gYW5kIGl0IGNhdXNlc1xuICAgIC8vIHNjcmlwdHMgcnVubmluZyBmcm9tIHRoZSBjb21tYW5kIGxpbmUgdG8gaGFuZyB1bmxlc3MgdGhlIHdvcmtlciBpc1xuICAgIC8vIGV4cGxpY2l0bHkgY2xvc2VkLlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBmb3Igbm9kZSB3ZSB3aWxsIHNwYXduIGEgbmV3IHRocmVhZCBmb3IgZXZlcnkgYXN5bmNocm9ub3VzXG4gICAgLy8gYmxvY2sgd2UgYXJlIGhpZ2hsaWdodGluZywgYnV0IGluIHRoZSBicm93c2VyIHdlIHdpbGwga2VlcCBhIHNpbmdsZVxuICAgIC8vIHdvcmtlciBvcGVuIGZvciBhbGwgcmVxdWVzdHMuXG4gICAgaWYgKG1lc3NhZ2UuaXNOb2RlKSB7XG4gICAgICAgIF9yZXBseSgpO1xuICAgICAgICBzZWxmLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgX3JlcGx5KCk7XG4gICAgfSwgbWVzc2FnZS5vcHRpb25zLmRlbGF5ICogMTAwMCk7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgQ3JhaWcgQ2FtcGJlbGxcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKiBSYWluYm93IGlzIGEgc2ltcGxlIGNvZGUgc3ludGF4IGhpZ2hsaWdodGVyXG4gKlxuICogQHNlZSByYWluYm93Y28uZGVcbiAqL1xuaW1wb3J0IFByaXNtIGZyb20gJy4vcHJpc20nO1xuaW1wb3J0IHsgaXNOb2RlIGFzIHV0aWxJc05vZGUsIGlzV29ya2VyIGFzIHV0aWxJc1dvcmtlciwgY3JlYXRlV29ya2VyLCBnZXRMYW5ndWFnZUZvckJsb2NrIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCByYWluYm93V29ya2VyIGZyb20gJy4vd29ya2VyJztcblxuLyoqXG4gKiBBbiBhcnJheSBvZiB0aGUgbGFuZ3VhZ2UgcGF0dGVybnMgc3BlY2lmaWVkIGZvciBlYWNoIGxhbmd1YWdlXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgcGF0dGVybnMgPSB7fTtcblxuLyoqXG4gKiBBbiBvYmplY3Qgb2YgbGFuZ3VhZ2VzIG1hcHBpbmcgdG8gd2hhdCBsYW5ndWFnZSB0aGV5IHNob3VsZCBpbmhlcml0IGZyb21cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCBpbmhlcml0ZW5jZU1hcCA9IHt9O1xuXG4vKipcbiAqIEEgbWFwcGluZyBvZiBsYW5ndWFnZSBhbGlhc2VzXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgYWxpYXNlcyA9IHt9O1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIHRoZSBhY3R1YWwgcmFpbmJvdyBvYmplY3RcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5sZXQgUmFpbmJvdyA9IHt9O1xuXG4vKipcbiAqIENhbGxiYWNrIHRvIGZpcmUgYWZ0ZXIgZWFjaCBibG9jayBpcyBoaWdobGlnaHRlZFxuICpcbiAqIEB0eXBlIHtudWxsfEZ1bmN0aW9ufVxuICovXG5sZXQgb25IaWdobGlnaHRDYWxsYmFjaztcblxuLyoqXG4gKiBDb3VudGVyIGZvciBibG9jayBpZHNcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NjYW1wYmVsbC9yYWluYm93L2lzc3Vlcy8yMDdcbiAqL1xuIGxldCBpZCA9IDA7XG5cbmNvbnN0IGlzTm9kZSA9IHV0aWxJc05vZGUoKTtcbmNvbnN0IGlzV29ya2VyID0gdXRpbElzV29ya2VyKCk7XG5cbmxldCBjYWNoZWRXb3JrZXIgPSBudWxsO1xuZnVuY3Rpb24gX2dldFdvcmtlcigpIHtcbiAgICBpZiAoaXNOb2RlIHx8IGNhY2hlZFdvcmtlciA9PT0gbnVsbCkge1xuICAgICAgICBjYWNoZWRXb3JrZXIgPSBjcmVhdGVXb3JrZXIocmFpbmJvd1dvcmtlciwgUHJpc20pO1xuICAgIH1cblxuICAgIHJldHVybiBjYWNoZWRXb3JrZXI7XG59XG5cbi8qKlxuICogSGVscGVyIGZvciBtYXRjaGluZyB1cCBjYWxsYmFja3MgZGlyZWN0bHkgd2l0aCB0aGVcbiAqIHBvc3QgbWVzc2FnZSByZXF1ZXN0cyB0byBhIHdlYiB3b3JrZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG1lc3NhZ2UgICAgICBkYXRhIHRvIHNlbmQgdG8gd2ViIHdvcmtlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgICBjYWxsYmFjayBmdW5jdGlvbiBmb3Igd29ya2VyIHRvIHJlcGx5IHRvXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfbWVzc2FnZVdvcmtlcihtZXNzYWdlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHdvcmtlciA9IF9nZXRXb3JrZXIoKTtcblxuICAgIGZ1bmN0aW9uIF9saXN0ZW4oZSkge1xuICAgICAgICBpZiAoZS5kYXRhLmlkID09PSBtZXNzYWdlLmlkKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlLmRhdGEpO1xuICAgICAgICAgICAgd29ya2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBfbGlzdGVuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgX2xpc3Rlbik7XG4gICAgd29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEhhbmRsZXMgcmVzcG9uc2UgZnJvbSB3ZWIgd29ya2VyLCB1cGRhdGVzIERPTSB3aXRoXG4gKiByZXN1bHRpbmcgY29kZSwgYW5kIGZpcmVzIGNhbGxiYWNrXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gd2FpdGluZ09uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX2dlbmVyYXRlSGFuZGxlcihlbGVtZW50LCB3YWl0aW5nT24sIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIF9oYW5kbGVSZXNwb25zZUZyb21Xb3JrZXIoZGF0YSkge1xuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGRhdGEucmVzdWx0O1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcblxuICAgICAgICBpZiAoZWxlbWVudC5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdQUkUnKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCAoZSkgPT4ge1xuICAgICAgICAvLyAgICAgaWYgKGUuYW5pbWF0aW9uTmFtZSA9PT0gJ2ZhZGUtaW4nKSB7XG4gICAgICAgIC8vICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZGVjcmVhc2UtZGVsYXknKTtcbiAgICAgICAgLy8gICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgaWYgKG9uSGlnaGxpZ2h0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIG9uSGlnaGxpZ2h0Q2FsbGJhY2soZWxlbWVudCwgZGF0YS5sYW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgtLXdhaXRpbmdPbi5jID09PSAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIG9wdGlvbnMgbmVlZGVkIHRvIHBhc3MgaW50byBQcmlzbVxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIF9nZXRQcmlzbU9wdGlvbnMob3B0aW9ucykge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBhdHRlcm5zLFxuICAgICAgICBpbmhlcml0ZW5jZU1hcCxcbiAgICAgICAgYWxpYXNlcyxcbiAgICAgICAgZ2xvYmFsQ2xhc3M6IG9wdGlvbnMuZ2xvYmFsQ2xhc3MsXG4gICAgICAgIGRlbGF5OiAhaXNOYU4ob3B0aW9ucy5kZWxheSkgPyBvcHRpb25zLmRlbGF5IDogMFxuICAgIH07XG59XG5cbi8qKlxuICogR2V0cyBkYXRhIHRvIHNlbmQgdG8gd2Vid29ya2VyXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGxhbmdcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gX2dldFdvcmtlckRhdGEoY29kZSwgbGFuZykge1xuICAgIGxldCBvcHRpb25zID0ge307XG4gICAgaWYgKHR5cGVvZiBsYW5nID09PSAnb2JqZWN0Jykge1xuICAgICAgICBvcHRpb25zID0gbGFuZztcbiAgICAgICAgbGFuZyA9IG9wdGlvbnMubGFuZ3VhZ2U7XG4gICAgfVxuXG4gICAgbGFuZyA9IGFsaWFzZXNbbGFuZ10gfHwgbGFuZztcblxuICAgIGNvbnN0IHdvcmtlckRhdGEgPSB7XG4gICAgICAgIGlkOiBpZCsrLFxuICAgICAgICBjb2RlLFxuICAgICAgICBsYW5nLFxuICAgICAgICBvcHRpb25zOiBfZ2V0UHJpc21PcHRpb25zKG9wdGlvbnMpLFxuICAgICAgICBpc05vZGVcbiAgICB9O1xuXG4gICAgcmV0dXJuIHdvcmtlckRhdGE7XG59XG5cbi8qKlxuICogQnJvd3NlciBPbmx5IC0gU2VuZHMgbWVzc2FnZXMgdG8gd2ViIHdvcmtlciB0byBoaWdobGlnaHQgZWxlbWVudHMgcGFzc2VkXG4gKiBpblxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGNvZGVCbG9ja3NcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfaGlnaGxpZ2h0Q29kZUJsb2Nrcyhjb2RlQmxvY2tzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHdhaXRpbmdPbiA9IHsgYzogMCB9O1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgY29kZUJsb2Nrcykge1xuICAgICAgICBjb25zdCBsYW5ndWFnZSA9IGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spO1xuICAgICAgICBpZiAoYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdyYWluYm93JykgfHwgIWxhbmd1YWdlKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoaXMgY2FuY2VscyB0aGUgcGVuZGluZyBhbmltYXRpb24gdG8gZmFkZSB0aGUgY29kZSBpbiBvbiBsb2FkXG4gICAgICAgIC8vIHNpbmNlIHdlIHdhbnQgdG8gZGVsYXkgZG9pbmcgdGhpcyB1bnRpbCBpdCBpcyBhY3R1YWxseVxuICAgICAgICAvLyBoaWdobGlnaHRlZFxuICAgICAgICBibG9jay5jbGFzc0xpc3QuYWRkKCdsb2FkaW5nJyk7XG4gICAgICAgIGJsb2NrLmNsYXNzTGlzdC5hZGQoJ3JhaW5ib3cnKTtcblxuICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0byBhbHNvIGFkZCB0aGUgbG9hZGluZyBjbGFzcyB0byB0aGUgcHJlIHRhZ1xuICAgICAgICAvLyBiZWNhdXNlIHRoYXQgaXMgaG93IHdlIHdpbGwga25vdyB0byBzaG93IGEgcHJlbG9hZGVyXG4gICAgICAgIGlmIChibG9jay5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdQUkUnKSB7XG4gICAgICAgICAgICBibG9jay5wYXJlbnROb2RlLmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdsb2JhbENsYXNzID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWdsb2JhbC1jbGFzcycpO1xuICAgICAgICBjb25zdCBkZWxheSA9IHBhcnNlSW50KGJsb2NrLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWxheScpLCAxMCk7XG5cbiAgICAgICAgKyt3YWl0aW5nT24uYztcbiAgICAgICAgX21lc3NhZ2VXb3JrZXIoX2dldFdvcmtlckRhdGEoYmxvY2suaW5uZXJIVE1MLCB7IGxhbmd1YWdlLCBnbG9iYWxDbGFzcywgZGVsYXkgfSksIF9nZW5lcmF0ZUhhbmRsZXIoYmxvY2ssIHdhaXRpbmdPbiwgY2FsbGJhY2spKTtcbiAgICB9XG5cbiAgICBpZiAod2FpdGluZ09uLmMgPT09IDApIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9hZGRQcmVsb2FkZXIocHJlQmxvY2spIHtcbiAgICBjb25zdCBwcmVsb2FkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwcmVsb2FkZXIuY2xhc3NOYW1lID0gJ3ByZWxvYWRlcic7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgcHJlbG9hZGVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTtcbiAgICB9XG4gICAgcHJlQmxvY2suYXBwZW5kQ2hpbGQocHJlbG9hZGVyKTtcbn1cblxuLyoqXG4gKiBCcm93c2VyIE9ubHkgLSBTdGFydCBoaWdobGlnaHRpbmcgYWxsIHRoZSBjb2RlIGJsb2Nrc1xuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gbm9kZSAgICAgICBIVE1MRWxlbWVudCB0byBzZWFyY2ggd2l0aGluXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX2hpZ2hsaWdodChub2RlLCBjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24oKSB7fTtcblxuICAgIC8vIFRoZSBmaXJzdCBhcmd1bWVudCBjYW4gYmUgYW4gRXZlbnQgb3IgYSBET00gRWxlbWVudC5cbiAgICAvL1xuICAgIC8vIEkgd2FzIG9yaWdpbmFsbHkgY2hlY2tpbmcgaW5zdGFuY2VvZiBFdmVudCBidXQgdGhhdCBtYWRlIGl0IGJyZWFrXG4gICAgLy8gd2hlbiB1c2luZyBtb290b29scy5cbiAgICAvL1xuICAgIC8vIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NjYW1wYmVsbC9yYWluYm93L2lzc3Vlcy8zMlxuICAgIG5vZGUgPSBub2RlICYmIHR5cGVvZiBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lID09PSAnZnVuY3Rpb24nID8gbm9kZSA6IGRvY3VtZW50O1xuXG4gICAgY29uc3QgcHJlQmxvY2tzID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJyk7XG4gICAgY29uc3QgY29kZUJsb2NrcyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKTtcbiAgICBjb25zdCBmaW5hbFByZUJsb2NrcyA9IFtdO1xuICAgIGNvbnN0IGZpbmFsQ29kZUJsb2NrcyA9IFtdO1xuXG4gICAgLy8gRmlyc3QgbG9vcCB0aHJvdWdoIGFsbCBwcmUgYmxvY2tzIHRvIGZpbmQgd2hpY2ggb25lcyB0byBoaWdobGlnaHRcbiAgICBmb3IgKGNvbnN0IHByZUJsb2NrIG9mIHByZUJsb2Nrcykge1xuICAgICAgICBfYWRkUHJlbG9hZGVyKHByZUJsb2NrKTtcblxuICAgICAgICAvLyBTdHJpcCB3aGl0ZXNwYWNlIGFyb3VuZCBjb2RlIHRhZ3Mgd2hlbiB0aGV5IGFyZSBpbnNpZGUgb2YgYSBwcmVcbiAgICAgICAgLy8gdGFnLiAgVGhpcyBtYWtlcyB0aGUgdGhlbWVzIGxvb2sgYmV0dGVyIGJlY2F1c2UgeW91IGNhbid0XG4gICAgICAgIC8vIGFjY2lkZW50YWxseSBhZGQgZXh0cmEgbGluZWJyZWFrcyBhdCB0aGUgc3RhcnQgYW5kIGVuZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2hlbiB0aGUgcHJlIHRhZyBjb250YWlucyBhIGNvZGUgdGFnIHRoZW4gc3RyaXAgYW55IGV4dHJhXG4gICAgICAgIC8vIHdoaXRlc3BhY2UuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEZvciBleGFtcGxlOlxuICAgICAgICAvL1xuICAgICAgICAvLyA8cHJlPlxuICAgICAgICAvLyAgICAgIDxjb2RlPnZhciBmb28gPSB0cnVlOzwvY29kZT5cbiAgICAgICAgLy8gPC9wcmU+XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHdpbGwgYmVjb21lOlxuICAgICAgICAvL1xuICAgICAgICAvLyA8cHJlPjxjb2RlPnZhciBmb28gPSB0cnVlOzwvY29kZT48L3ByZT5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgeW91IHdhbnQgdG8gcHJlc2VydmUgd2hpdGVzcGFjZSB5b3UgY2FuIHVzZSBhIHByZSB0YWcgb25cbiAgICAgICAgLy8gaXRzIG93biB3aXRob3V0IGEgY29kZSB0YWcgaW5zaWRlIG9mIGl0LlxuICAgICAgICBpZiAocHJlQmxvY2suZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKS5sZW5ndGgpIHtcblxuICAgICAgICAgICAgLy8gVGhpcyBmaXhlcyBhIHJhY2UgY29uZGl0aW9uIHdoZW4gUmFpbmJvdy5jb2xvciBpcyBjYWxsZWQgYmVmb3JlXG4gICAgICAgICAgICAvLyB0aGUgcHJldmlvdXMgY29sb3IgY2FsbCBoYXMgZmluaXNoZWQuXG4gICAgICAgICAgICBpZiAoIXByZUJsb2NrLmdldEF0dHJpYnV0ZSgnZGF0YS10cmltbWVkJykpIHtcbiAgICAgICAgICAgICAgICBwcmVCbG9jay5zZXRBdHRyaWJ1dGUoJ2RhdGEtdHJpbW1lZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgIHByZUJsb2NrLmlubmVySFRNTCA9IHByZUJsb2NrLmlubmVySFRNTC50cmltKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBwcmUgYmxvY2sgaGFzIG5vIGNvZGUgYmxvY2tzIHRoZW4gd2UgYXJlIGdvaW5nIHRvIHdhbnQgdG9cbiAgICAgICAgLy8gcHJvY2VzcyBpdCBkaXJlY3RseS5cbiAgICAgICAgZmluYWxQcmVCbG9ja3MucHVzaChwcmVCbG9jayk7XG4gICAgfVxuXG4gICAgLy8gQHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI3MzUwNjcvaG93LXRvLWNvbnZlcnQtYS1kb20tbm9kZS1saXN0LXRvLWFuLWFycmF5LWluLWphdmFzY3JpcHRcbiAgICAvLyBXZSBhcmUgZ29pbmcgdG8gcHJvY2VzcyBhbGwgPGNvZGU+IGJsb2Nrc1xuICAgIGZvciAoY29uc3QgY29kZUJsb2NrIG9mIGNvZGVCbG9ja3MpIHtcbiAgICAgICAgZmluYWxDb2RlQmxvY2tzLnB1c2goY29kZUJsb2NrKTtcbiAgICB9XG5cbiAgICBfaGlnaGxpZ2h0Q29kZUJsb2NrcyhmaW5hbENvZGVCbG9ja3MuY29uY2F0KGZpbmFsUHJlQmxvY2tzKSwgY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIHRvIGxldCB5b3UgZG8gc3R1ZmYgaW4geW91ciBhcHAgYWZ0ZXIgYSBwaWVjZSBvZiBjb2RlIGhhc1xuICogYmVlbiBoaWdobGlnaHRlZFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBvbkhpZ2hsaWdodChjYWxsYmFjaykge1xuICAgIG9uSGlnaGxpZ2h0Q2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuLyoqXG4gKiBFeHRlbmRzIHRoZSBsYW5ndWFnZSBwYXR0ZXJuIG1hdGNoZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgICAgICAgICAgICBuYW1lIG9mIGxhbmd1YWdlXG4gKiBAcGFyYW0ge29iamVjdH0gbGFuZ3VhZ2VQYXR0ZXJucyAgICBvYmplY3Qgb2YgcGF0dGVybnMgdG8gYWRkIG9uXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGluaGVyaXRzICBvcHRpb25hbCBsYW5ndWFnZSB0aGF0IHRoaXMgbGFuZ3VhZ2VcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBpbmhlcml0IHJ1bGVzIGZyb21cbiAqL1xuZnVuY3Rpb24gZXh0ZW5kKGxhbmd1YWdlLCBsYW5ndWFnZVBhdHRlcm5zLCBpbmhlcml0cykge1xuXG4gICAgLy8gSWYgd2UgZXh0ZW5kIGEgbGFuZ3VhZ2UgYWdhaW4gd2Ugc2hvdWxkbid0IG5lZWQgdG8gc3BlY2lmeSB0aGVcbiAgICAvLyBpbmhlcml0ZW5jZSBmb3IgaXQuIEZvciBleGFtcGxlLCBpZiB5b3UgYXJlIGFkZGluZyBzcGVjaWFsIGhpZ2hsaWdodGluZ1xuICAgIC8vIGZvciBhIGphdmFzY3JpcHQgZnVuY3Rpb24gdGhhdCBpcyBub3QgaW4gdGhlIGJhc2UgamF2YXNjcmlwdCBydWxlcywgeW91XG4gICAgLy8gc2hvdWxkIGJlIGFibGUgdG8gZG9cbiAgICAvL1xuICAgIC8vIFJhaW5ib3cuZXh0ZW5kKCdqYXZhc2NyaXB0JywgWyDigKYgXSk7XG4gICAgLy9cbiAgICAvLyBXaXRob3V0IHNwZWNpZnlpbmcgYSBsYW5ndWFnZSBpdCBzaG91bGQgaW5oZXJpdCAoZ2VuZXJpYyBpbiB0aGlzIGNhc2UpXG4gICAgaWYgKCFpbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0pIHtcbiAgICAgICAgaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdID0gaW5oZXJpdHM7XG4gICAgfVxuXG4gICAgcGF0dGVybnNbbGFuZ3VhZ2VdID0gbGFuZ3VhZ2VQYXR0ZXJucy5jb25jYXQocGF0dGVybnNbbGFuZ3VhZ2VdIHx8IFtdKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGxhbmd1YWdlKSB7XG4gICAgZGVsZXRlIGluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXTtcbiAgICBkZWxldGUgcGF0dGVybnNbbGFuZ3VhZ2VdO1xufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgbWFnaWMgcmFpbmJvd1xuICpcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGNvbG9yKC4uLmFyZ3MpIHtcblxuICAgIC8vIElmIHlvdSB3YW50IHRvIHN0cmFpZ2h0IHVwIGhpZ2hsaWdodCBhIHN0cmluZyB5b3UgY2FuIHBhc3MgdGhlXG4gICAgLy8gc3RyaW5nIG9mIGNvZGUsIHRoZSBsYW5ndWFnZSwgYW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5jb2xvcihjb2RlLCBsYW5ndWFnZSwgZnVuY3Rpb24oaGlnaGxpZ2h0ZWRDb2RlLCBsYW5ndWFnZSkge1xuICAgIC8vICAgICAvLyB0aGlzIGNvZGUgYmxvY2sgaXMgbm93IGhpZ2hsaWdodGVkXG4gICAgLy8gfSk7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCB3b3JrZXJEYXRhID0gX2dldFdvcmtlckRhdGEoYXJnc1swXSwgYXJnc1sxXSk7XG4gICAgICAgIF9tZXNzYWdlV29ya2VyKHdvcmtlckRhdGEsIChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZGF0YS5yZXN1bHQsIGRhdGEubGFuZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfShhcmdzWzJdKSkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgeW91IHBhc3MgYSBjYWxsYmFjayBmdW5jdGlvbiB0aGVuIHdlIHJlcnVuIHRoZSBjb2xvciBmdW5jdGlvblxuICAgIC8vIG9uIGFsbCB0aGUgY29kZSBhbmQgY2FsbCB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gb24gY29tcGxldGUuXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5jb2xvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coJ0FsbCBtYXRjaGluZyB0YWdzIG9uIHRoZSBwYWdlIGFyZSBub3cgaGlnaGxpZ2h0ZWQnKTtcbiAgICAvLyB9KTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgX2hpZ2hsaWdodCgwLCBhcmdzWzBdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSB3ZSB1c2Ugd2hhdGV2ZXIgbm9kZSB5b3UgcGFzc2VkIGluIHdpdGggYW4gb3B0aW9uYWxcbiAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlci5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyB2YXIgcHJlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICAgIC8vIHZhciBjb2RlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcbiAgICAvLyBjb2RlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnLCAnamF2YXNjcmlwdCcpO1xuICAgIC8vIGNvZGVFbGVtZW50LmlubmVySFRNTCA9ICcvLyBIZXJlIGlzIHNvbWUgSmF2YVNjcmlwdCc7XG4gICAgLy8gcHJlRWxlbWVudC5hcHBlbmRDaGlsZChjb2RlRWxlbWVudCk7XG4gICAgLy8gUmFpbmJvdy5jb2xvcihwcmVFbGVtZW50LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgLy8gTmV3IGVsZW1lbnQgaXMgbm93IGhpZ2hsaWdodGVkXG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBJZiB5b3UgZG9uJ3QgcGFzcyBhbiBlbGVtZW50IGl0IHdpbGwgZGVmYXVsdCB0byBgZG9jdW1lbnRgXG4gICAgX2hpZ2hsaWdodChhcmdzWzBdLCBhcmdzWzFdKTtcbn1cblxuLyoqXG4gKiBNZXRob2QgdG8gYWRkIGFuIGFsaWFzIGZvciBhbiBleGlzdGluZyBsYW5ndWFnZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB5b3Ugd2FudCB0byBoYXZlIFwiY29mZmVlXCIgbWFwIHRvIFwiY29mZmVlc2NyaXB0XCJcbiAqXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jY2FtcGJlbGwvcmFpbmJvdy9pc3N1ZXMvMTU0XG4gKiBAcGFyYW0ge3N0cmluZ30gYWxpYXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbExhbmd1YWdlXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBhZGRBbGlhcyhhbGlhcywgb3JpZ2luYWxMYW5ndWFnZSkge1xuICAgIGFsaWFzZXNbYWxpYXNdID0gb3JpZ2luYWxMYW5ndWFnZTtcbn1cblxuLyoqXG4gKiBwdWJsaWMgbWV0aG9kc1xuICovXG5SYWluYm93ID0ge1xuICAgIGV4dGVuZCxcbiAgICByZW1vdmUsXG4gICAgb25IaWdobGlnaHQsXG4gICAgYWRkQWxpYXMsXG4gICAgY29sb3Jcbn07XG5cbmlmIChpc05vZGUpIHtcbiAgICBSYWluYm93LmNvbG9yU3luYyA9IGZ1bmN0aW9uKGNvZGUsIGxhbmcpIHtcbiAgICAgICAgY29uc3Qgd29ya2VyRGF0YSA9IF9nZXRXb3JrZXJEYXRhKGNvZGUsIGxhbmcpO1xuICAgICAgICBjb25zdCBwcmlzbSA9IG5ldyBQcmlzbSh3b3JrZXJEYXRhLm9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gcHJpc20ucmVmcmFjdCh3b3JrZXJEYXRhLmNvZGUsIHdvcmtlckRhdGEubGFuZyk7XG4gICAgfTtcbn1cblxuLy8gSW4gdGhlIGJyb3dzZXIgaG9vayBpdCB1cCB0byBjb2xvciBvbiBwYWdlIGxvYWRcbmlmICghaXNOb2RlICYmICFpc1dvcmtlcikge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKCFSYWluYm93LmRlZmVyKSB7XG4gICAgICAgICAgICBSYWluYm93LmNvbG9yKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sIGZhbHNlKTtcbn1cblxuLy8gRnJvbSBhIG5vZGUgd29ya2VyLCBoYW5kbGUgdGhlIHBvc3RNZXNzYWdlIHJlcXVlc3RzIHRvIGl0XG5pZiAoaXNXb3JrZXIpIHtcbiAgICBzZWxmLm9ubWVzc2FnZSA9IHJhaW5ib3dXb3JrZXI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJhaW5ib3c7XG4iXSwibmFtZXMiOlsiaXNOb2RlIiwiaXNXb3JrZXIiLCJsZXQiLCJjb25zdCIsInV0aWxJc05vZGUiLCJ1dGlsSXNXb3JrZXIiXSwibWFwcGluZ3MiOiI7Ozs7OztJQUNPLFNBQVNBLFFBQU0sR0FBRzs7UUFFckIsT0FBTyxPQUFPLE1BQU0sS0FB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