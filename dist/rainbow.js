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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3ByaXNtLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9yYWluYm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICAvKiBnbG9iYWxzIG1vZHVsZSAqL1xuICAgIHJldHVybiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXb3JrZXIoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEdldHMgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGJsb2NrIG9mIGNvZGVcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJsb2NrXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spIHtcblxuICAgIC8vIElmIHRoaXMgZG9lc24ndCBoYXZlIGEgbGFuZ3VhZ2UgYnV0IHRoZSBwYXJlbnQgZG9lcyB0aGVuIHVzZSB0aGF0LlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBpZiBmb3IgZXhhbXBsZSB5b3UgaGF2ZTogPHByZSBkYXRhLWxhbmd1YWdlPVwicGhwXCI+XG4gICAgLy8gd2l0aCBhIGJ1bmNoIG9mIDxjb2RlPiBibG9ja3MgaW5zaWRlIHRoZW4geW91IGRvIG5vdCBoYXZlXG4gICAgLy8gdG8gc3BlY2lmeSB0aGUgbGFuZ3VhZ2UgZm9yIGVhY2ggYmxvY2suXG4gICAgbGV0IGxhbmd1YWdlID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJykgfHwgYmxvY2sucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnKTtcblxuICAgIC8vIFRoaXMgYWRkcyBzdXBwb3J0IGZvciBzcGVjaWZ5aW5nIGxhbmd1YWdlIHZpYSBhIENTUyBjbGFzcy5cbiAgICAvL1xuICAgIC8vIFlvdSBjYW4gdXNlIHRoZSBHb29nbGUgQ29kZSBQcmV0dGlmeSBzdHlsZTogPHByZSBjbGFzcz1cImxhbmctcGhwXCI+XG4gICAgLy8gb3IgdGhlIEhUTUw1IHN0eWxlOiA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtcGhwXCI+XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1xcYmxhbmcoPzp1YWdlKT8tKFxcdyspLztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBibG9jay5jbGFzc05hbWUubWF0Y2gocGF0dGVybikgfHwgYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBsYW5ndWFnZSA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGRpZmZlcmVudCBtYXRjaGVzIGhhdmUgY29tcGxldGUgb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXJcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQxICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICBlbmQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDIgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQyICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29tcGxldGVPdmVybGFwKHN0YXJ0MSwgZW5kMSwgc3RhcnQyLCBlbmQyKSB7XG5cbiAgICAvLyBJZiB0aGUgc3RhcnRpbmcgYW5kIGVuZCBwb3NpdGlvbnMgYXJlIGV4YWN0bHkgdGhlIHNhbWVcbiAgICAvLyB0aGVuIHRoZSBmaXJzdCBvbmUgc2hvdWxkIHN0YXkgYW5kIHRoaXMgb25lIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChzdGFydDIgPT09IHN0YXJ0MSAmJiBlbmQyID09PSBlbmQxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQyIDw9IHN0YXJ0MSAmJiBlbmQyID49IGVuZDE7XG59XG5cbi8qKlxuICogRW5jb2RlcyA8IGFuZCA+IGFzIGh0bWwgZW50aXRpZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaHRtbEVudGl0aWVzKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyYoPyFbXFx3XFwjXSs7KS9nLCAnJmFtcDsnKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvdXQgdGhlIHBvc2l0aW9uIG9mIGdyb3VwIG1hdGNoIGZvciBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICpcbiAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTg1NTk0L2hvdy10by1maW5kLWluZGV4LW9mLWdyb3Vwcy1pbi1tYXRjaFxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBOdW1iZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBOdW1iZXIpIHtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cE51bWJlcjsgKytpKSB7XG4gICAgICAgIGlmIChtYXRjaFtpXSkge1xuICAgICAgICAgICAgaW5kZXggKz0gbWF0Y2hbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBuZXcgbWF0Y2ggaW50ZXJzZWN0cyB3aXRoIGFuIGV4aXN0aW5nIG9uZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDEgICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICAgZW5kIHBvc2l0aW9uIG9mIGV4aXN0aW5nIG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQyICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZDIgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhzdGFydDEsIGVuZDEsIHN0YXJ0MiwgZW5kMikge1xuICAgIGlmIChzdGFydDIgPj0gc3RhcnQxICYmIHN0YXJ0MiA8IGVuZDEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuZDIgPiBzdGFydDEgJiYgZW5kMiA8IGVuZDE7XG59XG5cbi8qKlxuICogU29ydHMgYW4gb2JqZWN0cyBrZXlzIGJ5IGluZGV4IGRlc2NlbmRpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgbG9jYXRpb25zLnB1c2gobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbnVtZXJpYyBkZXNjZW5kaW5nXG4gICAgcmV0dXJuIGxvY2F0aW9ucy5zb3J0KChhLCBiKSA9PiBiIC0gYSk7XG59XG5cbi8qKlxuICogU3Vic3RyaW5nIHJlcGxhY2UgY2FsbCB0byByZXBsYWNlIHBhcnQgb2YgYSBzdHJpbmcgYXQgYSBjZXJ0YWluIHBvc2l0aW9uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uICAgICAgICAgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGhhcHBlblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2UgICAgICAgICAgdGhlIHRleHQgd2Ugd2FudCB0byByZXBsYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZVdpdGggICAgICB0aGUgdGV4dCB3ZSB3YW50IHRvIHJlcGxhY2UgaXQgd2l0aFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICAgICAgdGhlIGNvZGUgd2UgYXJlIGRvaW5nIHRoZSByZXBsYWNpbmcgaW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlLCByZXBsYWNlV2l0aCwgY29kZSkge1xuICAgIGNvbnN0IHN1YlN0cmluZyA9IGNvZGUuc3Vic3RyKHBvc2l0aW9uKTtcbiAgICByZXR1cm4gY29kZS5zdWJzdHIoMCwgcG9zaXRpb24pICsgc3ViU3RyaW5nLnJlcGxhY2UocmVwbGFjZSwgcmVwbGFjZVdpdGgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB1c2FibGUgd2ViIHdvcmtlciBmcm9tIGFuIGFub255bW91cyBmdW5jdGlvblxuICpcbiAqIG1vc3RseSBib3Jyb3dlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS96ZXZlcm8vd29ya2VyLWNyZWF0ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1ByaXNtfSBQcmlzbVxuICogQHJldHVybiB7V29ya2VyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV29ya2VyKGZuLCBQcmlzbSkge1xuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgICAvKiBnbG9iYWxzIGdsb2JhbCwgcmVxdWlyZSwgX19maWxlbmFtZSAqL1xuICAgICAgICBnbG9iYWwuV29ya2VyID0gcmVxdWlyZSgnd2Vid29ya2VyLXRocmVhZHMnKS5Xb3JrZXI7XG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKF9fZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHByaXNtRnVuY3Rpb24gPSBQcmlzbS50b1N0cmluZygpO1xuXG4gICAgbGV0IGNvZGUgPSBrZXlzLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBodG1sRW50aXRpZXMudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGhhc0NvbXBsZXRlT3ZlcmxhcC50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gaW50ZXJzZWN0cy50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gcmVwbGFjZUF0UG9zaXRpb24udG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGluZGV4T2ZHcm91cC50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gcHJpc21GdW5jdGlvbjtcblxuICAgIGNvbnN0IGZ1bGxTdHJpbmcgPSBgJHtjb2RlfVxcdHRoaXMub25tZXNzYWdlPSR7Zm4udG9TdHJpbmcoKX1gO1xuXG4gICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtmdWxsU3RyaW5nXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KTtcbiAgICByZXR1cm4gbmV3IFdvcmtlcigod2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMKS5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xufVxuIiwiaW1wb3J0IHsgcmVwbGFjZUF0UG9zaXRpb24sIGluZGV4T2ZHcm91cCwga2V5cywgaHRtbEVudGl0aWVzLCBoYXNDb21wbGV0ZU92ZXJsYXAsIGludGVyc2VjdHMgfSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIFByaXNtIGlzIGEgY2xhc3MgdXNlZCB0byBoaWdobGlnaHQgaW5kaXZpZHVhbCBibG9ja3Mgb2YgY29kZVxuICpcbiAqIEBjbGFzc1xuICovXG5jbGFzcyBQcmlzbSB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICAvKipcbiAgICAgICAgICogT2JqZWN0IG9mIHJlcGxhY2VtZW50cyB0byBwcm9jZXNzIGF0IHRoZSBlbmQgb2YgdGhlIHByb2Nlc3NpbmdcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMYW5ndWFnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBQcmlzbSBvYmplY3RcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGxldCBjdXJyZW50TGFuZ3VhZ2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9iamVjdCBvZiBzdGFydCBhbmQgZW5kIHBvc2l0aW9ucyBvZiBibG9ja3MgdG8gYmUgcmVwbGFjZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50UG9zaXRpb25zID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgaWYgdGhlIG1hdGNoIHBhc3NlZCBpbiBmYWxscyBpbnNpZGUgb2YgYW4gZXhpc3RpbmcgbWF0Y2guXG4gICAgICAgICAqIFRoaXMgcHJldmVudHMgYSByZWdleCBwYXR0ZXJuIGZyb20gbWF0Y2hpbmcgaW5zaWRlIG9mIGFub3RoZXIgcGF0dGVyblxuICAgICAgICAgKiB0aGF0IG1hdGNoZXMgYSBsYXJnZXIgYW1vdW50IG9mIGNvZGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEZvciBleGFtcGxlIHRoaXMgcHJldmVudHMgYSBrZXl3b3JkIGZyb20gbWF0Y2hpbmcgYGZ1bmN0aW9uYCBpZiB0aGVyZVxuICAgICAgICAgKiBpcyBhbHJlYWR5IGEgbWF0Y2ggZm9yIGBmdW5jdGlvbiAoLiopYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0ICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZW5kICAgICAgZW5kIHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX21hdGNoSXNJbnNpZGVPdGhlck1hdGNoKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiByZXBsYWNlbWVudFBvc2l0aW9ucykge1xuICAgICAgICAgICAgICAgIGtleSA9IHBhcnNlSW50KGtleSwgMTApO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBibG9jayBjb21wbGV0ZWx5IG92ZXJsYXBzIHdpdGggYW5vdGhlciBibG9ja1xuICAgICAgICAgICAgICAgIC8vIHRoZW4gd2Ugc2hvdWxkIHJlbW92ZSB0aGUgb3RoZXIgYmxvY2sgYW5kIHJldHVybiBgZmFsc2VgLlxuICAgICAgICAgICAgICAgIGlmIChoYXNDb21wbGV0ZU92ZXJsYXAoa2V5LCByZXBsYWNlbWVudFBvc2l0aW9uc1trZXldLCBzdGFydCwgZW5kKSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVwbGFjZW1lbnRQb3NpdGlvbnNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlcGxhY2VtZW50c1trZXldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3RzKGtleSwgcmVwbGFjZW1lbnRQb3NpdGlvbnNba2V5XSwgc3RhcnQsIGVuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGFrZXMgYSBzdHJpbmcgb2YgY29kZSBhbmQgd3JhcHMgaXQgaW4gYSBzcGFuIHRhZyBiYXNlZCBvbiB0aGUgbmFtZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAgICAgICAgbmFtZSBvZiB0aGUgcGF0dGVybiAoaWUga2V5d29yZC5yZWdleClcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgIGJsb2NrIG9mIGNvZGUgdG8gd3JhcFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsQ2xhc3MgY2xhc3MgdG8gYXBwbHkgdG8gZXZlcnkgc3BhblxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfd3JhcENvZGVJblNwYW4obmFtZSwgY29kZSkge1xuICAgICAgICAgICAgbGV0IGNsYXNzTmFtZSA9IG5hbWUucmVwbGFjZSgvXFwuL2csICcgJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGdsb2JhbENsYXNzID0gb3B0aW9ucy5nbG9iYWxDbGFzcztcbiAgICAgICAgICAgIGlmIChnbG9iYWxDbGFzcykge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSBgICR7Z2xvYmFsQ2xhc3N9YDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cIiR7Y2xhc3NOYW1lfVwiPiR7Y29kZX08L3NwYW4+YDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzIHJlcGxhY2VtZW50cyBpbiB0aGUgc3RyaW5nIG9mIGNvZGUgdG8gYWN0dWFsbHkgdXBkYXRlXG4gICAgICAgICAqIHRoZSBtYXJrdXBcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICB0aGUgY29kZSB0byBwcm9jZXNzIHJlcGxhY2VtZW50cyBpblxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc1JlcGxhY2VtZW50cyhjb2RlKSB7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBrZXlzKHJlcGxhY2VtZW50cyk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBvc2l0aW9uIG9mIHBvc2l0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnRzW3Bvc2l0aW9uXTtcbiAgICAgICAgICAgICAgICBjb2RlID0gcmVwbGFjZUF0UG9zaXRpb24ocG9zaXRpb24sIHJlcGxhY2VtZW50LnJlcGxhY2UsIHJlcGxhY2VtZW50LndpdGgsIGNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZGU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSXQgaXMgc28gd2UgY2FuIGNyZWF0ZSBhIG5ldyByZWdleCBvYmplY3QgZm9yIGVhY2ggY2FsbCB0b1xuICAgICAgICAgKiBfcHJvY2Vzc1BhdHRlcm4gdG8gYXZvaWQgc3RhdGUgY2Fycnlpbmcgb3ZlciB3aGVuIHJ1bm5pbmcgZXhlY1xuICAgICAgICAgKiBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGdsb2JhbCBmbGFnIHNob3VsZCBub3QgYmUgY2FycmllZCBvdmVyIGJlY2F1c2Ugd2UgYXJlIHNpbXVsYXRpbmdcbiAgICAgICAgICogaXQgYnkgcHJvY2Vzc2luZyB0aGUgcmVnZXggaW4gYSBsb29wIHNvIHdlIG9ubHkgY2FyZSBhYm91dCB0aGUgZmlyc3RcbiAgICAgICAgICogbWF0Y2ggaW4gZWFjaCBzdHJpbmcuIFRoaXMgYWxzbyBzZWVtcyB0byBpbXByb3ZlIHBlcmZvcm1hbmNlIHF1aXRlIGFcbiAgICAgICAgICogYml0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gcmVnZXhcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX2Nsb25lUmVnZXgocmVnZXgpIHtcbiAgICAgICAgICAgIGxldCBmbGFncyA9ICcnO1xuXG4gICAgICAgICAgICBpZiAocmVnZXguaWdub3JlQ2FzZSkge1xuICAgICAgICAgICAgICAgIGZsYWdzICs9ICdpJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZ2V4Lm11bHRpbGluZSkge1xuICAgICAgICAgICAgICAgIGZsYWdzICs9ICdtJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAocmVnZXguc291cmNlLCBmbGFncyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogTWF0Y2hlcyBhIHJlZ2V4IHBhdHRlcm4gYWdhaW5zdCBhIGJsb2NrIG9mIGNvZGUsIGZpbmRzIGFsbCBtYXRjaGVzXG4gICAgICAgICAqIHRoYXQgc2hvdWxkIGJlIHByb2Nlc3NlZCwgYW5kIHN0b3JlcyB0aGUgcG9zaXRpb25zIG9mIHdoZXJlIHRoZXlcbiAgICAgICAgICogc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGhpbiB0aGUgc3RyaW5nLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIGlzIHdoZXJlIHByZXR0eSBtdWNoIGFsbCB0aGUgd29yayBpcyBkb25lIGJ1dCBpdCBzaG91bGQgbm90XG4gICAgICAgICAqIGJlIGNhbGxlZCBkaXJlY3RseS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHBhdHRlcm5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgICAgICAgKiBAcmV0dXJuIHttaXhlZH1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCBjb2RlLCBvZmZzZXQgPSAwKSB7XG4gICAgICAgICAgICBsZXQgcmVnZXggPSBwYXR0ZXJuLnBhdHRlcm47XG4gICAgICAgICAgICBpZiAoIXJlZ2V4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTaW5jZSB3ZSBhcmUgc2ltdWxhdGluZyBnbG9iYWwgcmVnZXggbWF0Y2hpbmcgd2UgbmVlZCB0byBhbHNvXG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdG8gc3RvcCBhZnRlciBvbmUgbWF0Y2ggaWYgdGhlIHBhdHRlcm4gaXMgbm90IGdsb2JhbFxuICAgICAgICAgICAgY29uc3Qgc2hvdWxkU3RvcCA9ICFyZWdleC5nbG9iYWw7XG5cbiAgICAgICAgICAgIHJlZ2V4ID0gX2Nsb25lUmVnZXgocmVnZXgpO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdleC5leGVjKGNvZGUpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJlYXQgbWF0Y2ggMCB0aGUgc2FtZSB3YXkgYXMgbmFtZVxuICAgICAgICAgICAgaWYgKCFwYXR0ZXJuLm5hbWUgJiYgcGF0dGVybi5tYXRjaGVzICYmIHR5cGVvZiBwYXR0ZXJuLm1hdGNoZXNbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcGF0dGVybi5uYW1lID0gcGF0dGVybi5tYXRjaGVzWzBdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXR0ZXJuLm1hdGNoZXNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCByZXBsYWNlbWVudCA9IG1hdGNoWzBdO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRQb3MgPSBtYXRjaC5pbmRleCArIG9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IGVuZFBvcyA9IG1hdGNoWzBdLmxlbmd0aCArIHN0YXJ0UG9zO1xuXG4gICAgICAgICAgICAvLyBJbiBzb21lIGNhc2VzIHdoZW4gdGhlIHJlZ2V4IG1hdGNoZXMgYSBncm91cCBzdWNoIGFzIFxccyogaXQgaXNcbiAgICAgICAgICAgIC8vIHBvc3NpYmxlIGZvciB0aGVyZSB0byBiZSBhIG1hdGNoLCBidXQgaGF2ZSB0aGUgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgICAgIC8vIGVxdWFsIHRoZSBlbmQgcG9zaXRpb24uIEluIHRob3NlIGNhc2VzIHdlIHNob3VsZCBiZSBhYmxlIHRvIHN0b3BcbiAgICAgICAgICAgIC8vIG1hdGNoaW5nLiBPdGhlcndpc2UgdGhpcyBjYW4gbGVhZCB0byBhbiBpbmZpbml0ZSBsb29wLlxuICAgICAgICAgICAgaWYgKHN0YXJ0UG9zID09PSBlbmRQb3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IGEgY2hpbGQgbWF0Y2ggYW5kIGl0IGZhbGxzIGluc2lkZSBvZiBhbm90aGVyXG4gICAgICAgICAgICAvLyBtYXRjaCB0aGF0IGFscmVhZHkgaGFwcGVuZWQgd2Ugc2hvdWxkIHNraXAgaXQgYW5kIGNvbnRpbnVlXG4gICAgICAgICAgICAvLyBwcm9jZXNzaW5nLlxuICAgICAgICAgICAgaWYgKF9tYXRjaElzSW5zaWRlT3RoZXJNYXRjaChzdGFydFBvcywgZW5kUG9zKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZzogY29kZS5zdWJzdHIoZW5kUG9zIC0gb2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBlbmRQb3NcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGxiYWNrIGZvciB3aGVuIGEgbWF0Y2ggd2FzIHN1Y2Nlc3NmdWxseSBwcm9jZXNzZWRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwbFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gb25NYXRjaFN1Y2Nlc3MocmVwbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBtYXRjaCBoYXMgYSBuYW1lIHRoZW4gd3JhcCBpdCBpbiBhIHNwYW4gdGFnXG4gICAgICAgICAgICAgICAgaWYgKHBhdHRlcm4ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXBsID0gX3dyYXBDb2RlSW5TcGFuKHBhdHRlcm4ubmFtZSwgcmVwbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIGRlYnVnZ2luZ1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdSZXBsYWNlICcgKyBtYXRjaFswXSArICcgd2l0aCAnICsgcmVwbGFjZW1lbnQgKyAnIGF0IHBvc2l0aW9uICcgKyBzdGFydFBvcyArICcgdG8gJyArIGVuZFBvcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBTdG9yZSB3aGF0IG5lZWRzIHRvIGJlIHJlcGxhY2VkIHdpdGggd2hhdCBhdCB0aGlzIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRzW3N0YXJ0UG9zXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3JlcGxhY2UnOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICAgICAgJ3dpdGgnOiByZXBsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSByYW5nZSBvZiB0aGlzIG1hdGNoIHNvIHdlIGNhbiB1c2UgaXQgZm9yXG4gICAgICAgICAgICAgICAgLy8gY29tcGFyaXNvbnMgd2l0aCBvdGhlciBtYXRjaGVzIGxhdGVyLlxuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50UG9zaXRpb25zW3N0YXJ0UG9zXSA9IGVuZFBvcztcblxuICAgICAgICAgICAgICAgIGlmIChzaG91bGRTdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmc6IGNvZGUuc3Vic3RyKGVuZFBvcyAtIG9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogZW5kUG9zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHByb2Nlc3NpbmcgYSBzdWIgZ3JvdXBcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBLZXkgICAgICBpbmRleCBvZiBncm91cFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NHcm91cChncm91cEtleSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrID0gbWF0Y2hbZ3JvdXBLZXldO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gbWF0Y2ggaGVyZSB0aGVuIG1vdmUgb25cbiAgICAgICAgICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBncm91cCA9IHBhdHRlcm4ubWF0Y2hlc1tncm91cEtleV07XG4gICAgICAgICAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBncm91cC5sYW5ndWFnZTtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFByb2Nlc3MgZ3JvdXAgaXMgd2hhdCBncm91cCB3ZSBzaG91bGQgdXNlIHRvIGFjdHVhbGx5IHByb2Nlc3NcbiAgICAgICAgICAgICAgICAgKiB0aGlzIG1hdGNoIGdyb3VwLlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogRm9yIGV4YW1wbGUgaWYgdGhlIHN1Ymdyb3VwIHBhdHRlcm4gbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogMjoge1xuICAgICAgICAgICAgICAgICAqICAgICAnbmFtZSc6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgICAgICAgKiAgICAgJ3BhdHRlcm4nOiAvdHJ1ZS9nXG4gICAgICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogdGhlbiB3ZSB1c2UgdGhhdCBhcyBpcywgYnV0IGlmIGl0IGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIDI6IHtcbiAgICAgICAgICAgICAgICAgKiAgICAgJ25hbWUnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICogICAgICdtYXRjaGVzJzoge1xuICAgICAgICAgICAgICAgICAqICAgICAgICAgICduYW1lJzogJ3NwZWNpYWwnLFxuICAgICAgICAgICAgICAgICAqICAgICAgICAgICdwYXR0ZXJuJzogL3doYXRldmVyL2dcbiAgICAgICAgICAgICAgICAgKiAgICAgIH1cbiAgICAgICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiB3ZSB0cmVhdCB0aGUgJ21hdGNoZXMnIHBhcnQgYXMgdGhlIHBhdHRlcm4gYW5kIGtlZXBcbiAgICAgICAgICAgICAgICAgKiB0aGUgbmFtZSBhcm91bmQgdG8gd3JhcCBpdCB3aXRoIGxhdGVyXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBUb1Byb2Nlc3MgPSBncm91cC5uYW1lICYmIGdyb3VwLm1hdGNoZXMgPyBncm91cC5tYXRjaGVzIDogZ3JvdXA7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUYWtlcyB0aGUgY29kZSBibG9jayBtYXRjaGVkIGF0IHRoaXMgZ3JvdXAsIHJlcGxhY2VzIGl0XG4gICAgICAgICAgICAgICAgICogd2l0aCB0aGUgaGlnaGxpZ2h0ZWQgYmxvY2ssIGFuZCBvcHRpb25hbGx5IHdyYXBzIGl0IHdpdGhcbiAgICAgICAgICAgICAgICAgKiBhIHNwYW4gd2l0aCBhIG5hbWVcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzZWRCbG9ja1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBsYWNlQmxvY2tcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBtYXRjaE5hbWVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBjb25zdCBfZ2V0UmVwbGFjZW1lbnQgPSBmdW5jdGlvbihwYXNzZWRCbG9jaywgcmVwbGFjZUJsb2NrLCBtYXRjaE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlQXRQb3NpdGlvbihpbmRleE9mR3JvdXAobWF0Y2gsIGdyb3VwS2V5KSwgcGFzc2VkQmxvY2ssIG1hdGNoTmFtZSA/IF93cmFwQ29kZUluU3BhbihtYXRjaE5hbWUsIHJlcGxhY2VCbG9jaykgOiByZXBsYWNlQmxvY2ssIHJlcGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgc3RyaW5nIHRoZW4gdGhpcyBtYXRjaCBpcyBkaXJlY3RseSBtYXBwZWRcbiAgICAgICAgICAgICAgICAvLyB0byBzZWxlY3RvciBzbyBhbGwgd2UgaGF2ZSB0byBkbyBpcyB3cmFwIGl0IGluIGEgc3BhblxuICAgICAgICAgICAgICAgIC8vIGFuZCBjb250aW51ZS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdyb3VwID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGJsb2NrLCBncm91cCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgbG9jYWxDb2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHN1Ymxhbmd1YWdlIGdvIGFuZCBwcm9jZXNzIHRoZSBibG9jayB1c2luZ1xuICAgICAgICAgICAgICAgIC8vIHRoYXQgbGFuZ3VhZ2VcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxDb2RlID0gcHJpc20ucmVmcmFjdChibG9jaywgbGFuZ3VhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGxvY2FsQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcHJvY2VzcyBncm91cCBjYW4gYmUgYSBzaW5nbGUgcGF0dGVybiBvciBhbiBhcnJheSBvZlxuICAgICAgICAgICAgICAgIC8vIHBhdHRlcm5zLiBgX3Byb2Nlc3NDb2RlV2l0aFBhdHRlcm5zYCBhbHdheXMgZXhwZWN0cyBhbiBhcnJheVxuICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNvbnZlcnQgaXQgaGVyZS5cbiAgICAgICAgICAgICAgICBsb2NhbENvZGUgPSBwcmlzbS5yZWZyYWN0KGJsb2NrLCBjdXJyZW50TGFuZ3VhZ2UsIGdyb3VwVG9Qcm9jZXNzLmxlbmd0aCA/IGdyb3VwVG9Qcm9jZXNzIDogW2dyb3VwVG9Qcm9jZXNzXSk7XG4gICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBsb2NhbENvZGUsIGdyb3VwLm1hdGNoZXMgPyBncm91cC5uYW1lIDogMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgcGF0dGVybiBoYXMgc3ViIG1hdGNoZXMgZm9yIGRpZmZlcmVudCBncm91cHMgaW4gdGhlIHJlZ2V4XG4gICAgICAgICAgICAvLyB0aGVuIHdlIHNob3VsZCBwcm9jZXNzIHRoZW0gb25lIGF0IGEgdGltZSBieSBydW5uaW5nIHRoZW0gdGhyb3VnaFxuICAgICAgICAgICAgLy8gdGhlIF9wcm9jZXNzR3JvdXAgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgdGhlIG5ldyByZXBsYWNlbWVudC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXZSB1c2UgdGhlIGBrZXlzYCBmdW5jdGlvbiB0byBydW4gdGhyb3VnaCB0aGVtIGJhY2t3YXJkcyBiZWNhdXNlXG4gICAgICAgICAgICAvLyB0aGUgbWF0Y2ggcG9zaXRpb24gb2YgZWFybGllciBtYXRjaGVzIHdpbGwgbm90IGNoYW5nZSBkZXBlbmRpbmdcbiAgICAgICAgICAgIC8vIG9uIHdoYXQgZ2V0cyByZXBsYWNlZCBpbiBsYXRlciBtYXRjaGVzLlxuICAgICAgICAgICAgY29uc3QgZ3JvdXBLZXlzID0ga2V5cyhwYXR0ZXJuLm1hdGNoZXMpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBncm91cEtleSBvZiBncm91cEtleXMpIHtcbiAgICAgICAgICAgICAgICBfcHJvY2Vzc0dyb3VwKGdyb3VwS2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluYWxseSwgY2FsbCBgb25NYXRjaFN1Y2Nlc3NgIHdpdGggdGhlIHJlcGxhY2VtZW50XG4gICAgICAgICAgICByZXR1cm4gb25NYXRjaFN1Y2Nlc3MocmVwbGFjZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb2Nlc3NlcyBhIGJsb2NrIG9mIGNvZGUgdXNpbmcgc3BlY2lmaWVkIHBhdHRlcm5zXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhdHRlcm5zXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzQ29kZVdpdGhQYXR0ZXJucyhjb2RlLCBwYXR0ZXJucykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCBjb2RlKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IF9wcm9jZXNzUGF0dGVybihwYXR0ZXJuLCByZXN1bHQucmVtYWluaW5nLCByZXN1bHQub2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdlIGFyZSBkb25lIHByb2Nlc3NpbmcgdGhlIHBhdHRlcm5zIHNvIHdlIHNob3VsZCBhY3R1YWxseSByZXBsYWNlXG4gICAgICAgICAgICAvLyB3aGF0IG5lZWRzIHRvIGJlIHJlcGxhY2VkIGluIHRoZSBjb2RlLlxuICAgICAgICAgICAgcmV0dXJuIF9wcm9jZXNzUmVwbGFjZW1lbnRzKGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgYSBsaXN0IG9mIHJlZ2V4IHBhdHRlcm5zIGZvciB0aGlzIGxhbmd1YWdlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldFBhdHRlcm5zRm9yTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIGxldCBwYXR0ZXJucyA9IG9wdGlvbnMucGF0dGVybnNbbGFuZ3VhZ2VdIHx8IFtdO1xuICAgICAgICAgICAgd2hpbGUgKG9wdGlvbnMuaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdKSB7XG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2UgPSBvcHRpb25zLmluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXTtcbiAgICAgICAgICAgICAgICBwYXR0ZXJucyA9IHBhdHRlcm5zLmNvbmNhdChvcHRpb25zLnBhdHRlcm5zW2xhbmd1YWdlXSB8fCBbXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwYXR0ZXJucztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYWtlcyBhIHN0cmluZyBvZiBjb2RlIGFuZCBoaWdobGlnaHRzIGl0IGFjY29yZGluZyB0byB0aGUgbGFuZ3VhZ2VcbiAgICAgICAgICogc3BlY2lmaWVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGF0dGVybnMgb3B0aW9uYWxseSBzcGVjaWZ5IGEgbGlzdCBvZiBwYXR0ZXJuc1xuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfaGlnaGxpZ2h0QmxvY2tGb3JMYW5ndWFnZShjb2RlLCBsYW5ndWFnZSwgcGF0dGVybnMpIHtcbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9IGxhbmd1YWdlO1xuICAgICAgICAgICAgcGF0dGVybnMgPSBwYXR0ZXJucyB8fCBnZXRQYXR0ZXJuc0Zvckxhbmd1YWdlKGxhbmd1YWdlKTtcbiAgICAgICAgICAgIHJldHVybiBfcHJvY2Vzc0NvZGVXaXRoUGF0dGVybnMoaHRtbEVudGl0aWVzKGNvZGUpLCBwYXR0ZXJucyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZnJhY3QgPSBfaGlnaGxpZ2h0QmxvY2tGb3JMYW5ndWFnZTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFByaXNtO1xuIiwiaW1wb3J0IFByaXNtIGZyb20gJy4vcHJpc20nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByYWluYm93V29ya2VyKGUpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gZS5kYXRhO1xuXG4gICAgY29uc3QgcHJpc20gPSBuZXcgUHJpc20obWVzc2FnZS5vcHRpb25zKTtcbiAgICBjb25zdCByZXN1bHQgPSBwcmlzbS5yZWZyYWN0KG1lc3NhZ2UuY29kZSwgbWVzc2FnZS5sYW5nKTtcblxuICAgIGZ1bmN0aW9uIF9yZXBseSgpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBpZDogbWVzc2FnZS5pZCxcbiAgICAgICAgICAgIGxhbmc6IG1lc3NhZ2UubGFuZyxcbiAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBJIHJlYWxpemVkIGRvd24gdGhlIHJvYWQgSSBtaWdodCBsb29rIGF0IHRoaXMgYW5kIHdvbmRlciB3aGF0IGlzIGdvaW5nIG9uXG4gICAgLy8gc28gcHJvYmFibHkgaXQgaXMgbm90IGEgYmFkIGlkZWEgdG8gbGVhdmUgYSBjb21tZW50LlxuICAgIC8vXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSByaWdodCBub3cgdGhlIG5vZGUgbGlicmFyeSBmb3Igc2ltdWxhdGluZyB3ZWJcbiAgICAvLyB3b3JrZXJzIOKAnHdlYndvcmtlci10aHJlYWRz4oCdIHdpbGwga2VlcCB0aGUgd29ya2VyIG9wZW4gYW5kIGl0IGNhdXNlc1xuICAgIC8vIHNjcmlwdHMgcnVubmluZyBmcm9tIHRoZSBjb21tYW5kIGxpbmUgdG8gaGFuZyB1bmxlc3MgdGhlIHdvcmtlciBpc1xuICAgIC8vIGV4cGxpY2l0bHkgY2xvc2VkLlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBmb3Igbm9kZSB3ZSB3aWxsIHNwYXduIGEgbmV3IHRocmVhZCBmb3IgZXZlcnkgYXN5bmNocm9ub3VzXG4gICAgLy8gYmxvY2sgd2UgYXJlIGhpZ2hsaWdodGluZywgYnV0IGluIHRoZSBicm93c2VyIHdlIHdpbGwga2VlcCBhIHNpbmdsZVxuICAgIC8vIHdvcmtlciBvcGVuIGZvciBhbGwgcmVxdWVzdHMuXG4gICAgaWYgKG1lc3NhZ2UuaXNOb2RlKSB7XG4gICAgICAgIF9yZXBseSgpO1xuICAgICAgICBzZWxmLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgX3JlcGx5KCk7XG4gICAgfSwgbWVzc2FnZS5vcHRpb25zLmRlbGF5ICogMTAwMCk7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgQ3JhaWcgQ2FtcGJlbGxcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKiBSYWluYm93IGlzIGEgc2ltcGxlIGNvZGUgc3ludGF4IGhpZ2hsaWdodGVyXG4gKlxuICogQHNlZSByYWluYm93Y28uZGVcbiAqL1xuaW1wb3J0IFByaXNtIGZyb20gJy4vcHJpc20nO1xuaW1wb3J0IHsgaXNOb2RlIGFzIHV0aWxJc05vZGUsIGlzV29ya2VyIGFzIHV0aWxJc1dvcmtlciwgY3JlYXRlV29ya2VyLCBnZXRMYW5ndWFnZUZvckJsb2NrIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCByYWluYm93V29ya2VyIGZyb20gJy4vd29ya2VyJztcblxuLyoqXG4gKiBBbiBhcnJheSBvZiB0aGUgbGFuZ3VhZ2UgcGF0dGVybnMgc3BlY2lmaWVkIGZvciBlYWNoIGxhbmd1YWdlXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgcGF0dGVybnMgPSB7fTtcblxuLyoqXG4gKiBBbiBvYmplY3Qgb2YgbGFuZ3VhZ2VzIG1hcHBpbmcgdG8gd2hhdCBsYW5ndWFnZSB0aGV5IHNob3VsZCBpbmhlcml0IGZyb21cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCBpbmhlcml0ZW5jZU1hcCA9IHt9O1xuXG4vKipcbiAqIEEgbWFwcGluZyBvZiBsYW5ndWFnZSBhbGlhc2VzXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgYWxpYXNlcyA9IHt9O1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIHRoZSBhY3R1YWwgcmFpbmJvdyBvYmplY3RcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5sZXQgUmFpbmJvdyA9IHt9O1xuXG4vKipcbiAqIENhbGxiYWNrIHRvIGZpcmUgYWZ0ZXIgZWFjaCBibG9jayBpcyBoaWdobGlnaHRlZFxuICpcbiAqIEB0eXBlIHtudWxsfEZ1bmN0aW9ufVxuICovXG5sZXQgb25IaWdobGlnaHRDYWxsYmFjaztcblxuLyoqXG4gKiBDb3VudGVyIGZvciBibG9jayBpZHNcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NjYW1wYmVsbC9yYWluYm93L2lzc3Vlcy8yMDdcbiAqL1xubGV0IGlkID0gMDtcblxuY29uc3QgaXNOb2RlID0gdXRpbElzTm9kZSgpO1xuY29uc3QgaXNXb3JrZXIgPSB1dGlsSXNXb3JrZXIoKTtcblxubGV0IGNhY2hlZFdvcmtlciA9IG51bGw7XG5mdW5jdGlvbiBfZ2V0V29ya2VyKCkge1xuICAgIGlmIChpc05vZGUgfHwgY2FjaGVkV29ya2VyID09PSBudWxsKSB7XG4gICAgICAgIGNhY2hlZFdvcmtlciA9IGNyZWF0ZVdvcmtlcihyYWluYm93V29ya2VyLCBQcmlzbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhY2hlZFdvcmtlcjtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZm9yIG1hdGNoaW5nIHVwIGNhbGxiYWNrcyBkaXJlY3RseSB3aXRoIHRoZVxuICogcG9zdCBtZXNzYWdlIHJlcXVlc3RzIHRvIGEgd2ViIHdvcmtlci5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gbWVzc2FnZSAgICAgIGRhdGEgdG8gc2VuZCB0byB3ZWIgd29ya2VyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAgIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciB3b3JrZXIgdG8gcmVwbHkgdG9cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9tZXNzYWdlV29ya2VyKG1lc3NhZ2UsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgd29ya2VyID0gX2dldFdvcmtlcigpO1xuXG4gICAgZnVuY3Rpb24gX2xpc3RlbihlKSB7XG4gICAgICAgIGlmIChlLmRhdGEuaWQgPT09IG1lc3NhZ2UuaWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGUuZGF0YSk7XG4gICAgICAgICAgICB3b3JrZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF9saXN0ZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBfbGlzdGVuKTtcbiAgICB3b3JrZXIucG9zdE1lc3NhZ2UobWVzc2FnZSk7XG59XG5cbi8qKlxuICogQnJvd3NlciBPbmx5IC0gSGFuZGxlcyByZXNwb25zZSBmcm9tIHdlYiB3b3JrZXIsIHVwZGF0ZXMgRE9NIHdpdGhcbiAqIHJlc3VsdGluZyBjb2RlLCBhbmQgZmlyZXMgY2FsbGJhY2tcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSB3YWl0aW5nT25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfZ2VuZXJhdGVIYW5kbGVyKGVsZW1lbnQsIHdhaXRpbmdPbiwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gX2hhbmRsZVJlc3BvbnNlRnJvbVdvcmtlcihkYXRhKSB7XG4gICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gZGF0YS5yZXN1bHQ7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3JhaW5ib3ctc2hvdycpO1xuXG4gICAgICAgIGlmIChlbGVtZW50LnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ1BSRScpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUuY2xhc3NMaXN0LmFkZCgncmFpbmJvdy1zaG93Jyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIChlKSA9PiB7XG4gICAgICAgIC8vICAgICBpZiAoZS5hbmltYXRpb25OYW1lID09PSAnZmFkZS1pbicpIHtcbiAgICAgICAgLy8gICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdkZWNyZWFzZS1kZWxheScpO1xuICAgICAgICAvLyAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9KTtcblxuICAgICAgICBpZiAob25IaWdobGlnaHRDYWxsYmFjaykge1xuICAgICAgICAgICAgb25IaWdobGlnaHRDYWxsYmFjayhlbGVtZW50LCBkYXRhLmxhbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKC0td2FpdGluZ09uLmMgPT09IDApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vKipcbiAqIEdldHMgb3B0aW9ucyBuZWVkZWQgdG8gcGFzcyBpbnRvIFByaXNtXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gX2dldFByaXNtT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGF0dGVybnMsXG4gICAgICAgIGluaGVyaXRlbmNlTWFwLFxuICAgICAgICBhbGlhc2VzLFxuICAgICAgICBnbG9iYWxDbGFzczogb3B0aW9ucy5nbG9iYWxDbGFzcyxcbiAgICAgICAgZGVsYXk6ICFpc05hTihvcHRpb25zLmRlbGF5KSA/IG9wdGlvbnMuZGVsYXkgOiAwXG4gICAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIGRhdGEgdG8gc2VuZCB0byB3ZWJ3b3JrZXJcbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSAge3N0cmluZ30gbGFuZ1xuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBfZ2V0V29ya2VyRGF0YShjb2RlLCBsYW5nKSB7XG4gICAgbGV0IG9wdGlvbnMgPSB7fTtcbiAgICBpZiAodHlwZW9mIGxhbmcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG9wdGlvbnMgPSBsYW5nO1xuICAgICAgICBsYW5nID0gb3B0aW9ucy5sYW5ndWFnZTtcbiAgICB9XG5cbiAgICBsYW5nID0gYWxpYXNlc1tsYW5nXSB8fCBsYW5nO1xuXG4gICAgY29uc3Qgd29ya2VyRGF0YSA9IHtcbiAgICAgICAgaWQ6IGlkKyssXG4gICAgICAgIGNvZGUsXG4gICAgICAgIGxhbmcsXG4gICAgICAgIG9wdGlvbnM6IF9nZXRQcmlzbU9wdGlvbnMob3B0aW9ucyksXG4gICAgICAgIGlzTm9kZVxuICAgIH07XG5cbiAgICByZXR1cm4gd29ya2VyRGF0YTtcbn1cblxuLyoqXG4gKiBCcm93c2VyIE9ubHkgLSBTZW5kcyBtZXNzYWdlcyB0byB3ZWIgd29ya2VyIHRvIGhpZ2hsaWdodCBlbGVtZW50cyBwYXNzZWRcbiAqIGluXG4gKlxuICogQHBhcmFtIHtBcnJheX0gY29kZUJsb2Nrc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9oaWdobGlnaHRDb2RlQmxvY2tzKGNvZGVCbG9ja3MsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgd2FpdGluZ09uID0geyBjOiAwIH07XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBjb2RlQmxvY2tzKSB7XG4gICAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2VGb3JCbG9jayhibG9jayk7XG4gICAgICAgIGlmIChibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ3JhaW5ib3cnKSB8fCAhbGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBjYW5jZWxzIHRoZSBwZW5kaW5nIGFuaW1hdGlvbiB0byBmYWRlIHRoZSBjb2RlIGluIG9uIGxvYWRcbiAgICAgICAgLy8gc2luY2Ugd2Ugd2FudCB0byBkZWxheSBkb2luZyB0aGlzIHVudGlsIGl0IGlzIGFjdHVhbGx5XG4gICAgICAgIC8vIGhpZ2hsaWdodGVkXG4gICAgICAgIGJsb2NrLmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgICAgICAgYmxvY2suY2xhc3NMaXN0LmFkZCgncmFpbmJvdycpO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRvIGFsc28gYWRkIHRoZSBsb2FkaW5nIGNsYXNzIHRvIHRoZSBwcmUgdGFnXG4gICAgICAgIC8vIGJlY2F1c2UgdGhhdCBpcyBob3cgd2Ugd2lsbCBrbm93IHRvIHNob3cgYSBwcmVsb2FkZXJcbiAgICAgICAgaWYgKGJsb2NrLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ1BSRScpIHtcbiAgICAgICAgICAgIGJsb2NrLnBhcmVudE5vZGUuY2xhc3NMaXN0LmFkZCgnbG9hZGluZycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZ2xvYmFsQ2xhc3MgPSBibG9jay5nZXRBdHRyaWJ1dGUoJ2RhdGEtZ2xvYmFsLWNsYXNzJyk7XG4gICAgICAgIGNvbnN0IGRlbGF5ID0gcGFyc2VJbnQoYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWRlbGF5JyksIDEwKTtcblxuICAgICAgICArK3dhaXRpbmdPbi5jO1xuICAgICAgICBfbWVzc2FnZVdvcmtlcihfZ2V0V29ya2VyRGF0YShibG9jay5pbm5lckhUTUwsIHsgbGFuZ3VhZ2UsIGdsb2JhbENsYXNzLCBkZWxheSB9KSwgX2dlbmVyYXRlSGFuZGxlcihibG9jaywgd2FpdGluZ09uLCBjYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICh3YWl0aW5nT24uYyA9PT0gMCkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX2FkZFByZWxvYWRlcihwcmVCbG9jaykge1xuICAgIGNvbnN0IHByZWxvYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHByZWxvYWRlci5jbGFzc05hbWUgPSAncHJlbG9hZGVyJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICBwcmVsb2FkZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xuICAgIH1cbiAgICBwcmVCbG9jay5hcHBlbmRDaGlsZChwcmVsb2FkZXIpO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIFN0YXJ0IGhpZ2hsaWdodGluZyBhbGwgdGhlIGNvZGUgYmxvY2tzXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBub2RlICAgICAgIEhUTUxFbGVtZW50IHRvIHNlYXJjaCB3aXRoaW5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfaGlnaGxpZ2h0KG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xuXG4gICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IGNhbiBiZSBhbiBFdmVudCBvciBhIERPTSBFbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSSB3YXMgb3JpZ2luYWxseSBjaGVja2luZyBpbnN0YW5jZW9mIEV2ZW50IGJ1dCB0aGF0IG1hZGUgaXQgYnJlYWtcbiAgICAvLyB3aGVuIHVzaW5nIG1vb3Rvb2xzLlxuICAgIC8vXG4gICAgLy8gQHNlZSBodHRwczovL2dpdGh1Yi5jb20vY2NhbXBiZWxsL3JhaW5ib3cvaXNzdWVzLzMyXG4gICAgbm9kZSA9IG5vZGUgJiYgdHlwZW9mIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUgPT09ICdmdW5jdGlvbicgPyBub2RlIDogZG9jdW1lbnQ7XG5cbiAgICBjb25zdCBwcmVCbG9ja3MgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwcmUnKTtcbiAgICBjb25zdCBjb2RlQmxvY2tzID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpO1xuICAgIGNvbnN0IGZpbmFsUHJlQmxvY2tzID0gW107XG4gICAgY29uc3QgZmluYWxDb2RlQmxvY2tzID0gW107XG5cbiAgICAvLyBGaXJzdCBsb29wIHRocm91Z2ggYWxsIHByZSBibG9ja3MgdG8gZmluZCB3aGljaCBvbmVzIHRvIGhpZ2hsaWdodFxuICAgIGZvciAoY29uc3QgcHJlQmxvY2sgb2YgcHJlQmxvY2tzKSB7XG4gICAgICAgIF9hZGRQcmVsb2FkZXIocHJlQmxvY2spO1xuXG4gICAgICAgIC8vIFN0cmlwIHdoaXRlc3BhY2UgYXJvdW5kIGNvZGUgdGFncyB3aGVuIHRoZXkgYXJlIGluc2lkZSBvZiBhIHByZVxuICAgICAgICAvLyB0YWcuICBUaGlzIG1ha2VzIHRoZSB0aGVtZXMgbG9vayBiZXR0ZXIgYmVjYXVzZSB5b3UgY2FuJ3RcbiAgICAgICAgLy8gYWNjaWRlbnRhbGx5IGFkZCBleHRyYSBsaW5lYnJlYWtzIGF0IHRoZSBzdGFydCBhbmQgZW5kLlxuICAgICAgICAvL1xuICAgICAgICAvLyBXaGVuIHRoZSBwcmUgdGFnIGNvbnRhaW5zIGEgY29kZSB0YWcgdGhlbiBzdHJpcCBhbnkgZXh0cmFcbiAgICAgICAgLy8gd2hpdGVzcGFjZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIDxwcmU+XG4gICAgICAgIC8vICAgICAgPGNvZGU+dmFyIGZvbyA9IHRydWU7PC9jb2RlPlxuICAgICAgICAvLyA8L3ByZT5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gd2lsbCBiZWNvbWU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIDxwcmU+PGNvZGU+dmFyIGZvbyA9IHRydWU7PC9jb2RlPjwvcHJlPlxuICAgICAgICAvL1xuICAgICAgICAvLyBJZiB5b3Ugd2FudCB0byBwcmVzZXJ2ZSB3aGl0ZXNwYWNlIHlvdSBjYW4gdXNlIGEgcHJlIHRhZyBvblxuICAgICAgICAvLyBpdHMgb3duIHdpdGhvdXQgYSBjb2RlIHRhZyBpbnNpZGUgb2YgaXQuXG4gICAgICAgIGlmIChwcmVCbG9jay5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAvLyBUaGlzIGZpeGVzIGEgcmFjZSBjb25kaXRpb24gd2hlbiBSYWluYm93LmNvbG9yIGlzIGNhbGxlZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHRoZSBwcmV2aW91cyBjb2xvciBjYWxsIGhhcyBmaW5pc2hlZC5cbiAgICAgICAgICAgIGlmICghcHJlQmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLXRyaW1tZWQnKSkge1xuICAgICAgICAgICAgICAgIHByZUJsb2NrLnNldEF0dHJpYnV0ZSgnZGF0YS10cmltbWVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcHJlQmxvY2suaW5uZXJIVE1MID0gcHJlQmxvY2suaW5uZXJIVE1MLnRyaW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHByZSBibG9jayBoYXMgbm8gY29kZSBibG9ja3MgdGhlbiB3ZSBhcmUgZ29pbmcgdG8gd2FudCB0b1xuICAgICAgICAvLyBwcm9jZXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICBmaW5hbFByZUJsb2Nrcy5wdXNoKHByZUJsb2NrKTtcbiAgICB9XG5cbiAgICAvLyBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjczNTA2Ny9ob3ctdG8tY29udmVydC1hLWRvbS1ub2RlLWxpc3QtdG8tYW4tYXJyYXktaW4tamF2YXNjcmlwdFxuICAgIC8vIFdlIGFyZSBnb2luZyB0byBwcm9jZXNzIGFsbCA8Y29kZT4gYmxvY2tzXG4gICAgZm9yIChjb25zdCBjb2RlQmxvY2sgb2YgY29kZUJsb2Nrcykge1xuICAgICAgICBmaW5hbENvZGVCbG9ja3MucHVzaChjb2RlQmxvY2spO1xuICAgIH1cblxuICAgIF9oaWdobGlnaHRDb2RlQmxvY2tzKGZpbmFsQ29kZUJsb2Nrcy5jb25jYXQoZmluYWxQcmVCbG9ja3MpLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgdG8gbGV0IHlvdSBkbyBzdHVmZiBpbiB5b3VyIGFwcCBhZnRlciBhIHBpZWNlIG9mIGNvZGUgaGFzXG4gKiBiZWVuIGhpZ2hsaWdodGVkXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIG9uSGlnaGxpZ2h0KGNhbGxiYWNrKSB7XG4gICAgb25IaWdobGlnaHRDYWxsYmFjayA9IGNhbGxiYWNrO1xufVxuXG4vKipcbiAqIEV4dGVuZHMgdGhlIGxhbmd1YWdlIHBhdHRlcm4gbWF0Y2hlc1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSAgICAgICAgICAgIG5hbWUgb2YgbGFuZ3VhZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBsYW5ndWFnZVBhdHRlcm5zICAgIG9iamVjdCBvZiBwYXR0ZXJucyB0byBhZGQgb25cbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gaW5oZXJpdHMgIG9wdGlvbmFsIGxhbmd1YWdlIHRoYXQgdGhpcyBsYW5ndWFnZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGluaGVyaXQgcnVsZXMgZnJvbVxuICovXG5mdW5jdGlvbiBleHRlbmQobGFuZ3VhZ2UsIGxhbmd1YWdlUGF0dGVybnMsIGluaGVyaXRzKSB7XG5cbiAgICAvLyBJZiB3ZSBleHRlbmQgYSBsYW5ndWFnZSBhZ2FpbiB3ZSBzaG91bGRuJ3QgbmVlZCB0byBzcGVjaWZ5IHRoZVxuICAgIC8vIGluaGVyaXRlbmNlIGZvciBpdC4gRm9yIGV4YW1wbGUsIGlmIHlvdSBhcmUgYWRkaW5nIHNwZWNpYWwgaGlnaGxpZ2h0aW5nXG4gICAgLy8gZm9yIGEgamF2YXNjcmlwdCBmdW5jdGlvbiB0aGF0IGlzIG5vdCBpbiB0aGUgYmFzZSBqYXZhc2NyaXB0IHJ1bGVzLCB5b3VcbiAgICAvLyBzaG91bGQgYmUgYWJsZSB0byBkb1xuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5leHRlbmQoJ2phdmFzY3JpcHQnLCBbIOKApiBdKTtcbiAgICAvL1xuICAgIC8vIFdpdGhvdXQgc3BlY2lmeWluZyBhIGxhbmd1YWdlIGl0IHNob3VsZCBpbmhlcml0IChnZW5lcmljIGluIHRoaXMgY2FzZSlcbiAgICBpZiAoIWluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXSkge1xuICAgICAgICBpbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0gPSBpbmhlcml0cztcbiAgICB9XG5cbiAgICBwYXR0ZXJuc1tsYW5ndWFnZV0gPSBsYW5ndWFnZVBhdHRlcm5zLmNvbmNhdChwYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW10pO1xufVxuXG5mdW5jdGlvbiByZW1vdmUobGFuZ3VhZ2UpIHtcbiAgICBkZWxldGUgaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdO1xuICAgIGRlbGV0ZSBwYXR0ZXJuc1tsYW5ndWFnZV07XG59XG5cbi8qKlxuICogU3RhcnRzIHRoZSBtYWdpYyByYWluYm93XG4gKlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gY29sb3IoLi4uYXJncykge1xuXG4gICAgLy8gSWYgeW91IHdhbnQgdG8gc3RyYWlnaHQgdXAgaGlnaGxpZ2h0IGEgc3RyaW5nIHlvdSBjYW4gcGFzcyB0aGVcbiAgICAvLyBzdHJpbmcgb2YgY29kZSwgdGhlIGxhbmd1YWdlLCBhbmQgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyBSYWluYm93LmNvbG9yKGNvZGUsIGxhbmd1YWdlLCBmdW5jdGlvbihoaWdobGlnaHRlZENvZGUsIGxhbmd1YWdlKSB7XG4gICAgLy8gICAgIC8vIHRoaXMgY29kZSBibG9jayBpcyBub3cgaGlnaGxpZ2h0ZWRcbiAgICAvLyB9KTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHdvcmtlckRhdGEgPSBfZ2V0V29ya2VyRGF0YShhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICAgICAgX21lc3NhZ2VXb3JrZXIod29ya2VyRGF0YSwgKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgICBjYihkYXRhLnJlc3VsdCwgZGF0YS5sYW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KGFyZ3NbMl0pKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB5b3UgcGFzcyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoZW4gd2UgcmVydW4gdGhlIGNvbG9yIGZ1bmN0aW9uXG4gICAgLy8gb24gYWxsIHRoZSBjb2RlIGFuZCBjYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBvbiBjb21wbGV0ZS5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyBSYWluYm93LmNvbG9yKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZygnQWxsIG1hdGNoaW5nIHRhZ3Mgb24gdGhlIHBhZ2UgYXJlIG5vdyBoaWdobGlnaHRlZCcpO1xuICAgIC8vIH0pO1xuICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBfaGlnaGxpZ2h0KDAsIGFyZ3NbMF0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHdlIHVzZSB3aGF0ZXZlciBub2RlIHlvdSBwYXNzZWQgaW4gd2l0aCBhbiBvcHRpb25hbFxuICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyLlxuICAgIC8vXG4gICAgLy8gRXhhbXBsZTpcbiAgICAvL1xuICAgIC8vIHZhciBwcmVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XG4gICAgLy8gdmFyIGNvZGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY29kZScpO1xuICAgIC8vIGNvZGVFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1sYW5ndWFnZScsICdqYXZhc2NyaXB0Jyk7XG4gICAgLy8gY29kZUVsZW1lbnQuaW5uZXJIVE1MID0gJy8vIEhlcmUgaXMgc29tZSBKYXZhU2NyaXB0JztcbiAgICAvLyBwcmVFbGVtZW50LmFwcGVuZENoaWxkKGNvZGVFbGVtZW50KTtcbiAgICAvLyBSYWluYm93LmNvbG9yKHByZUVsZW1lbnQsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAvLyBOZXcgZWxlbWVudCBpcyBub3cgaGlnaGxpZ2h0ZWRcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIElmIHlvdSBkb24ndCBwYXNzIGFuIGVsZW1lbnQgaXQgd2lsbCBkZWZhdWx0IHRvIGBkb2N1bWVudGBcbiAgICBfaGlnaGxpZ2h0KGFyZ3NbMF0sIGFyZ3NbMV0pO1xufVxuXG4vKipcbiAqIE1ldGhvZCB0byBhZGQgYW4gYWxpYXMgZm9yIGFuIGV4aXN0aW5nIGxhbmd1YWdlLlxuICpcbiAqIEZvciBleGFtcGxlIGlmIHlvdSB3YW50IHRvIGhhdmUgXCJjb2ZmZWVcIiBtYXAgdG8gXCJjb2ZmZWVzY3JpcHRcIlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NjYW1wYmVsbC9yYWluYm93L2lzc3Vlcy8xNTRcbiAqIEBwYXJhbSB7c3RyaW5nfSBhbGlhc1xuICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsTGFuZ3VhZ2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGFkZEFsaWFzKGFsaWFzLCBvcmlnaW5hbExhbmd1YWdlKSB7XG4gICAgYWxpYXNlc1thbGlhc10gPSBvcmlnaW5hbExhbmd1YWdlO1xufVxuXG4vKipcbiAqIHB1YmxpYyBtZXRob2RzXG4gKi9cblJhaW5ib3cgPSB7XG4gICAgZXh0ZW5kLFxuICAgIHJlbW92ZSxcbiAgICBvbkhpZ2hsaWdodCxcbiAgICBhZGRBbGlhcyxcbiAgICBjb2xvclxufTtcblxuaWYgKGlzTm9kZSkge1xuICAgIFJhaW5ib3cuY29sb3JTeW5jID0gZnVuY3Rpb24oY29kZSwgbGFuZykge1xuICAgICAgICBjb25zdCB3b3JrZXJEYXRhID0gX2dldFdvcmtlckRhdGEoY29kZSwgbGFuZyk7XG4gICAgICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKHdvcmtlckRhdGEub3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBwcmlzbS5yZWZyYWN0KHdvcmtlckRhdGEuY29kZSwgd29ya2VyRGF0YS5sYW5nKTtcbiAgICB9O1xufVxuXG4vLyBJbiB0aGUgYnJvd3NlciBob29rIGl0IHVwIHRvIGNvbG9yIG9uIHBhZ2UgbG9hZFxuaWYgKCFpc05vZGUgJiYgIWlzV29ya2VyKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIVJhaW5ib3cuZGVmZXIpIHtcbiAgICAgICAgICAgIFJhaW5ib3cuY29sb3IoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSwgZmFsc2UpO1xufVxuXG4vLyBGcm9tIGEgbm9kZSB3b3JrZXIsIGhhbmRsZSB0aGUgcG9zdE1lc3NhZ2UgcmVxdWVzdHMgdG8gaXRcbmlmIChpc1dvcmtlcikge1xuICAgIHNlbGYub25tZXNzYWdlID0gcmFpbmJvd1dvcmtlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgUmFpbmJvdztcbiJdLCJuYW1lcyI6WyJpc05vZGUiLCJpc1dvcmtl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