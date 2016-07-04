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

        // This is an awful hack, but something to do with how uglify renames stuff
        // and rollup means that the variable the worker.js is using to reference
        // Prism will not be the same one available in this context
        var prismName = prismFunction.match(/function (\w+?)\(/)[1];
        var str = fn.toString();
        str = str.replace(/=new \w+/, ("= new " + prismName));

        var fullString = code + "\tthis.onmessage =" + str;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3ByaXNtLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9yYWluYm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICAvKiBnbG9iYWxzIG1vZHVsZSAqL1xuICAgIHJldHVybiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXb3JrZXIoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEdldHMgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGJsb2NrIG9mIGNvZGVcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJsb2NrXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spIHtcblxuICAgIC8vIElmIHRoaXMgZG9lc24ndCBoYXZlIGEgbGFuZ3VhZ2UgYnV0IHRoZSBwYXJlbnQgZG9lcyB0aGVuIHVzZSB0aGF0LlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBpZiBmb3IgZXhhbXBsZSB5b3UgaGF2ZTogPHByZSBkYXRhLWxhbmd1YWdlPVwicGhwXCI+XG4gICAgLy8gd2l0aCBhIGJ1bmNoIG9mIDxjb2RlPiBibG9ja3MgaW5zaWRlIHRoZW4geW91IGRvIG5vdCBoYXZlXG4gICAgLy8gdG8gc3BlY2lmeSB0aGUgbGFuZ3VhZ2UgZm9yIGVhY2ggYmxvY2suXG4gICAgbGV0IGxhbmd1YWdlID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJykgfHwgYmxvY2sucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnKTtcblxuICAgIC8vIFRoaXMgYWRkcyBzdXBwb3J0IGZvciBzcGVjaWZ5aW5nIGxhbmd1YWdlIHZpYSBhIENTUyBjbGFzcy5cbiAgICAvL1xuICAgIC8vIFlvdSBjYW4gdXNlIHRoZSBHb29nbGUgQ29kZSBQcmV0dGlmeSBzdHlsZTogPHByZSBjbGFzcz1cImxhbmctcGhwXCI+XG4gICAgLy8gb3IgdGhlIEhUTUw1IHN0eWxlOiA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtcGhwXCI+XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1xcYmxhbmcoPzp1YWdlKT8tKFxcdyspLztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBibG9jay5jbGFzc05hbWUubWF0Y2gocGF0dGVybikgfHwgYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBsYW5ndWFnZSA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGRpZmZlcmVudCBtYXRjaGVzIGhhdmUgY29tcGxldGUgb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXJcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQxICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICBlbmQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDIgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQyICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29tcGxldGVPdmVybGFwKHN0YXJ0MSwgZW5kMSwgc3RhcnQyLCBlbmQyKSB7XG5cbiAgICAvLyBJZiB0aGUgc3RhcnRpbmcgYW5kIGVuZCBwb3NpdGlvbnMgYXJlIGV4YWN0bHkgdGhlIHNhbWVcbiAgICAvLyB0aGVuIHRoZSBmaXJzdCBvbmUgc2hvdWxkIHN0YXkgYW5kIHRoaXMgb25lIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChzdGFydDIgPT09IHN0YXJ0MSAmJiBlbmQyID09PSBlbmQxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQyIDw9IHN0YXJ0MSAmJiBlbmQyID49IGVuZDE7XG59XG5cbi8qKlxuICogRW5jb2RlcyA8IGFuZCA+IGFzIGh0bWwgZW50aXRpZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaHRtbEVudGl0aWVzKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyYoPyFbXFx3XFwjXSs7KS9nLCAnJmFtcDsnKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvdXQgdGhlIHBvc2l0aW9uIG9mIGdyb3VwIG1hdGNoIGZvciBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICpcbiAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTg1NTk0L2hvdy10by1maW5kLWluZGV4LW9mLWdyb3Vwcy1pbi1tYXRjaFxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBOdW1iZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBOdW1iZXIpIHtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cE51bWJlcjsgKytpKSB7XG4gICAgICAgIGlmIChtYXRjaFtpXSkge1xuICAgICAgICAgICAgaW5kZXggKz0gbWF0Y2hbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBuZXcgbWF0Y2ggaW50ZXJzZWN0cyB3aXRoIGFuIGV4aXN0aW5nIG9uZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDEgICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICAgZW5kIHBvc2l0aW9uIG9mIGV4aXN0aW5nIG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQyICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZDIgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhzdGFydDEsIGVuZDEsIHN0YXJ0MiwgZW5kMikge1xuICAgIGlmIChzdGFydDIgPj0gc3RhcnQxICYmIHN0YXJ0MiA8IGVuZDEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuZDIgPiBzdGFydDEgJiYgZW5kMiA8IGVuZDE7XG59XG5cbi8qKlxuICogU29ydHMgYW4gb2JqZWN0cyBrZXlzIGJ5IGluZGV4IGRlc2NlbmRpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgbG9jYXRpb25zLnB1c2gobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbnVtZXJpYyBkZXNjZW5kaW5nXG4gICAgcmV0dXJuIGxvY2F0aW9ucy5zb3J0KChhLCBiKSA9PiBiIC0gYSk7XG59XG5cbi8qKlxuICogU3Vic3RyaW5nIHJlcGxhY2UgY2FsbCB0byByZXBsYWNlIHBhcnQgb2YgYSBzdHJpbmcgYXQgYSBjZXJ0YWluIHBvc2l0aW9uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uICAgICAgICAgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGhhcHBlblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2UgICAgICAgICAgdGhlIHRleHQgd2Ugd2FudCB0byByZXBsYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZVdpdGggICAgICB0aGUgdGV4dCB3ZSB3YW50IHRvIHJlcGxhY2UgaXQgd2l0aFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICAgICAgdGhlIGNvZGUgd2UgYXJlIGRvaW5nIHRoZSByZXBsYWNpbmcgaW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlLCByZXBsYWNlV2l0aCwgY29kZSkge1xuICAgIGNvbnN0IHN1YlN0cmluZyA9IGNvZGUuc3Vic3RyKHBvc2l0aW9uKTtcbiAgICByZXR1cm4gY29kZS5zdWJzdHIoMCwgcG9zaXRpb24pICsgc3ViU3RyaW5nLnJlcGxhY2UocmVwbGFjZSwgcmVwbGFjZVdpdGgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB1c2FibGUgd2ViIHdvcmtlciBmcm9tIGFuIGFub255bW91cyBmdW5jdGlvblxuICpcbiAqIG1vc3RseSBib3Jyb3dlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS96ZXZlcm8vd29ya2VyLWNyZWF0ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1ByaXNtfSBQcmlzbVxuICogQHJldHVybiB7V29ya2VyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV29ya2VyKGZuLCBQcmlzbSkge1xuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgICAvKiBnbG9iYWxzIGdsb2JhbCwgcmVxdWlyZSwgX19maWxlbmFtZSAqL1xuICAgICAgICBnbG9iYWwuV29ya2VyID0gcmVxdWlyZSgnd2Vid29ya2VyLXRocmVhZHMnKS5Xb3JrZXI7XG4gICAgICAgIHJldHVybiBuZXcgV29ya2VyKF9fZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHByaXNtRnVuY3Rpb24gPSBQcmlzbS50b1N0cmluZygpO1xuXG4gICAgbGV0IGNvZGUgPSBrZXlzLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBodG1sRW50aXRpZXMudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGhhc0NvbXBsZXRlT3ZlcmxhcC50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gaW50ZXJzZWN0cy50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gcmVwbGFjZUF0UG9zaXRpb24udG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGluZGV4T2ZHcm91cC50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gcHJpc21GdW5jdGlvbjtcblxuICAgIC8vIFRoaXMgaXMgYW4gYXdmdWwgaGFjaywgYnV0IHNvbWV0aGluZyB0byBkbyB3aXRoIGhvdyB1Z2xpZnkgcmVuYW1lcyBzdHVmZlxuICAgIC8vIGFuZCByb2xsdXAgbWVhbnMgdGhhdCB0aGUgdmFyaWFibGUgdGhlIHdvcmtlci5qcyBpcyB1c2luZyB0byByZWZlcmVuY2VcbiAgICAvLyBQcmlzbSB3aWxsIG5vdCBiZSB0aGUgc2FtZSBvbmUgYXZhaWxhYmxlIGluIHRoaXMgY29udGV4dFxuICAgIGNvbnN0IHByaXNtTmFtZSA9IHByaXNtRnVuY3Rpb24ubWF0Y2goL2Z1bmN0aW9uIChcXHcrPylcXCgvKVsxXTtcbiAgICBsZXQgc3RyID0gZm4udG9TdHJpbmcoKTtcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvPW5ldyBcXHcrLywgYD0gbmV3ICR7cHJpc21OYW1lfWApO1xuXG4gICAgY29uc3QgZnVsbFN0cmluZyA9IGAke2NvZGV9XFx0dGhpcy5vbm1lc3NhZ2UgPSR7c3RyfWA7XG5cbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2Z1bGxTdHJpbmddLCB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH0pO1xuICAgIHJldHVybiBuZXcgV29ya2VyKCh3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwpLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG59XG4iLCJpbXBvcnQgeyByZXBsYWNlQXRQb3NpdGlvbiwgaW5kZXhPZkdyb3VwLCBrZXlzLCBodG1sRW50aXRpZXMsIGhhc0NvbXBsZXRlT3ZlcmxhcCwgaW50ZXJzZWN0cyB9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogUHJpc20gaXMgYSBjbGFzcyB1c2VkIHRvIGhpZ2hsaWdodCBpbmRpdmlkdWFsIGJsb2NrcyBvZiBjb2RlXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIFByaXNtIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPYmplY3Qgb2YgcmVwbGFjZW1lbnRzIHRvIHByb2Nlc3MgYXQgdGhlIGVuZCBvZiB0aGUgcHJvY2Vzc2luZ1xuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRzID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExhbmd1YWdlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIFByaXNtIG9iamVjdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IGN1cnJlbnRMYW5ndWFnZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogT2JqZWN0IG9mIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb25zIG9mIGJsb2NrcyB0byBiZSByZXBsYWNlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRQb3NpdGlvbnMgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgbWF0Y2ggcGFzc2VkIGluIGZhbGxzIGluc2lkZSBvZiBhbiBleGlzdGluZyBtYXRjaC5cbiAgICAgICAgICogVGhpcyBwcmV2ZW50cyBhIHJlZ2V4IHBhdHRlcm4gZnJvbSBtYXRjaGluZyBpbnNpZGUgb2YgYW5vdGhlciBwYXR0ZXJuXG4gICAgICAgICAqIHRoYXQgbWF0Y2hlcyBhIGxhcmdlciBhbW91bnQgb2YgY29kZS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUgdGhpcyBwcmV2ZW50cyBhIGtleXdvcmQgZnJvbSBtYXRjaGluZyBgZnVuY3Rpb25gIGlmIHRoZXJlXG4gICAgICAgICAqIGlzIGFscmVhZHkgYSBtYXRjaCBmb3IgYGZ1bmN0aW9uICguKilgLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgICAgc3RhcnQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlbmQgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfbWF0Y2hJc0luc2lkZU90aGVyTWF0Y2goc3RhcnQsIGVuZCkge1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHJlcGxhY2VtZW50UG9zaXRpb25zKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gcGFyc2VJbnQoa2V5LCAxMCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGJsb2NrIGNvbXBsZXRlbHkgb3ZlcmxhcHMgd2l0aCBhbm90aGVyIGJsb2NrXG4gICAgICAgICAgICAgICAgLy8gdGhlbiB3ZSBzaG91bGQgcmVtb3ZlIHRoZSBvdGhlciBibG9jayBhbmQgcmV0dXJuIGBmYWxzZWAuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0NvbXBsZXRlT3ZlcmxhcChrZXksIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV0sIHN0YXJ0LCBlbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXBsYWNlbWVudFBvc2l0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVwbGFjZW1lbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdHMoa2V5LCByZXBsYWNlbWVudFBvc2l0aW9uc1trZXldLCBzdGFydCwgZW5kKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYWtlcyBhIHN0cmluZyBvZiBjb2RlIGFuZCB3cmFwcyBpdCBpbiBhIHNwYW4gdGFnIGJhc2VkIG9uIHRoZSBuYW1lXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lICAgICAgICBuYW1lIG9mIHRoZSBwYXR0ZXJuIChpZSBrZXl3b3JkLnJlZ2V4KVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSAgICAgICAgYmxvY2sgb2YgY29kZSB0byB3cmFwXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxDbGFzcyBjbGFzcyB0byBhcHBseSB0byBldmVyeSBzcGFuXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF93cmFwQ29kZUluU3BhbihuYW1lLCBjb2RlKSB7XG4gICAgICAgICAgICBsZXQgY2xhc3NOYW1lID0gbmFtZS5yZXBsYWNlKC9cXC4vZywgJyAnKTtcblxuICAgICAgICAgICAgY29uc3QgZ2xvYmFsQ2xhc3MgPSBvcHRpb25zLmdsb2JhbENsYXNzO1xuICAgICAgICAgICAgaWYgKGdsb2JhbENsYXNzKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lICs9IGAgJHtnbG9iYWxDbGFzc31gO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYDxzcGFuIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+JHtjb2RlfTwvc3Bhbj5gO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb2Nlc3MgcmVwbGFjZW1lbnRzIGluIHRoZSBzdHJpbmcgb2YgY29kZSB0byBhY3R1YWxseSB1cGRhdGVcbiAgICAgICAgICogdGhlIG1hcmt1cFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSAgICAgICAgIHRoZSBjb2RlIHRvIHByb2Nlc3MgcmVwbGFjZW1lbnRzIGluXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzUmVwbGFjZW1lbnRzKGNvZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IGtleXMocmVwbGFjZW1lbnRzKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcG9zaXRpb24gb2YgcG9zaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudHNbcG9zaXRpb25dO1xuICAgICAgICAgICAgICAgIGNvZGUgPSByZXBsYWNlQXRQb3NpdGlvbihwb3NpdGlvbiwgcmVwbGFjZW1lbnQucmVwbGFjZSwgcmVwbGFjZW1lbnQud2l0aCwgY29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdCBpcyBzbyB3ZSBjYW4gY3JlYXRlIGEgbmV3IHJlZ2V4IG9iamVjdCBmb3IgZWFjaCBjYWxsIHRvXG4gICAgICAgICAqIF9wcm9jZXNzUGF0dGVybiB0byBhdm9pZCBzdGF0ZSBjYXJyeWluZyBvdmVyIHdoZW4gcnVubmluZyBleGVjXG4gICAgICAgICAqIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgZ2xvYmFsIGZsYWcgc2hvdWxkIG5vdCBiZSBjYXJyaWVkIG92ZXIgYmVjYXVzZSB3ZSBhcmUgc2ltdWxhdGluZ1xuICAgICAgICAgKiBpdCBieSBwcm9jZXNzaW5nIHRoZSByZWdleCBpbiBhIGxvb3Agc28gd2Ugb25seSBjYXJlIGFib3V0IHRoZSBmaXJzdFxuICAgICAgICAgKiBtYXRjaCBpbiBlYWNoIHN0cmluZy4gVGhpcyBhbHNvIHNlZW1zIHRvIGltcHJvdmUgcGVyZm9ybWFuY2UgcXVpdGUgYVxuICAgICAgICAgKiBiaXQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7UmVnRXhwfSByZWdleFxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfY2xvbmVSZWdleChyZWdleCkge1xuICAgICAgICAgICAgbGV0IGZsYWdzID0gJyc7XG5cbiAgICAgICAgICAgIGlmIChyZWdleC5pZ25vcmVDYXNlKSB7XG4gICAgICAgICAgICAgICAgZmxhZ3MgKz0gJ2knO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVnZXgubXVsdGlsaW5lKSB7XG4gICAgICAgICAgICAgICAgZmxhZ3MgKz0gJ20nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChyZWdleC5zb3VyY2UsIGZsYWdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXRjaGVzIGEgcmVnZXggcGF0dGVybiBhZ2FpbnN0IGEgYmxvY2sgb2YgY29kZSwgZmluZHMgYWxsIG1hdGNoZXNcbiAgICAgICAgICogdGhhdCBzaG91bGQgYmUgcHJvY2Vzc2VkLCBhbmQgc3RvcmVzIHRoZSBwb3NpdGlvbnMgb2Ygd2hlcmUgdGhleVxuICAgICAgICAgKiBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aGluIHRoZSBzdHJpbmcuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgaXMgd2hlcmUgcHJldHR5IG11Y2ggYWxsIHRoZSB3b3JrIGlzIGRvbmUgYnV0IGl0IHNob3VsZCBub3RcbiAgICAgICAgICogYmUgY2FsbGVkIGRpcmVjdGx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcGF0dGVyblxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAgICAgICAqIEByZXR1cm4ge21peGVkfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NQYXR0ZXJuKHBhdHRlcm4sIGNvZGUsIG9mZnNldCA9IDApIHtcbiAgICAgICAgICAgIGxldCByZWdleCA9IHBhdHRlcm4ucGF0dGVybjtcbiAgICAgICAgICAgIGlmICghcmVnZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNpbmNlIHdlIGFyZSBzaW11bGF0aW5nIGdsb2JhbCByZWdleCBtYXRjaGluZyB3ZSBuZWVkIHRvIGFsc29cbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0byBzdG9wIGFmdGVyIG9uZSBtYXRjaCBpZiB0aGUgcGF0dGVybiBpcyBub3QgZ2xvYmFsXG4gICAgICAgICAgICBjb25zdCBzaG91bGRTdG9wID0gIXJlZ2V4Lmdsb2JhbDtcblxuICAgICAgICAgICAgcmVnZXggPSBfY2xvbmVSZWdleChyZWdleCk7XG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJlZ2V4LmV4ZWMoY29kZSk7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcmVhdCBtYXRjaCAwIHRoZSBzYW1lIHdheSBhcyBuYW1lXG4gICAgICAgICAgICBpZiAoIXBhdHRlcm4ubmFtZSAmJiBwYXR0ZXJuLm1hdGNoZXMgJiYgdHlwZW9mIHBhdHRlcm4ubWF0Y2hlc1swXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLm5hbWUgPSBwYXR0ZXJuLm1hdGNoZXNbMF07XG4gICAgICAgICAgICAgICAgZGVsZXRlIHBhdHRlcm4ubWF0Y2hlc1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHJlcGxhY2VtZW50ID0gbWF0Y2hbMF07XG4gICAgICAgICAgICBjb25zdCBzdGFydFBvcyA9IG1hdGNoLmluZGV4ICsgb2Zmc2V0O1xuICAgICAgICAgICAgY29uc3QgZW5kUG9zID0gbWF0Y2hbMF0ubGVuZ3RoICsgc3RhcnRQb3M7XG5cbiAgICAgICAgICAgIC8vIEluIHNvbWUgY2FzZXMgd2hlbiB0aGUgcmVnZXggbWF0Y2hlcyBhIGdyb3VwIHN1Y2ggYXMgXFxzKiBpdCBpc1xuICAgICAgICAgICAgLy8gcG9zc2libGUgZm9yIHRoZXJlIHRvIGJlIGEgbWF0Y2gsIGJ1dCBoYXZlIHRoZSBzdGFydCBwb3NpdGlvblxuICAgICAgICAgICAgLy8gZXF1YWwgdGhlIGVuZCBwb3NpdGlvbi4gSW4gdGhvc2UgY2FzZXMgd2Ugc2hvdWxkIGJlIGFibGUgdG8gc3RvcFxuICAgICAgICAgICAgLy8gbWF0Y2hpbmcuIE90aGVyd2lzZSB0aGlzIGNhbiBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgICAgICAgICBpZiAoc3RhcnRQb3MgPT09IGVuZFBvcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgYSBjaGlsZCBtYXRjaCBhbmQgaXQgZmFsbHMgaW5zaWRlIG9mIGFub3RoZXJcbiAgICAgICAgICAgIC8vIG1hdGNoIHRoYXQgYWxyZWFkeSBoYXBwZW5lZCB3ZSBzaG91bGQgc2tpcCBpdCBhbmQgY29udGludWVcbiAgICAgICAgICAgIC8vIHByb2Nlc3NpbmcuXG4gICAgICAgICAgICBpZiAoX21hdGNoSXNJbnNpZGVPdGhlck1hdGNoKHN0YXJ0UG9zLCBlbmRQb3MpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nOiBjb2RlLnN1YnN0cihlbmRQb3MgLSBvZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGVuZFBvc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsbGJhY2sgZm9yIHdoZW4gYSBtYXRjaCB3YXMgc3VjY2Vzc2Z1bGx5IHByb2Nlc3NlZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBsXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1hdGNoU3VjY2VzcyhyZXBsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIG1hdGNoIGhhcyBhIG5hbWUgdGhlbiB3cmFwIGl0IGluIGEgc3BhbiB0YWdcbiAgICAgICAgICAgICAgICBpZiAocGF0dGVybi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGwgPSBfd3JhcENvZGVJblNwYW4ocGF0dGVybi5uYW1lLCByZXBsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBGb3IgZGVidWdnaW5nXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1JlcGxhY2UgJyArIG1hdGNoWzBdICsgJyB3aXRoICcgKyByZXBsYWNlbWVudCArICcgYXQgcG9zaXRpb24gJyArIHN0YXJ0UG9zICsgJyB0byAnICsgZW5kUG9zKTtcblxuICAgICAgICAgICAgICAgIC8vIFN0b3JlIHdoYXQgbmVlZHMgdG8gYmUgcmVwbGFjZWQgd2l0aCB3aGF0IGF0IHRoaXMgcG9zaXRpb25cbiAgICAgICAgICAgICAgICByZXBsYWNlbWVudHNbc3RhcnRQb3NdID0ge1xuICAgICAgICAgICAgICAgICAgICAncmVwbGFjZSc6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAnd2l0aCc6IHJlcGxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlIHJhbmdlIG9mIHRoaXMgbWF0Y2ggc28gd2UgY2FuIHVzZSBpdCBmb3JcbiAgICAgICAgICAgICAgICAvLyBjb21wYXJpc29ucyB3aXRoIG90aGVyIG1hdGNoZXMgbGF0ZXIuXG4gICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQb3NpdGlvbnNbc3RhcnRQb3NdID0gZW5kUG9zO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZzogY29kZS5zdWJzdHIoZW5kUG9zIC0gb2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBlbmRQb3NcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhlbHBlciBmdW5jdGlvbiBmb3IgcHJvY2Vzc2luZyBhIHN1YiBncm91cFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBncm91cEtleSAgICAgIGluZGV4IG9mIGdyb3VwXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc0dyb3VwKGdyb3VwS2V5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvY2sgPSBtYXRjaFtncm91cEtleV07XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBtYXRjaCBoZXJlIHRoZW4gbW92ZSBvblxuICAgICAgICAgICAgICAgIGlmICghYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gcGF0dGVybi5tYXRjaGVzW2dyb3VwS2V5XTtcbiAgICAgICAgICAgICAgICBjb25zdCBsYW5ndWFnZSA9IGdyb3VwLmxhbmd1YWdlO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUHJvY2VzcyBncm91cCBpcyB3aGF0IGdyb3VwIHdlIHNob3VsZCB1c2UgdG8gYWN0dWFsbHkgcHJvY2Vzc1xuICAgICAgICAgICAgICAgICAqIHRoaXMgbWF0Y2ggZ3JvdXAuXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBGb3IgZXhhbXBsZSBpZiB0aGUgc3ViZ3JvdXAgcGF0dGVybiBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAyOiB7XG4gICAgICAgICAgICAgICAgICogICAgICduYW1lJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAqICAgICAncGF0dGVybic6IC90cnVlL2dcbiAgICAgICAgICAgICAgICAgKiB9XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiB0aGVuIHdlIHVzZSB0aGF0IGFzIGlzLCBidXQgaWYgaXQgbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogMjoge1xuICAgICAgICAgICAgICAgICAqICAgICAnbmFtZSc6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgICAgICAgKiAgICAgJ21hdGNoZXMnOiB7XG4gICAgICAgICAgICAgICAgICogICAgICAgICAgJ25hbWUnOiAnc3BlY2lhbCcsXG4gICAgICAgICAgICAgICAgICogICAgICAgICAgJ3BhdHRlcm4nOiAvd2hhdGV2ZXIvZ1xuICAgICAgICAgICAgICAgICAqICAgICAgfVxuICAgICAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIHdlIHRyZWF0IHRoZSAnbWF0Y2hlcycgcGFydCBhcyB0aGUgcGF0dGVybiBhbmQga2VlcFxuICAgICAgICAgICAgICAgICAqIHRoZSBuYW1lIGFyb3VuZCB0byB3cmFwIGl0IHdpdGggbGF0ZXJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBjb25zdCBncm91cFRvUHJvY2VzcyA9IGdyb3VwLm5hbWUgJiYgZ3JvdXAubWF0Y2hlcyA/IGdyb3VwLm1hdGNoZXMgOiBncm91cDtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRha2VzIHRoZSBjb2RlIGJsb2NrIG1hdGNoZWQgYXQgdGhpcyBncm91cCwgcmVwbGFjZXMgaXRcbiAgICAgICAgICAgICAgICAgKiB3aXRoIHRoZSBoaWdobGlnaHRlZCBibG9jaywgYW5kIG9wdGlvbmFsbHkgd3JhcHMgaXQgd2l0aFxuICAgICAgICAgICAgICAgICAqIGEgc3BhbiB3aXRoIGEgbmFtZVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3NlZEJsb2NrXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2VCbG9ja1xuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IG1hdGNoTmFtZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IF9nZXRSZXBsYWNlbWVudCA9IGZ1bmN0aW9uKHBhc3NlZEJsb2NrLCByZXBsYWNlQmxvY2ssIG1hdGNoTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXBsYWNlbWVudCA9IHJlcGxhY2VBdFBvc2l0aW9uKGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBLZXkpLCBwYXNzZWRCbG9jaywgbWF0Y2hOYW1lID8gX3dyYXBDb2RlSW5TcGFuKG1hdGNoTmFtZSwgcmVwbGFjZUJsb2NrKSA6IHJlcGxhY2VCbG9jaywgcmVwbGFjZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBzdHJpbmcgdGhlbiB0aGlzIG1hdGNoIGlzIGRpcmVjdGx5IG1hcHBlZFxuICAgICAgICAgICAgICAgIC8vIHRvIHNlbGVjdG9yIHNvIGFsbCB3ZSBoYXZlIHRvIGRvIGlzIHdyYXAgaXQgaW4gYSBzcGFuXG4gICAgICAgICAgICAgICAgLy8gYW5kIGNvbnRpbnVlLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ3JvdXAgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIF9nZXRSZXBsYWNlbWVudChibG9jaywgYmxvY2ssIGdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBsb2NhbENvZGU7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJpc20gPSBuZXcgUHJpc20ob3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgc3VibGFuZ3VhZ2UgZ28gYW5kIHByb2Nlc3MgdGhlIGJsb2NrIHVzaW5nXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBsYW5ndWFnZVxuICAgICAgICAgICAgICAgIGlmIChsYW5ndWFnZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbENvZGUgPSBwcmlzbS5yZWZyYWN0KGJsb2NrLCBsYW5ndWFnZSk7XG4gICAgICAgICAgICAgICAgICAgIF9nZXRSZXBsYWNlbWVudChibG9jaywgbG9jYWxDb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRoZSBwcm9jZXNzIGdyb3VwIGNhbiBiZSBhIHNpbmdsZSBwYXR0ZXJuIG9yIGFuIGFycmF5IG9mXG4gICAgICAgICAgICAgICAgLy8gcGF0dGVybnMuIGBfcHJvY2Vzc0NvZGVXaXRoUGF0dGVybnNgIGFsd2F5cyBleHBlY3RzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgLy8gc28gd2UgY29udmVydCBpdCBoZXJlLlxuICAgICAgICAgICAgICAgIGxvY2FsQ29kZSA9IHByaXNtLnJlZnJhY3QoYmxvY2ssIGN1cnJlbnRMYW5ndWFnZSwgZ3JvdXBUb1Byb2Nlc3MubGVuZ3RoID8gZ3JvdXBUb1Byb2Nlc3MgOiBbZ3JvdXBUb1Byb2Nlc3NdKTtcbiAgICAgICAgICAgICAgICBfZ2V0UmVwbGFjZW1lbnQoYmxvY2ssIGxvY2FsQ29kZSwgZ3JvdXAubWF0Y2hlcyA/IGdyb3VwLm5hbWUgOiAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBwYXR0ZXJuIGhhcyBzdWIgbWF0Y2hlcyBmb3IgZGlmZmVyZW50IGdyb3VwcyBpbiB0aGUgcmVnZXhcbiAgICAgICAgICAgIC8vIHRoZW4gd2Ugc2hvdWxkIHByb2Nlc3MgdGhlbSBvbmUgYXQgYSB0aW1lIGJ5IHJ1bm5pbmcgdGhlbSB0aHJvdWdoXG4gICAgICAgICAgICAvLyB0aGUgX3Byb2Nlc3NHcm91cCBmdW5jdGlvbiB0byBnZW5lcmF0ZSB0aGUgbmV3IHJlcGxhY2VtZW50LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFdlIHVzZSB0aGUgYGtleXNgIGZ1bmN0aW9uIHRvIHJ1biB0aHJvdWdoIHRoZW0gYmFja3dhcmRzIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIHRoZSBtYXRjaCBwb3NpdGlvbiBvZiBlYXJsaWVyIG1hdGNoZXMgd2lsbCBub3QgY2hhbmdlIGRlcGVuZGluZ1xuICAgICAgICAgICAgLy8gb24gd2hhdCBnZXRzIHJlcGxhY2VkIGluIGxhdGVyIG1hdGNoZXMuXG4gICAgICAgICAgICBjb25zdCBncm91cEtleXMgPSBrZXlzKHBhdHRlcm4ubWF0Y2hlcyk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGdyb3VwS2V5IG9mIGdyb3VwS2V5cykge1xuICAgICAgICAgICAgICAgIF9wcm9jZXNzR3JvdXAoZ3JvdXBLZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaW5hbGx5LCBjYWxsIGBvbk1hdGNoU3VjY2Vzc2Agd2l0aCB0aGUgcmVwbGFjZW1lbnRcbiAgICAgICAgICAgIHJldHVybiBvbk1hdGNoU3VjY2VzcyhyZXBsYWNlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvY2Vzc2VzIGEgYmxvY2sgb2YgY29kZSB1c2luZyBzcGVjaWZpZWQgcGF0dGVybnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gcGF0dGVybnNcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NDb2RlV2l0aFBhdHRlcm5zKGNvZGUsIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gX3Byb2Nlc3NQYXR0ZXJuKHBhdHRlcm4sIGNvZGUpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gX3Byb2Nlc3NQYXR0ZXJuKHBhdHRlcm4sIHJlc3VsdC5yZW1haW5pbmcsIHJlc3VsdC5vZmZzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2UgYXJlIGRvbmUgcHJvY2Vzc2luZyB0aGUgcGF0dGVybnMgc28gd2Ugc2hvdWxkIGFjdHVhbGx5IHJlcGxhY2VcbiAgICAgICAgICAgIC8vIHdoYXQgbmVlZHMgdG8gYmUgcmVwbGFjZWQgaW4gdGhlIGNvZGUuXG4gICAgICAgICAgICByZXR1cm4gX3Byb2Nlc3NSZXBsYWNlbWVudHMoY29kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIGxpc3Qgb2YgcmVnZXggcGF0dGVybnMgZm9yIHRoaXMgbGFuZ3VhZ2VcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0UGF0dGVybnNGb3JMYW5ndWFnZShsYW5ndWFnZSkge1xuICAgICAgICAgICAgbGV0IHBhdHRlcm5zID0gb3B0aW9ucy5wYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW107XG4gICAgICAgICAgICB3aGlsZSAob3B0aW9ucy5pbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0pIHtcbiAgICAgICAgICAgICAgICBsYW5ndWFnZSA9IG9wdGlvbnMuaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdO1xuICAgICAgICAgICAgICAgIHBhdHRlcm5zID0gcGF0dGVybnMuY29uY2F0KG9wdGlvbnMucGF0dGVybnNbbGFuZ3VhZ2VdIHx8IFtdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBhdHRlcm5zO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRha2VzIGEgc3RyaW5nIG9mIGNvZGUgYW5kIGhpZ2hsaWdodHMgaXQgYWNjb3JkaW5nIHRvIHRoZSBsYW5ndWFnZVxuICAgICAgICAgKiBzcGVjaWZpZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXR0ZXJucyBvcHRpb25hbGx5IHNwZWNpZnkgYSBsaXN0IG9mIHBhdHRlcm5zXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9oaWdobGlnaHRCbG9ja0Zvckxhbmd1YWdlKGNvZGUsIGxhbmd1YWdlLCBwYXR0ZXJucykge1xuICAgICAgICAgICAgY3VycmVudExhbmd1YWdlID0gbGFuZ3VhZ2U7XG4gICAgICAgICAgICBwYXR0ZXJucyA9IHBhdHRlcm5zIHx8IGdldFBhdHRlcm5zRm9yTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgICAgICAgICAgcmV0dXJuIF9wcm9jZXNzQ29kZVdpdGhQYXR0ZXJucyhodG1sRW50aXRpZXMoY29kZSksIHBhdHRlcm5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVmcmFjdCA9IF9oaWdobGlnaHRCbG9ja0Zvckxhbmd1YWdlO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUHJpc207XG4iLCJpbXBvcnQgUHJpc20gZnJvbSAnLi9wcmlzbSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJhaW5ib3dXb3JrZXIoZSkge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBlLmRhdGE7XG5cbiAgICBjb25zdCBwcmlzbSA9IG5ldyBQcmlzbShtZXNzYWdlLm9wdGlvbnMpO1xuICAgIGNvbnN0IHJlc3VsdCA9IHByaXNtLnJlZnJhY3QobWVzc2FnZS5jb2RlLCBtZXNzYWdlLmxhbmcpO1xuXG4gICAgZnVuY3Rpb24gX3JlcGx5KCkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGlkOiBtZXNzYWdlLmlkLFxuICAgICAgICAgICAgbGFuZzogbWVzc2FnZS5sYW5nLFxuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEkgcmVhbGl6ZWQgZG93biB0aGUgcm9hZCBJIG1pZ2h0IGxvb2sgYXQgdGhpcyBhbmQgd29uZGVyIHdoYXQgaXMgZ29pbmcgb25cbiAgICAvLyBzbyBwcm9iYWJseSBpdCBpcyBub3QgYSBiYWQgaWRlYSB0byBsZWF2ZSBhIGNvbW1lbnQuXG4gICAgLy9cbiAgICAvLyBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHJpZ2h0IG5vdyB0aGUgbm9kZSBsaWJyYXJ5IGZvciBzaW11bGF0aW5nIHdlYlxuICAgIC8vIHdvcmtlcnMg4oCcd2Vid29ya2VyLXRocmVhZHPigJ0gd2lsbCBrZWVwIHRoZSB3b3JrZXIgb3BlbiBhbmQgaXQgY2F1c2VzXG4gICAgLy8gc2NyaXB0cyBydW5uaW5nIGZyb20gdGhlIGNvbW1hbmQgbGluZSB0byBoYW5nIHVubGVzcyB0aGUgd29ya2VyIGlzXG4gICAgLy8gZXhwbGljaXRseSBjbG9zZWQuXG4gICAgLy9cbiAgICAvLyBUaGlzIG1lYW5zIGZvciBub2RlIHdlIHdpbGwgc3Bhd24gYSBuZXcgdGhyZWFkIGZvciBldmVyeSBhc3luY2hyb25vdXNcbiAgICAvLyBibG9jayB3ZSBhcmUgaGlnaGxpZ2h0aW5nLCBidXQgaW4gdGhlIGJyb3dzZXIgd2Ugd2lsbCBrZWVwIGEgc2luZ2xlXG4gICAgLy8gd29ya2VyIG9wZW4gZm9yIGFsbCByZXF1ZXN0cy5cbiAgICBpZiAobWVzc2FnZS5pc05vZGUpIHtcbiAgICAgICAgX3JlcGx5KCk7XG4gICAgICAgIHNlbGYuY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBfcmVwbHkoKTtcbiAgICB9LCBtZXNzYWdlLm9wdGlvbnMuZGVsYXkgKiAxMDAwKTtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBDcmFpZyBDYW1wYmVsbFxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqIFJhaW5ib3cgaXMgYSBzaW1wbGUgY29kZSBzeW50YXggaGlnaGxpZ2h0ZXJcbiAqXG4gKiBAc2VlIHJhaW5ib3djby5kZVxuICovXG5pbXBvcnQgUHJpc20gZnJvbSAnLi9wcmlzbSc7XG5pbXBvcnQgeyBpc05vZGUgYXMgdXRpbElzTm9kZSwgaXNXb3JrZXIgYXMgdXRpbElzV29ya2VyLCBjcmVhdGVXb3JrZXIsIGdldExhbmd1YWdlRm9yQmxvY2sgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHJhaW5ib3dXb3JrZXIgZnJvbSAnLi93b3JrZXInO1xuXG4vKipcbiAqIEFuIGFycmF5IG9mIHRoZSBsYW5ndWFnZSBwYXR0ZXJucyBzcGVjaWZpZWQgZm9yIGVhY2ggbGFuZ3VhZ2VcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCBwYXR0ZXJucyA9IHt9O1xuXG4vKipcbiAqIEFuIG9iamVjdCBvZiBsYW5ndWFnZXMgbWFwcGluZyB0byB3aGF0IGxhbmd1YWdlIHRoZXkgc2hvdWxkIGluaGVyaXQgZnJvbVxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmNvbnN0IGluaGVyaXRlbmNlTWFwID0ge307XG5cbi8qKlxuICogQSBtYXBwaW5nIG9mIGxhbmd1YWdlIGFsaWFzZXNcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCBhbGlhc2VzID0ge307XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgdGhlIGFjdHVhbCByYWluYm93IG9iamVjdFxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmxldCBSYWluYm93ID0ge307XG5cbi8qKlxuICogQ2FsbGJhY2sgdG8gZmlyZSBhZnRlciBlYWNoIGJsb2NrIGlzIGhpZ2hsaWdodGVkXG4gKlxuICogQHR5cGUge251bGx8RnVuY3Rpb259XG4gKi9cbmxldCBvbkhpZ2hsaWdodENhbGxiYWNrO1xuXG5jb25zdCBpc05vZGUgPSB1dGlsSXNOb2RlKCk7XG5jb25zdCBpc1dvcmtlciA9IHV0aWxJc1dvcmtlcigpO1xuXG5sZXQgY2FjaGVkV29ya2VyID0gbnVsbDtcbmZ1bmN0aW9uIF9nZXRXb3JrZXIoKSB7XG4gICAgaWYgKGlzTm9kZSB8fCBjYWNoZWRXb3JrZXIgPT09IG51bGwpIHtcbiAgICAgICAgY2FjaGVkV29ya2VyID0gY3JlYXRlV29ya2VyKHJhaW5ib3dXb3JrZXIsIFByaXNtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FjaGVkV29ya2VyO1xufVxuXG4vKipcbiAqIEhlbHBlciBmb3IgbWF0Y2hpbmcgdXAgY2FsbGJhY2tzIGRpcmVjdGx5IHdpdGggdGhlXG4gKiBwb3N0IG1lc3NhZ2UgcmVxdWVzdHMgdG8gYSB3ZWIgd29ya2VyLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBtZXNzYWdlICAgICAgZGF0YSB0byBzZW5kIHRvIHdlYiB3b3JrZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrICAgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHdvcmtlciB0byByZXBseSB0b1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX21lc3NhZ2VXb3JrZXIobWVzc2FnZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCB3b3JrZXIgPSBfZ2V0V29ya2VyKCk7XG5cbiAgICBmdW5jdGlvbiBfbGlzdGVuKGUpIHtcbiAgICAgICAgaWYgKGUuZGF0YS5pZCA9PT0gbWVzc2FnZS5pZCkge1xuICAgICAgICAgICAgY2FsbGJhY2soZS5kYXRhKTtcbiAgICAgICAgICAgIHdvcmtlci5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgX2xpc3Rlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF9saXN0ZW4pO1xuICAgIHdvcmtlci5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBCcm93c2VyIE9ubHkgLSBIYW5kbGVzIHJlc3BvbnNlIGZyb20gd2ViIHdvcmtlciwgdXBkYXRlcyBET00gd2l0aFxuICogcmVzdWx0aW5nIGNvZGUsIGFuZCBmaXJlcyBjYWxsYmFja1xuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtvYmplY3R9IHdhaXRpbmdPblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9nZW5lcmF0ZUhhbmRsZXIoZWxlbWVudCwgd2FpdGluZ09uLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiBfaGFuZGxlUmVzcG9uc2VGcm9tV29ya2VyKGRhdGEpIHtcbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBkYXRhLnJlc3VsdDtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnQucGFyZW50Tm9kZS50YWdOYW1lID09PSAnUFJFJykge1xuICAgICAgICAgICAgZWxlbWVudC5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uZW5kJywgKGUpID0+IHtcbiAgICAgICAgLy8gICAgIGlmIChlLmFuaW1hdGlvbk5hbWUgPT09ICdmYWRlLWluJykge1xuICAgICAgICAvLyAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAvLyAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2RlY3JlYXNlLWRlbGF5Jyk7XG4gICAgICAgIC8vICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIGlmIChvbkhpZ2hsaWdodENhbGxiYWNrKSB7XG4gICAgICAgICAgICBvbkhpZ2hsaWdodENhbGxiYWNrKGVsZW1lbnQsIGRhdGEubGFuZyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoLS13YWl0aW5nT24uYyA9PT0gMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8qKlxuICogR2V0cyBvcHRpb25zIG5lZWRlZCB0byBwYXNzIGludG8gUHJpc21cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBfZ2V0UHJpc21PcHRpb25zKG9wdGlvbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBwYXR0ZXJucyxcbiAgICAgICAgaW5oZXJpdGVuY2VNYXAsXG4gICAgICAgIGFsaWFzZXMsXG4gICAgICAgIGdsb2JhbENsYXNzOiBvcHRpb25zLmdsb2JhbENsYXNzLFxuICAgICAgICBkZWxheTogIWlzTmFOKG9wdGlvbnMuZGVsYXkpID8gb3B0aW9ucy5kZWxheSA6IDBcbiAgICB9O1xufVxuXG4vKipcbiAqIEdldHMgZGF0YSB0byBzZW5kIHRvIHdlYndvcmtlclxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHBhcmFtICB7c3RyaW5nfSBsYW5nXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIF9nZXRXb3JrZXJEYXRhKGNvZGUsIGxhbmcpIHtcbiAgICBsZXQgb3B0aW9ucyA9IHt9O1xuICAgIGlmICh0eXBlb2YgbGFuZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgb3B0aW9ucyA9IGxhbmc7XG4gICAgICAgIGxhbmcgPSBvcHRpb25zLmxhbmd1YWdlO1xuICAgIH1cblxuICAgIGxhbmcgPSBhbGlhc2VzW2xhbmddIHx8IGxhbmc7XG5cbiAgICBjb25zdCB3b3JrZXJEYXRhID0ge1xuICAgICAgICBpZDogU3RyaW5nLmZyb21DaGFyQ29kZSg2NSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI2KSkgKyBEYXRlLm5vdygpLFxuICAgICAgICBjb2RlLFxuICAgICAgICBsYW5nLFxuICAgICAgICBvcHRpb25zOiBfZ2V0UHJpc21PcHRpb25zKG9wdGlvbnMpLFxuICAgICAgICBpc05vZGVcbiAgICB9O1xuXG4gICAgcmV0dXJuIHdvcmtlckRhdGE7XG59XG5cbi8qKlxuICogQnJvd3NlciBPbmx5IC0gU2VuZHMgbWVzc2FnZXMgdG8gd2ViIHdvcmtlciB0byBoaWdobGlnaHQgZWxlbWVudHMgcGFzc2VkXG4gKiBpblxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGNvZGVCbG9ja3NcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfaGlnaGxpZ2h0Q29kZUJsb2Nrcyhjb2RlQmxvY2tzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHdhaXRpbmdPbiA9IHsgYzogMCB9O1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgY29kZUJsb2Nrcykge1xuICAgICAgICBjb25zdCBsYW5ndWFnZSA9IGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spO1xuICAgICAgICBpZiAoYmxvY2suY2xhc3NMaXN0LmNvbnRhaW5zKCdyYWluYm93JykgfHwgIWxhbmd1YWdlKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoaXMgY2FuY2VscyB0aGUgcGVuZGluZyBhbmltYXRpb24gdG8gZmFkZSB0aGUgY29kZSBpbiBvbiBsb2FkXG4gICAgICAgIC8vIHNpbmNlIHdlIHdhbnQgdG8gZGVsYXkgZG9pbmcgdGhpcyB1bnRpbCBpdCBpcyBhY3R1YWxseVxuICAgICAgICAvLyBoaWdobGlnaHRlZFxuICAgICAgICBibG9jay5jbGFzc0xpc3QuYWRkKCdsb2FkaW5nJyk7XG4gICAgICAgIGJsb2NrLmNsYXNzTGlzdC5hZGQoJ3JhaW5ib3cnKTtcblxuICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0byBhbHNvIGFkZCB0aGUgbG9hZGluZyBjbGFzcyB0byB0aGUgcHJlIHRhZ1xuICAgICAgICAvLyBiZWNhdXNlIHRoYXQgaXMgaG93IHdlIHdpbGwga25vdyB0byBzaG93IGEgcHJlbG9hZGVyXG4gICAgICAgIGlmIChibG9jay5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdQUkUnKSB7XG4gICAgICAgICAgICBibG9jay5wYXJlbnROb2RlLmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdsb2JhbENsYXNzID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWdsb2JhbC1jbGFzcycpO1xuICAgICAgICBjb25zdCBkZWxheSA9IHBhcnNlSW50KGJsb2NrLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWxheScpLCAxMCk7XG5cbiAgICAgICAgKyt3YWl0aW5nT24uYztcbiAgICAgICAgX21lc3NhZ2VXb3JrZXIoX2dldFdvcmtlckRhdGEoYmxvY2suaW5uZXJIVE1MLCB7IGxhbmd1YWdlLCBnbG9iYWxDbGFzcywgZGVsYXkgfSksIF9nZW5lcmF0ZUhhbmRsZXIoYmxvY2ssIHdhaXRpbmdPbiwgY2FsbGJhY2spKTtcbiAgICB9XG5cbiAgICBpZiAod2FpdGluZ09uLmMgPT09IDApIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIF9hZGRQcmVsb2FkZXIocHJlQmxvY2spIHtcbiAgICBjb25zdCBwcmVsb2FkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwcmVsb2FkZXIuY2xhc3NOYW1lID0gJ3ByZWxvYWRlcic7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgcHJlbG9hZGVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTtcbiAgICB9XG4gICAgcHJlQmxvY2suYXBwZW5kQ2hpbGQocHJlbG9hZGVyKTtcbn1cblxuLyoqXG4gKiBCcm93c2VyIE9ubHkgLSBTdGFydCBoaWdobGlnaHRpbmcgYWxsIHRoZSBjb2RlIGJsb2Nrc1xuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gbm9kZSAgICAgICBIVE1MRWxlbWVudCB0byBzZWFyY2ggd2l0aGluXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX2hpZ2hsaWdodChub2RlLCBjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24oKSB7fTtcblxuICAgIC8vIFRoZSBmaXJzdCBhcmd1bWVudCBjYW4gYmUgYW4gRXZlbnQgb3IgYSBET00gRWxlbWVudC5cbiAgICAvL1xuICAgIC8vIEkgd2FzIG9yaWdpbmFsbHkgY2hlY2tpbmcgaW5zdGFuY2VvZiBFdmVudCBidXQgdGhhdCBtYWRlIGl0IGJyZWFrXG4gICAgLy8gd2hlbiB1c2luZyBtb290b29scy5cbiAgICAvL1xuICAgIC8vIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NjYW1wYmVsbC9yYWluYm93L2lzc3Vlcy8zMlxuICAgIG5vZGUgPSBub2RlICYmIHR5cGVvZiBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lID09PSAnZnVuY3Rpb24nID8gbm9kZSA6IGRvY3VtZW50O1xuXG4gICAgY29uc3QgcHJlQmxvY2tzID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJyk7XG4gICAgY29uc3QgY29kZUJsb2NrcyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKTtcbiAgICBjb25zdCBmaW5hbFByZUJsb2NrcyA9IFtdO1xuICAgIGNvbnN0IGZpbmFsQ29kZUJsb2NrcyA9IFtdO1xuXG4gICAgLy8gRmlyc3QgbG9vcCB0aHJvdWdoIGFsbCBwcmUgYmxvY2tzIHRvIGZpbmQgd2hpY2ggb25lcyB0byBoaWdobGlnaHRcbiAgICBmb3IgKGNvbnN0IHByZUJsb2NrIG9mIHByZUJsb2Nrcykge1xuICAgICAgICBfYWRkUHJlbG9hZGVyKHByZUJsb2NrKTtcblxuICAgICAgICAvLyBTdHJpcCB3aGl0ZXNwYWNlIGFyb3VuZCBjb2RlIHRhZ3Mgd2hlbiB0aGV5IGFyZSBpbnNpZGUgb2YgYSBwcmVcbiAgICAgICAgLy8gdGFnLiAgVGhpcyBtYWtlcyB0aGUgdGhlbWVzIGxvb2sgYmV0dGVyIGJlY2F1c2UgeW91IGNhbid0XG4gICAgICAgIC8vIGFjY2lkZW50YWxseSBhZGQgZXh0cmEgbGluZWJyZWFrcyBhdCB0aGUgc3RhcnQgYW5kIGVuZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2hlbiB0aGUgcHJlIHRhZyBjb250YWlucyBhIGNvZGUgdGFnIHRoZW4gc3RyaXAgYW55IGV4dHJhXG4gICAgICAgIC8vIHdoaXRlc3BhY2UuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEZvciBleGFtcGxlOlxuICAgICAgICAvL1xuICAgICAgICAvLyA8cHJlPlxuICAgICAgICAvLyAgICAgIDxjb2RlPnZhciBmb28gPSB0cnVlOzwvY29kZT5cbiAgICAgICAgLy8gPC9wcmU+XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHdpbGwgYmVjb21lOlxuICAgICAgICAvL1xuICAgICAgICAvLyA8cHJlPjxjb2RlPnZhciBmb28gPSB0cnVlOzwvY29kZT48L3ByZT5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgeW91IHdhbnQgdG8gcHJlc2VydmUgd2hpdGVzcGFjZSB5b3UgY2FuIHVzZSBhIHByZSB0YWcgb25cbiAgICAgICAgLy8gaXRzIG93biB3aXRob3V0IGEgY29kZSB0YWcgaW5zaWRlIG9mIGl0LlxuICAgICAgICBpZiAocHJlQmxvY2suZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKS5sZW5ndGgpIHtcblxuICAgICAgICAgICAgLy8gVGhpcyBmaXhlcyBhIHJhY2UgY29uZGl0aW9uIHdoZW4gUmFpbmJvdy5jb2xvciBpcyBjYWxsZWQgYmVmb3JlXG4gICAgICAgICAgICAvLyB0aGUgcHJldmlvdXMgY29sb3IgY2FsbCBoYXMgZmluaXNoZWQuXG4gICAgICAgICAgICBpZiAoIXByZUJsb2NrLmdldEF0dHJpYnV0ZSgnZGF0YS10cmltbWVkJykpIHtcbiAgICAgICAgICAgICAgICBwcmVCbG9jay5zZXRBdHRyaWJ1dGUoJ2RhdGEtdHJpbW1lZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgIHByZUJsb2NrLmlubmVySFRNTCA9IHByZUJsb2NrLmlubmVySFRNTC50cmltKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBwcmUgYmxvY2sgaGFzIG5vIGNvZGUgYmxvY2tzIHRoZW4gd2UgYXJlIGdvaW5nIHRvIHdhbnQgdG9cbiAgICAgICAgLy8gcHJvY2VzcyBpdCBkaXJlY3RseS5cbiAgICAgICAgZmluYWxQcmVCbG9ja3MucHVzaChwcmVCbG9jayk7XG4gICAgfVxuXG4gICAgLy8gQHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI3MzUwNjcvaG93LXRvLWNvbnZlcnQtYS1kb20tbm9kZS1saXN0LXRvLWFuLWFycmF5LWluLWphdmFzY3JpcHRcbiAgICAvLyBXZSBhcmUgZ29pbmcgdG8gcHJvY2VzcyBhbGwgPGNvZGU+IGJsb2Nrc1xuICAgIGZvciAoY29uc3QgY29kZUJsb2NrIG9mIGNvZGVCbG9ja3MpIHtcbiAgICAgICAgZmluYWxDb2RlQmxvY2tzLnB1c2goY29kZUJsb2NrKTtcbiAgICB9XG5cbiAgICBfaGlnaGxpZ2h0Q29kZUJsb2NrcyhmaW5hbENvZGVCbG9ja3MuY29uY2F0KGZpbmFsUHJlQmxvY2tzKSwgY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIENhbGxiYWNrIHRvIGxldCB5b3UgZG8gc3R1ZmYgaW4geW91ciBhcHAgYWZ0ZXIgYSBwaWVjZSBvZiBjb2RlIGhhc1xuICogYmVlbiBoaWdobGlnaHRlZFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBvbkhpZ2hsaWdodChjYWxsYmFjaykge1xuICAgIG9uSGlnaGxpZ2h0Q2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuLyoqXG4gKiBFeHRlbmRzIHRoZSBsYW5ndWFnZSBwYXR0ZXJuIG1hdGNoZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgICAgICAgICAgICBuYW1lIG9mIGxhbmd1YWdlXG4gKiBAcGFyYW0ge29iamVjdH0gbGFuZ3VhZ2VQYXR0ZXJucyAgICBvYmplY3Qgb2YgcGF0dGVybnMgdG8gYWRkIG9uXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGluaGVyaXRzICBvcHRpb25hbCBsYW5ndWFnZSB0aGF0IHRoaXMgbGFuZ3VhZ2VcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBpbmhlcml0IHJ1bGVzIGZyb21cbiAqL1xuZnVuY3Rpb24gZXh0ZW5kKGxhbmd1YWdlLCBsYW5ndWFnZVBhdHRlcm5zLCBpbmhlcml0cykge1xuXG4gICAgLy8gSWYgd2UgZXh0ZW5kIGEgbGFuZ3VhZ2UgYWdhaW4gd2Ugc2hvdWxkbid0IG5lZWQgdG8gc3BlY2lmeSB0aGVcbiAgICAvLyBpbmhlcml0ZW5jZSBmb3IgaXQuIEZvciBleGFtcGxlLCBpZiB5b3UgYXJlIGFkZGluZyBzcGVjaWFsIGhpZ2hsaWdodGluZ1xuICAgIC8vIGZvciBhIGphdmFzY3JpcHQgZnVuY3Rpb24gdGhhdCBpcyBub3QgaW4gdGhlIGJhc2UgamF2YXNjcmlwdCBydWxlcywgeW91XG4gICAgLy8gc2hvdWxkIGJlIGFibGUgdG8gZG9cbiAgICAvL1xuICAgIC8vIFJhaW5ib3cuZXh0ZW5kKCdqYXZhc2NyaXB0JywgWyDigKYgXSk7XG4gICAgLy9cbiAgICAvLyBXaXRob3V0IHNwZWNpZnlpbmcgYSBsYW5ndWFnZSBpdCBzaG91bGQgaW5oZXJpdCAoZ2VuZXJpYyBpbiB0aGlzIGNhc2UpXG4gICAgaWYgKCFpbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0pIHtcbiAgICAgICAgaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdID0gaW5oZXJpdHM7XG4gICAgfVxuXG4gICAgcGF0dGVybnNbbGFuZ3VhZ2VdID0gbGFuZ3VhZ2VQYXR0ZXJucy5jb25jYXQocGF0dGVybnNbbGFuZ3VhZ2VdIHx8IFtdKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGxhbmd1YWdlKSB7XG4gICAgZGVsZXRlIGluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXTtcbiAgICBkZWxldGUgcGF0dGVybnNbbGFuZ3VhZ2VdO1xufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgbWFnaWMgcmFpbmJvd1xuICpcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGNvbG9yKC4uLmFyZ3MpIHtcblxuICAgIC8vIElmIHlvdSB3YW50IHRvIHN0cmFpZ2h0IHVwIGhpZ2hsaWdodCBhIHN0cmluZyB5b3UgY2FuIHBhc3MgdGhlXG4gICAgLy8gc3RyaW5nIG9mIGNvZGUsIHRoZSBsYW5ndWFnZSwgYW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5jb2xvcihjb2RlLCBsYW5ndWFnZSwgZnVuY3Rpb24oaGlnaGxpZ2h0ZWRDb2RlLCBsYW5ndWFnZSkge1xuICAgIC8vICAgICAvLyB0aGlzIGNvZGUgYmxvY2sgaXMgbm93IGhpZ2hsaWdodGVkXG4gICAgLy8gfSk7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCB3b3JrZXJEYXRhID0gX2dldFdvcmtlckRhdGEoYXJnc1swXSwgYXJnc1sxXSk7XG4gICAgICAgIF9tZXNzYWdlV29ya2VyKHdvcmtlckRhdGEsIChmdW5jdGlvbihjYikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZGF0YS5yZXN1bHQsIGRhdGEubGFuZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfShhcmdzWzJdKSkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgeW91IHBhc3MgYSBjYWxsYmFjayBmdW5jdGlvbiB0aGVuIHdlIHJlcnVuIHRoZSBjb2xvciBmdW5jdGlvblxuICAgIC8vIG9uIGFsbCB0aGUgY29kZSBhbmQgY2FsbCB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gb24gY29tcGxldGUuXG4gICAgLy9cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5jb2xvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coJ0FsbCBtYXRjaGluZyB0YWdzIG9uIHRoZSBwYWdlIGFyZSBub3cgaGlnaGxpZ2h0ZWQnKTtcbiAgICAvLyB9KTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgX2hpZ2hsaWdodCgwLCBhcmdzWzBdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSB3ZSB1c2Ugd2hhdGV2ZXIgbm9kZSB5b3UgcGFzc2VkIGluIHdpdGggYW4gb3B0aW9uYWxcbiAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlci5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyB2YXIgcHJlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICAgIC8vIHZhciBjb2RlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcbiAgICAvLyBjb2RlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnLCAnamF2YXNjcmlwdCcpO1xuICAgIC8vIGNvZGVFbGVtZW50LmlubmVySFRNTCA9ICcvLyBIZXJlIGlzIHNvbWUgSmF2YVNjcmlwdCc7XG4gICAgLy8gcHJlRWxlbWVudC5hcHBlbmRDaGlsZChjb2RlRWxlbWVudCk7XG4gICAgLy8gUmFpbmJvdy5jb2xvcihwcmVFbGVtZW50LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgLy8gTmV3IGVsZW1lbnQgaXMgbm93IGhpZ2hsaWdodGVkXG4gICAgLy8gfSk7XG4gICAgLy9cbiAgICAvLyBJZiB5b3UgZG9uJ3QgcGFzcyBhbiBlbGVtZW50IGl0IHdpbGwgZGVmYXVsdCB0byBgZG9jdW1lbnRgXG4gICAgX2hpZ2hsaWdodChhcmdzWzBdLCBhcmdzWzFdKTtcbn1cblxuLyoqXG4gKiBNZXRob2QgdG8gYWRkIGFuIGFsaWFzIGZvciBhbiBleGlzdGluZyBsYW5ndWFnZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB5b3Ugd2FudCB0byBoYXZlIFwiY29mZmVlXCIgbWFwIHRvIFwiY29mZmVlc2NyaXB0XCJcbiAqXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jY2FtcGJlbGwvcmFpbmJvdy9pc3N1ZXMvMTU0XG4gKiBAcGFyYW0ge3N0cmluZ30gYWxpYXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcmlnaW5hbExhbmd1YWdlXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBhZGRBbGlhcyhhbGlhcywgb3JpZ2luYWxMYW5ndWFnZSkge1xuICAgIGFsaWFzZXNbYWxpYXNdID0gb3JpZ2luYWxMYW5ndWFnZTtcbn1cblxuLyoqXG4gKiBwdWJsaWMgbWV0aG9kc1xuICovXG5SYWluYm93ID0ge1xuICAgIGV4dGVuZCxcbiAgICByZW1vdmUsXG4gICAgb25IaWdobGlnaHQsXG4gICAgYWRkQWxpYXMsXG4gICAgY29sb3Jcbn07XG5cbmlmIChpc05vZGUpIHtcbiAgICBSYWluYm93LmNvbG9yU3luYyA9IGZ1bmN0aW9uKGNvZGUsIGxhbmcpIHtcbiAgICAgICAgY29uc3Qgd29ya2VyRGF0YSA9IF9nZXRXb3JrZXJEYXRhKGNvZGUsIGxhbmcpO1xuICAgICAgICBjb25zdCBwcmlzbSA9IG5ldyBQcmlzbSh3b3JrZXJEYXRhLm9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gcHJpc20ucmVmcmFjdCh3b3JrZXJEYXRhLmNvZGUsIHdvcmtlckRhdGEubGFuZyk7XG4gICAgfTtcbn1cblxuLy8gSW4gdGhlIGJyb3dzZXIgaG9vayBpdCB1cCB0byBjb2xvciBvbiBwYWdlIGxvYWRcbmlmICghaXNOb2RlICYmICFpc1dvcmtlcikge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKCFSYWluYm93LmRlZmVyKSB7XG4gICAgICAgICAgICBSYWluYm93LmNvbG9yKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0sIGZhbHNlKTtcbn1cblxuLy8gRnJvbSBhIG5vZGUgd29ya2VyLCBoYW5kbGUgdGhlIHBvc3RNZXNzYWdlIHJlcXVlc3RzIHRvIGl0XG5pZiAoaXNXb3JrZXIpIHtcbiAgICBzZWxmLm9ubWVzc2FnZSA9IHJhaW5ib3dXb3JrZXI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJhaW5ib3c7XG4iXSwibmFtZXMiOlsiaXNOb2RlIiwiaXNXb3JrZXIiLCJsZXQiLCJjb25zdCIsInV0aWxJc05vZGUiLCJ1dGlsSXNXb3JrZXIiXSwibWFwcGluZ3MiOiI7Ozs7OztJQUNPLFNBQVNBLFFBQU0sR0FBRzs7UUFFckIsT0FBTyxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksT0FBTyxNQUFNLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQztLQUM5RTs7QUFFRCxBQUFPLElBQUEsU0FBU0MsVUFBUSxHQUFHO1FBQ3ZCLE9BQU8sT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLE9BQU8sSUFBSSxLQUFLLFdBQVcsQ0FBQztLQUN6RTs7Ozs7Ozs7QUFRRCxBQUFPLElBQUEsU0FBUyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUU7Ozs7Ozs7UUFPdkNDLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7Ozs7OztRQU1yRyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ1hDLElBQU0sT0FBTyxHQUFHLHVCQUF1QixDQUFDO1lBQ3hDQSxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7O1lBRTFGLElBQUksS0FBSyxFQUFFO2dCQUNQLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdkI7U0FD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