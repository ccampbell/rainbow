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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3ByaXNtLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9yYWluYm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZSgpIHtcbiAgICAvKiBnbG9iYWxzIG1vZHVsZSAqL1xuICAgIHJldHVybiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXb3JrZXIoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEdldHMgdGhlIGxhbmd1YWdlIGZvciB0aGlzIGJsb2NrIG9mIGNvZGVcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJsb2NrXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlRm9yQmxvY2soYmxvY2spIHtcblxuICAgIC8vIElmIHRoaXMgZG9lc24ndCBoYXZlIGEgbGFuZ3VhZ2UgYnV0IHRoZSBwYXJlbnQgZG9lcyB0aGVuIHVzZSB0aGF0LlxuICAgIC8vXG4gICAgLy8gVGhpcyBtZWFucyBpZiBmb3IgZXhhbXBsZSB5b3UgaGF2ZTogPHByZSBkYXRhLWxhbmd1YWdlPVwicGhwXCI+XG4gICAgLy8gd2l0aCBhIGJ1bmNoIG9mIDxjb2RlPiBibG9ja3MgaW5zaWRlIHRoZW4geW91IGRvIG5vdCBoYXZlXG4gICAgLy8gdG8gc3BlY2lmeSB0aGUgbGFuZ3VhZ2UgZm9yIGVhY2ggYmxvY2suXG4gICAgbGV0IGxhbmd1YWdlID0gYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJykgfHwgYmxvY2sucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZ3VhZ2UnKTtcblxuICAgIC8vIFRoaXMgYWRkcyBzdXBwb3J0IGZvciBzcGVjaWZ5aW5nIGxhbmd1YWdlIHZpYSBhIENTUyBjbGFzcy5cbiAgICAvL1xuICAgIC8vIFlvdSBjYW4gdXNlIHRoZSBHb29nbGUgQ29kZSBQcmV0dGlmeSBzdHlsZTogPHByZSBjbGFzcz1cImxhbmctcGhwXCI+XG4gICAgLy8gb3IgdGhlIEhUTUw1IHN0eWxlOiA8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtcGhwXCI+XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1xcYmxhbmcoPzp1YWdlKT8tKFxcdyspLztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBibG9jay5jbGFzc05hbWUubWF0Y2gocGF0dGVybikgfHwgYmxvY2sucGFyZW50Tm9kZS5jbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBsYW5ndWFnZSA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgIHJldHVybiBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGRpZmZlcmVudCBtYXRjaGVzIGhhdmUgY29tcGxldGUgb3ZlcmxhcCB3aXRoIGVhY2ggb3RoZXJcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQxICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICBlbmQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDIgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQyICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29tcGxldGVPdmVybGFwKHN0YXJ0MSwgZW5kMSwgc3RhcnQyLCBlbmQyKSB7XG5cbiAgICAvLyBJZiB0aGUgc3RhcnRpbmcgYW5kIGVuZCBwb3NpdGlvbnMgYXJlIGV4YWN0bHkgdGhlIHNhbWVcbiAgICAvLyB0aGVuIHRoZSBmaXJzdCBvbmUgc2hvdWxkIHN0YXkgYW5kIHRoaXMgb25lIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChzdGFydDIgPT09IHN0YXJ0MSAmJiBlbmQyID09PSBlbmQxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQyIDw9IHN0YXJ0MSAmJiBlbmQyID49IGVuZDE7XG59XG5cbi8qKlxuICogRW5jb2RlcyA8IGFuZCA+IGFzIGh0bWwgZW50aXRpZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaHRtbEVudGl0aWVzKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLyYoPyFbXFx3XFwjXSs7KS9nLCAnJmFtcDsnKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvdXQgdGhlIHBvc2l0aW9uIG9mIGdyb3VwIG1hdGNoIGZvciBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICpcbiAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTg1NTk0L2hvdy10by1maW5kLWluZGV4LW9mLWdyb3Vwcy1pbi1tYXRjaFxuICogQHBhcmFtIHtPYmplY3R9IG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBOdW1iZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZGV4T2ZHcm91cChtYXRjaCwgZ3JvdXBOdW1iZXIpIHtcbiAgICBsZXQgaW5kZXggPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cE51bWJlcjsgKytpKSB7XG4gICAgICAgIGlmIChtYXRjaFtpXSkge1xuICAgICAgICAgICAgaW5kZXggKz0gbWF0Y2hbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBuZXcgbWF0Y2ggaW50ZXJzZWN0cyB3aXRoIGFuIGV4aXN0aW5nIG9uZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydDEgICAgc3RhcnQgcG9zaXRpb24gb2YgZXhpc3RpbmcgbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQxICAgICAgZW5kIHBvc2l0aW9uIG9mIGV4aXN0aW5nIG1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQyICAgIHN0YXJ0IHBvc2l0aW9uIG9mIG5ldyBtYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZDIgICAgICBlbmQgcG9zaXRpb24gb2YgbmV3IG1hdGNoXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhzdGFydDEsIGVuZDEsIHN0YXJ0MiwgZW5kMikge1xuICAgIGlmIChzdGFydDIgPj0gc3RhcnQxICYmIHN0YXJ0MiA8IGVuZDEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuZDIgPiBzdGFydDEgJiYgZW5kMiA8IGVuZDE7XG59XG5cbi8qKlxuICogU29ydHMgYW4gb2JqZWN0cyBrZXlzIGJ5IGluZGV4IGRlc2NlbmRpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGxvY2F0aW9uIGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgbG9jYXRpb25zLnB1c2gobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbnVtZXJpYyBkZXNjZW5kaW5nXG4gICAgcmV0dXJuIGxvY2F0aW9ucy5zb3J0KChhLCBiKSA9PiBiIC0gYSk7XG59XG5cbi8qKlxuICogU3Vic3RyaW5nIHJlcGxhY2UgY2FsbCB0byByZXBsYWNlIHBhcnQgb2YgYSBzdHJpbmcgYXQgYSBjZXJ0YWluIHBvc2l0aW9uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uICAgICAgICAgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGhhcHBlblxuICogQHBhcmFtIHtzdHJpbmd9IHJlcGxhY2UgICAgICAgICAgdGhlIHRleHQgd2Ugd2FudCB0byByZXBsYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZVdpdGggICAgICB0aGUgdGV4dCB3ZSB3YW50IHRvIHJlcGxhY2UgaXQgd2l0aFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgICAgICAgICAgdGhlIGNvZGUgd2UgYXJlIGRvaW5nIHRoZSByZXBsYWNpbmcgaW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlLCByZXBsYWNlV2l0aCwgY29kZSkge1xuICAgIGNvbnN0IHN1YlN0cmluZyA9IGNvZGUuc3Vic3RyKHBvc2l0aW9uKTtcbiAgICByZXR1cm4gY29kZS5zdWJzdHIoMCwgcG9zaXRpb24pICsgc3ViU3RyaW5nLnJlcGxhY2UocmVwbGFjZSwgcmVwbGFjZVdpdGgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB1c2FibGUgd2ViIHdvcmtlciBmcm9tIGFuIGFub255bW91cyBmdW5jdGlvblxuICpcbiAqIG1vc3RseSBib3Jyb3dlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS96ZXZlcm8vd29ya2VyLWNyZWF0ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtXb3JrZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXb3JrZXIoZm4sIFByaXNtKSB7XG4gICAgaWYgKGlzTm9kZSgpKSB7XG4gICAgICAgIC8qIGdsb2JhbHMgZ2xvYmFsLCByZXF1aXJlLCBfX2ZpbGVuYW1lICovXG4gICAgICAgIGdsb2JhbC5Xb3JrZXIgPSByZXF1aXJlKCd3ZWJ3b3JrZXItdGhyZWFkcycpLldvcmtlcjtcbiAgICAgICAgcmV0dXJuIG5ldyBXb3JrZXIoX19maWxlbmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpc21GdW5jdGlvbiA9IFByaXNtLnRvU3RyaW5nKCk7XG5cbiAgICBsZXQgY29kZSA9IGtleXMudG9TdHJpbmcoKTtcbiAgICBjb2RlICs9IGh0bWxFbnRpdGllcy50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gaGFzQ29tcGxldGVPdmVybGFwLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBpbnRlcnNlY3RzLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSByZXBsYWNlQXRQb3NpdGlvbi50b1N0cmluZygpO1xuICAgIGNvZGUgKz0gaW5kZXhPZkdyb3VwLnRvU3RyaW5nKCk7XG4gICAgY29kZSArPSBwcmlzbUZ1bmN0aW9uO1xuXG4gICAgLy8gVGhpcyBpcyBhbiBhd2Z1bCBoYWNrLCBidXQgc29tZXRoaW5nIHRvIGRvIHdpdGggaG93IHVnbGlmeSByZW5hbWVzIHN0dWZmXG4gICAgLy8gYW5kIHJvbGx1cCBtZWFucyB0aGF0IHRoZSB2YXJpYWJsZSB0aGUgd29ya2VyLmpzIGlzIHVzaW5nIHRvIHJlZmVyZW5jZVxuICAgIC8vIFByaXNtIHdpbGwgbm90IGJlIHRoZSBzYW1lIG9uZSBhdmFpbGFibGUgaW4gdGhpcyBjb250ZXh0XG4gICAgY29uc3QgcHJpc21OYW1lID0gcHJpc21GdW5jdGlvbi5tYXRjaCgvZnVuY3Rpb24gKFxcdys/KVxcKC8pWzFdO1xuICAgIGxldCBzdHIgPSBmbi50b1N0cmluZygpO1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC89bmV3IFxcdysvLCBgPSBuZXcgJHtwcmlzbU5hbWV9YCk7XG5cbiAgICBjb25zdCBmdWxsU3RyaW5nID0gYCR7Y29kZX1cXHR0aGlzLm9ubWVzc2FnZSA9JHtzdHJ9YDtcblxuICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbZnVsbFN0cmluZ10sIHsgdHlwZTogJ3RleHQvamF2YXNjcmlwdCcgfSk7XG4gICAgcmV0dXJuIG5ldyBXb3JrZXIoKHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpKTtcbn1cbiIsImltcG9ydCB7IHJlcGxhY2VBdFBvc2l0aW9uLCBpbmRleE9mR3JvdXAsIGtleXMsIGh0bWxFbnRpdGllcywgaGFzQ29tcGxldGVPdmVybGFwLCBpbnRlcnNlY3RzIH0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBQcmlzbSBpcyBhIGNsYXNzIHVzZWQgdG8gaGlnaGxpZ2h0IGluZGl2aWR1YWwgYmxvY2tzIG9mIGNvZGVcbiAqXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgUHJpc20ge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9iamVjdCBvZiByZXBsYWNlbWVudHMgdG8gcHJvY2VzcyBhdCB0aGUgZW5kIG9mIHRoZSBwcm9jZXNzaW5nXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXBsYWNlbWVudHMgPSB7fTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGFuZ3VhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgUHJpc20gb2JqZWN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY3VycmVudExhbmd1YWdlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPYmplY3Qgb2Ygc3RhcnQgYW5kIGVuZCBwb3NpdGlvbnMgb2YgYmxvY2tzIHRvIGJlIHJlcGxhY2VkXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXBsYWNlbWVudFBvc2l0aW9ucyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBtYXRjaCBwYXNzZWQgaW4gZmFsbHMgaW5zaWRlIG9mIGFuIGV4aXN0aW5nIG1hdGNoLlxuICAgICAgICAgKiBUaGlzIHByZXZlbnRzIGEgcmVnZXggcGF0dGVybiBmcm9tIG1hdGNoaW5nIGluc2lkZSBvZiBhbm90aGVyIHBhdHRlcm5cbiAgICAgICAgICogdGhhdCBtYXRjaGVzIGEgbGFyZ2VyIGFtb3VudCBvZiBjb2RlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHByZXZlbnRzIGEga2V5d29yZCBmcm9tIG1hdGNoaW5nIGBmdW5jdGlvbmAgaWYgdGhlcmVcbiAgICAgICAgICogaXMgYWxyZWFkeSBhIG1hdGNoIGZvciBgZnVuY3Rpb24gKC4qKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCAgICBzdGFydCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGVuZCAgICAgIGVuZCBwb3NpdGlvbiBvZiBuZXcgbWF0Y2hcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9tYXRjaElzSW5zaWRlT3RoZXJNYXRjaChzdGFydCwgZW5kKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gcmVwbGFjZW1lbnRQb3NpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBwYXJzZUludChrZXksIDEwKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgYmxvY2sgY29tcGxldGVseSBvdmVybGFwcyB3aXRoIGFub3RoZXIgYmxvY2tcbiAgICAgICAgICAgICAgICAvLyB0aGVuIHdlIHNob3VsZCByZW1vdmUgdGhlIG90aGVyIGJsb2NrIGFuZCByZXR1cm4gYGZhbHNlYC5cbiAgICAgICAgICAgICAgICBpZiAoaGFzQ29tcGxldGVPdmVybGFwKGtleSwgcmVwbGFjZW1lbnRQb3NpdGlvbnNba2V5XSwgc3RhcnQsIGVuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXBsYWNlbWVudHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0cyhrZXksIHJlcGxhY2VtZW50UG9zaXRpb25zW2tleV0sIHN0YXJ0LCBlbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRha2VzIGEgc3RyaW5nIG9mIGNvZGUgYW5kIHdyYXBzIGl0IGluIGEgc3BhbiB0YWcgYmFzZWQgb24gdGhlIG5hbWVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgICAgICAgIG5hbWUgb2YgdGhlIHBhdHRlcm4gKGllIGtleXdvcmQucmVnZXgpXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICAgICBibG9jayBvZiBjb2RlIHRvIHdyYXBcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbENsYXNzIGNsYXNzIHRvIGFwcGx5IHRvIGV2ZXJ5IHNwYW5cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3dyYXBDb2RlSW5TcGFuKG5hbWUsIGNvZGUpIHtcbiAgICAgICAgICAgIGxldCBjbGFzc05hbWUgPSBuYW1lLnJlcGxhY2UoL1xcLi9nLCAnICcpO1xuXG4gICAgICAgICAgICBjb25zdCBnbG9iYWxDbGFzcyA9IG9wdGlvbnMuZ2xvYmFsQ2xhc3M7XG4gICAgICAgICAgICBpZiAoZ2xvYmFsQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgKz0gYCAke2dsb2JhbENsYXNzfWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBgPHNwYW4gY2xhc3M9XCIke2NsYXNzTmFtZX1cIj4ke2NvZGV9PC9zcGFuPmA7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvY2VzcyByZXBsYWNlbWVudHMgaW4gdGhlIHN0cmluZyBvZiBjb2RlIHRvIGFjdHVhbGx5IHVwZGF0ZVxuICAgICAgICAgKiB0aGUgbWFya3VwXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICAgICAgdGhlIGNvZGUgdG8gcHJvY2VzcyByZXBsYWNlbWVudHMgaW5cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Byb2Nlc3NSZXBsYWNlbWVudHMoY29kZSkge1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb25zID0ga2V5cyhyZXBsYWNlbWVudHMpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiBwb3NpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50c1twb3NpdGlvbl07XG4gICAgICAgICAgICAgICAgY29kZSA9IHJlcGxhY2VBdFBvc2l0aW9uKHBvc2l0aW9uLCByZXBsYWNlbWVudC5yZXBsYWNlLCByZXBsYWNlbWVudC53aXRoLCBjb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0IGlzIHNvIHdlIGNhbiBjcmVhdGUgYSBuZXcgcmVnZXggb2JqZWN0IGZvciBlYWNoIGNhbGwgdG9cbiAgICAgICAgICogX3Byb2Nlc3NQYXR0ZXJuIHRvIGF2b2lkIHN0YXRlIGNhcnJ5aW5nIG92ZXIgd2hlbiBydW5uaW5nIGV4ZWNcbiAgICAgICAgICogbXVsdGlwbGUgdGltZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBnbG9iYWwgZmxhZyBzaG91bGQgbm90IGJlIGNhcnJpZWQgb3ZlciBiZWNhdXNlIHdlIGFyZSBzaW11bGF0aW5nXG4gICAgICAgICAqIGl0IGJ5IHByb2Nlc3NpbmcgdGhlIHJlZ2V4IGluIGEgbG9vcCBzbyB3ZSBvbmx5IGNhcmUgYWJvdXQgdGhlIGZpcnN0XG4gICAgICAgICAqIG1hdGNoIGluIGVhY2ggc3RyaW5nLiBUaGlzIGFsc28gc2VlbXMgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZSBxdWl0ZSBhXG4gICAgICAgICAqIGJpdC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtSZWdFeHB9IHJlZ2V4XG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9jbG9uZVJlZ2V4KHJlZ2V4KSB7XG4gICAgICAgICAgICBsZXQgZmxhZ3MgPSAnJztcblxuICAgICAgICAgICAgaWYgKHJlZ2V4Lmlnbm9yZUNhc2UpIHtcbiAgICAgICAgICAgICAgICBmbGFncyArPSAnaSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZWdleC5tdWx0aWxpbmUpIHtcbiAgICAgICAgICAgICAgICBmbGFncyArPSAnbSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LnNvdXJjZSwgZmxhZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1hdGNoZXMgYSByZWdleCBwYXR0ZXJuIGFnYWluc3QgYSBibG9jayBvZiBjb2RlLCBmaW5kcyBhbGwgbWF0Y2hlc1xuICAgICAgICAgKiB0aGF0IHNob3VsZCBiZSBwcm9jZXNzZWQsIGFuZCBzdG9yZXMgdGhlIHBvc2l0aW9ucyBvZiB3aGVyZSB0aGV5XG4gICAgICAgICAqIHNob3VsZCBiZSByZXBsYWNlZCB3aXRoaW4gdGhlIHN0cmluZy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyBpcyB3aGVyZSBwcmV0dHkgbXVjaCBhbGwgdGhlIHdvcmsgaXMgZG9uZSBidXQgaXQgc2hvdWxkIG5vdFxuICAgICAgICAgKiBiZSBjYWxsZWQgZGlyZWN0bHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXR0ZXJuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAgICAgICAgICogQHJldHVybiB7bWl4ZWR9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc1BhdHRlcm4ocGF0dGVybiwgY29kZSwgb2Zmc2V0ID0gMCkge1xuICAgICAgICAgICAgbGV0IHJlZ2V4ID0gcGF0dGVybi5wYXR0ZXJuO1xuICAgICAgICAgICAgaWYgKCFyZWdleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2luY2Ugd2UgYXJlIHNpbXVsYXRpbmcgZ2xvYmFsIHJlZ2V4IG1hdGNoaW5nIHdlIG5lZWQgdG8gYWxzb1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRvIHN0b3AgYWZ0ZXIgb25lIG1hdGNoIGlmIHRoZSBwYXR0ZXJuIGlzIG5vdCBnbG9iYWxcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZFN0b3AgPSAhcmVnZXguZ2xvYmFsO1xuXG4gICAgICAgICAgICByZWdleCA9IF9jbG9uZVJlZ2V4KHJlZ2V4KTtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVnZXguZXhlYyhjb2RlKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyZWF0IG1hdGNoIDAgdGhlIHNhbWUgd2F5IGFzIG5hbWVcbiAgICAgICAgICAgIGlmICghcGF0dGVybi5uYW1lICYmIHBhdHRlcm4ubWF0Y2hlcyAmJiB0eXBlb2YgcGF0dGVybi5tYXRjaGVzWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHBhdHRlcm4ubmFtZSA9IHBhdHRlcm4ubWF0Y2hlc1swXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgcGF0dGVybi5tYXRjaGVzWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgcmVwbGFjZW1lbnQgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0UG9zID0gbWF0Y2guaW5kZXggKyBvZmZzZXQ7XG4gICAgICAgICAgICBjb25zdCBlbmRQb3MgPSBtYXRjaFswXS5sZW5ndGggKyBzdGFydFBvcztcblxuICAgICAgICAgICAgLy8gSW4gc29tZSBjYXNlcyB3aGVuIHRoZSByZWdleCBtYXRjaGVzIGEgZ3JvdXAgc3VjaCBhcyBcXHMqIGl0IGlzXG4gICAgICAgICAgICAvLyBwb3NzaWJsZSBmb3IgdGhlcmUgdG8gYmUgYSBtYXRjaCwgYnV0IGhhdmUgdGhlIHN0YXJ0IHBvc2l0aW9uXG4gICAgICAgICAgICAvLyBlcXVhbCB0aGUgZW5kIHBvc2l0aW9uLiBJbiB0aG9zZSBjYXNlcyB3ZSBzaG91bGQgYmUgYWJsZSB0byBzdG9wXG4gICAgICAgICAgICAvLyBtYXRjaGluZy4gT3RoZXJ3aXNlIHRoaXMgY2FuIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAgICAgICAgIGlmIChzdGFydFBvcyA9PT0gZW5kUG9zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCBhIGNoaWxkIG1hdGNoIGFuZCBpdCBmYWxscyBpbnNpZGUgb2YgYW5vdGhlclxuICAgICAgICAgICAgLy8gbWF0Y2ggdGhhdCBhbHJlYWR5IGhhcHBlbmVkIHdlIHNob3VsZCBza2lwIGl0IGFuZCBjb250aW51ZVxuICAgICAgICAgICAgLy8gcHJvY2Vzc2luZy5cbiAgICAgICAgICAgIGlmIChfbWF0Y2hJc0luc2lkZU90aGVyTWF0Y2goc3RhcnRQb3MsIGVuZFBvcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmc6IGNvZGUuc3Vic3RyKGVuZFBvcyAtIG9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogZW5kUG9zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxsYmFjayBmb3Igd2hlbiBhIG1hdGNoIHdhcyBzdWNjZXNzZnVsbHkgcHJvY2Vzc2VkXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHJlcGxcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uTWF0Y2hTdWNjZXNzKHJlcGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgbWF0Y2ggaGFzIGEgbmFtZSB0aGVuIHdyYXAgaXQgaW4gYSBzcGFuIHRhZ1xuICAgICAgICAgICAgICAgIGlmIChwYXR0ZXJuLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwbCA9IF93cmFwQ29kZUluU3BhbihwYXR0ZXJuLm5hbWUsIHJlcGwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZvciBkZWJ1Z2dpbmdcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVwbGFjZSAnICsgbWF0Y2hbMF0gKyAnIHdpdGggJyArIHJlcGxhY2VtZW50ICsgJyBhdCBwb3NpdGlvbiAnICsgc3RhcnRQb3MgKyAnIHRvICcgKyBlbmRQb3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gU3RvcmUgd2hhdCBuZWVkcyB0byBiZSByZXBsYWNlZCB3aXRoIHdoYXQgYXQgdGhpcyBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50c1tzdGFydFBvc10gPSB7XG4gICAgICAgICAgICAgICAgICAgICdyZXBsYWNlJzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICd3aXRoJzogcmVwbFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgcmFuZ2Ugb2YgdGhpcyBtYXRjaCBzbyB3ZSBjYW4gdXNlIGl0IGZvclxuICAgICAgICAgICAgICAgIC8vIGNvbXBhcmlzb25zIHdpdGggb3RoZXIgbWF0Y2hlcyBsYXRlci5cbiAgICAgICAgICAgICAgICByZXBsYWNlbWVudFBvc2l0aW9uc1tzdGFydFBvc10gPSBlbmRQb3M7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkU3RvcCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nOiBjb2RlLnN1YnN0cihlbmRQb3MgLSBvZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGVuZFBvc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGVscGVyIGZ1bmN0aW9uIGZvciBwcm9jZXNzaW5nIGEgc3ViIGdyb3VwXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IGdyb3VwS2V5ICAgICAgaW5kZXggb2YgZ3JvdXBcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIF9wcm9jZXNzR3JvdXAoZ3JvdXBLZXkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBibG9jayA9IG1hdGNoW2dyb3VwS2V5XTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIG1hdGNoIGhlcmUgdGhlbiBtb3ZlIG9uXG4gICAgICAgICAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSBwYXR0ZXJuLm1hdGNoZXNbZ3JvdXBLZXldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ3JvdXAubGFuZ3VhZ2U7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBQcm9jZXNzIGdyb3VwIGlzIHdoYXQgZ3JvdXAgd2Ugc2hvdWxkIHVzZSB0byBhY3R1YWxseSBwcm9jZXNzXG4gICAgICAgICAgICAgICAgICogdGhpcyBtYXRjaCBncm91cC5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEZvciBleGFtcGxlIGlmIHRoZSBzdWJncm91cCBwYXR0ZXJuIGxvb2tzIGxpa2UgdGhpczpcbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIDI6IHtcbiAgICAgICAgICAgICAgICAgKiAgICAgJ25hbWUnOiAna2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICogICAgICdwYXR0ZXJuJzogL3RydWUvZ1xuICAgICAgICAgICAgICAgICAqIH1cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIHRoZW4gd2UgdXNlIHRoYXQgYXMgaXMsIGJ1dCBpZiBpdCBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiAyOiB7XG4gICAgICAgICAgICAgICAgICogICAgICduYW1lJzogJ2tleXdvcmQnLFxuICAgICAgICAgICAgICAgICAqICAgICAnbWF0Y2hlcyc6IHtcbiAgICAgICAgICAgICAgICAgKiAgICAgICAgICAnbmFtZSc6ICdzcGVjaWFsJyxcbiAgICAgICAgICAgICAgICAgKiAgICAgICAgICAncGF0dGVybic6IC93aGF0ZXZlci9nXG4gICAgICAgICAgICAgICAgICogICAgICB9XG4gICAgICAgICAgICAgICAgICogfVxuICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICogd2UgdHJlYXQgdGhlICdtYXRjaGVzJyBwYXJ0IGFzIHRoZSBwYXR0ZXJuIGFuZCBrZWVwXG4gICAgICAgICAgICAgICAgICogdGhlIG5hbWUgYXJvdW5kIHRvIHdyYXAgaXQgd2l0aCBsYXRlclxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwVG9Qcm9jZXNzID0gZ3JvdXAubmFtZSAmJiBncm91cC5tYXRjaGVzID8gZ3JvdXAubWF0Y2hlcyA6IGdyb3VwO1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVGFrZXMgdGhlIGNvZGUgYmxvY2sgbWF0Y2hlZCBhdCB0aGlzIGdyb3VwLCByZXBsYWNlcyBpdFxuICAgICAgICAgICAgICAgICAqIHdpdGggdGhlIGhpZ2hsaWdodGVkIGJsb2NrLCBhbmQgb3B0aW9uYWxseSB3cmFwcyBpdCB3aXRoXG4gICAgICAgICAgICAgICAgICogYSBzcGFuIHdpdGggYSBuYW1lXG4gICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc2VkQmxvY2tcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwbGFjZUJsb2NrXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gbWF0Y2hOYW1lXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc3QgX2dldFJlcGxhY2VtZW50ID0gZnVuY3Rpb24ocGFzc2VkQmxvY2ssIHJlcGxhY2VCbG9jaywgbWF0Y2hOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZUF0UG9zaXRpb24oaW5kZXhPZkdyb3VwKG1hdGNoLCBncm91cEtleSksIHBhc3NlZEJsb2NrLCBtYXRjaE5hbWUgPyBfd3JhcENvZGVJblNwYW4obWF0Y2hOYW1lLCByZXBsYWNlQmxvY2spIDogcmVwbGFjZUJsb2NrLCByZXBsYWNlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHN0cmluZyB0aGVuIHRoaXMgbWF0Y2ggaXMgZGlyZWN0bHkgbWFwcGVkXG4gICAgICAgICAgICAgICAgLy8gdG8gc2VsZWN0b3Igc28gYWxsIHdlIGhhdmUgdG8gZG8gaXMgd3JhcCBpdCBpbiBhIHNwYW5cbiAgICAgICAgICAgICAgICAvLyBhbmQgY29udGludWUuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBncm91cCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBibG9jaywgZ3JvdXApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGxvY2FsQ29kZTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmlzbSA9IG5ldyBQcmlzbShvcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBzdWJsYW5ndWFnZSBnbyBhbmQgcHJvY2VzcyB0aGUgYmxvY2sgdXNpbmdcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGxhbmd1YWdlXG4gICAgICAgICAgICAgICAgaWYgKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQ29kZSA9IHByaXNtLnJlZnJhY3QoYmxvY2ssIGxhbmd1YWdlKTtcbiAgICAgICAgICAgICAgICAgICAgX2dldFJlcGxhY2VtZW50KGJsb2NrLCBsb2NhbENvZGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHByb2Nlc3MgZ3JvdXAgY2FuIGJlIGEgc2luZ2xlIHBhdHRlcm4gb3IgYW4gYXJyYXkgb2ZcbiAgICAgICAgICAgICAgICAvLyBwYXR0ZXJucy4gYF9wcm9jZXNzQ29kZVdpdGhQYXR0ZXJuc2AgYWx3YXlzIGV4cGVjdHMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAvLyBzbyB3ZSBjb252ZXJ0IGl0IGhlcmUuXG4gICAgICAgICAgICAgICAgbG9jYWxDb2RlID0gcHJpc20ucmVmcmFjdChibG9jaywgY3VycmVudExhbmd1YWdlLCBncm91cFRvUHJvY2Vzcy5sZW5ndGggPyBncm91cFRvUHJvY2VzcyA6IFtncm91cFRvUHJvY2Vzc10pO1xuICAgICAgICAgICAgICAgIF9nZXRSZXBsYWNlbWVudChibG9jaywgbG9jYWxDb2RlLCBncm91cC5tYXRjaGVzID8gZ3JvdXAubmFtZSA6IDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIHBhdHRlcm4gaGFzIHN1YiBtYXRjaGVzIGZvciBkaWZmZXJlbnQgZ3JvdXBzIGluIHRoZSByZWdleFxuICAgICAgICAgICAgLy8gdGhlbiB3ZSBzaG91bGQgcHJvY2VzcyB0aGVtIG9uZSBhdCBhIHRpbWUgYnkgcnVubmluZyB0aGVtIHRocm91Z2hcbiAgICAgICAgICAgIC8vIHRoZSBfcHJvY2Vzc0dyb3VwIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIHRoZSBuZXcgcmVwbGFjZW1lbnQuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2UgdXNlIHRoZSBga2V5c2AgZnVuY3Rpb24gdG8gcnVuIHRocm91Z2ggdGhlbSBiYWNrd2FyZHMgYmVjYXVzZVxuICAgICAgICAgICAgLy8gdGhlIG1hdGNoIHBvc2l0aW9uIG9mIGVhcmxpZXIgbWF0Y2hlcyB3aWxsIG5vdCBjaGFuZ2UgZGVwZW5kaW5nXG4gICAgICAgICAgICAvLyBvbiB3aGF0IGdldHMgcmVwbGFjZWQgaW4gbGF0ZXIgbWF0Y2hlcy5cbiAgICAgICAgICAgIGNvbnN0IGdyb3VwS2V5cyA9IGtleXMocGF0dGVybi5tYXRjaGVzKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZ3JvdXBLZXkgb2YgZ3JvdXBLZXlzKSB7XG4gICAgICAgICAgICAgICAgX3Byb2Nlc3NHcm91cChncm91cEtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZpbmFsbHksIGNhbGwgYG9uTWF0Y2hTdWNjZXNzYCB3aXRoIHRoZSByZXBsYWNlbWVudFxuICAgICAgICAgICAgcmV0dXJuIG9uTWF0Y2hTdWNjZXNzKHJlcGxhY2VtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzZXMgYSBibG9jayBvZiBjb2RlIHVzaW5nIHNwZWNpZmllZCBwYXR0ZXJuc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXR0ZXJuc1xuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfcHJvY2Vzc0NvZGVXaXRoUGF0dGVybnMoY29kZSwgcGF0dGVybnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBfcHJvY2Vzc1BhdHRlcm4ocGF0dGVybiwgY29kZSk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBfcHJvY2Vzc1BhdHRlcm4ocGF0dGVybiwgcmVzdWx0LnJlbWFpbmluZywgcmVzdWx0Lm9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZSBhcmUgZG9uZSBwcm9jZXNzaW5nIHRoZSBwYXR0ZXJucyBzbyB3ZSBzaG91bGQgYWN0dWFsbHkgcmVwbGFjZVxuICAgICAgICAgICAgLy8gd2hhdCBuZWVkcyB0byBiZSByZXBsYWNlZCBpbiB0aGUgY29kZS5cbiAgICAgICAgICAgIHJldHVybiBfcHJvY2Vzc1JlcGxhY2VtZW50cyhjb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiByZWdleCBwYXR0ZXJucyBmb3IgdGhpcyBsYW5ndWFnZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRQYXR0ZXJuc0Zvckxhbmd1YWdlKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICBsZXQgcGF0dGVybnMgPSBvcHRpb25zLnBhdHRlcm5zW2xhbmd1YWdlXSB8fCBbXTtcbiAgICAgICAgICAgIHdoaWxlIChvcHRpb25zLmluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXSkge1xuICAgICAgICAgICAgICAgIGxhbmd1YWdlID0gb3B0aW9ucy5pbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV07XG4gICAgICAgICAgICAgICAgcGF0dGVybnMgPSBwYXR0ZXJucy5jb25jYXQob3B0aW9ucy5wYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGF0dGVybnM7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGFrZXMgYSBzdHJpbmcgb2YgY29kZSBhbmQgaGlnaGxpZ2h0cyBpdCBhY2NvcmRpbmcgdG8gdGhlIGxhbmd1YWdlXG4gICAgICAgICAqIHNwZWNpZmllZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhdHRlcm5zIG9wdGlvbmFsbHkgc3BlY2lmeSBhIGxpc3Qgb2YgcGF0dGVybnNcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX2hpZ2hsaWdodEJsb2NrRm9yTGFuZ3VhZ2UoY29kZSwgbGFuZ3VhZ2UsIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBsYW5ndWFnZTtcbiAgICAgICAgICAgIHBhdHRlcm5zID0gcGF0dGVybnMgfHwgZ2V0UGF0dGVybnNGb3JMYW5ndWFnZShsYW5ndWFnZSk7XG4gICAgICAgICAgICByZXR1cm4gX3Byb2Nlc3NDb2RlV2l0aFBhdHRlcm5zKGh0bWxFbnRpdGllcyhjb2RlKSwgcGF0dGVybnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyYWN0ID0gX2hpZ2hsaWdodEJsb2NrRm9yTGFuZ3VhZ2U7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcmlzbTtcbiIsImltcG9ydCBQcmlzbSBmcm9tICcuL3ByaXNtJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmFpbmJvd1dvcmtlcihlKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGUuZGF0YTtcblxuICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKG1lc3NhZ2Uub3B0aW9ucyk7XG4gICAgY29uc3QgcmVzdWx0ID0gcHJpc20ucmVmcmFjdChtZXNzYWdlLmNvZGUsIG1lc3NhZ2UubGFuZyk7XG5cbiAgICBmdW5jdGlvbiBfcmVwbHkoKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgaWQ6IG1lc3NhZ2UuaWQsXG4gICAgICAgICAgICBsYW5nOiBtZXNzYWdlLmxhbmcsXG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSSByZWFsaXplZCBkb3duIHRoZSByb2FkIEkgbWlnaHQgbG9vayBhdCB0aGlzIGFuZCB3b25kZXIgd2hhdCBpcyBnb2luZyBvblxuICAgIC8vIHNvIHByb2JhYmx5IGl0IGlzIG5vdCBhIGJhZCBpZGVhIHRvIGxlYXZlIGEgY29tbWVudC5cbiAgICAvL1xuICAgIC8vIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgcmlnaHQgbm93IHRoZSBub2RlIGxpYnJhcnkgZm9yIHNpbXVsYXRpbmcgd2ViXG4gICAgLy8gd29ya2VycyDigJx3ZWJ3b3JrZXItdGhyZWFkc+KAnSB3aWxsIGtlZXAgdGhlIHdvcmtlciBvcGVuIGFuZCBpdCBjYXVzZXNcbiAgICAvLyBzY3JpcHRzIHJ1bm5pbmcgZnJvbSB0aGUgY29tbWFuZCBsaW5lIHRvIGhhbmcgdW5sZXNzIHRoZSB3b3JrZXIgaXNcbiAgICAvLyBleHBsaWNpdGx5IGNsb3NlZC5cbiAgICAvL1xuICAgIC8vIFRoaXMgbWVhbnMgZm9yIG5vZGUgd2Ugd2lsbCBzcGF3biBhIG5ldyB0aHJlYWQgZm9yIGV2ZXJ5IGFzeW5jaHJvbm91c1xuICAgIC8vIGJsb2NrIHdlIGFyZSBoaWdobGlnaHRpbmcsIGJ1dCBpbiB0aGUgYnJvd3NlciB3ZSB3aWxsIGtlZXAgYSBzaW5nbGVcbiAgICAvLyB3b3JrZXIgb3BlbiBmb3IgYWxsIHJlcXVlc3RzLlxuICAgIGlmIChtZXNzYWdlLmlzTm9kZSkge1xuICAgICAgICBfcmVwbHkoKTtcbiAgICAgICAgc2VsZi5jbG9zZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIF9yZXBseSgpO1xuICAgIH0sIG1lc3NhZ2Uub3B0aW9ucy5kZWxheSAqIDEwMDApO1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE2IENyYWlnIENhbXBiZWxsXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogUmFpbmJvdyBpcyBhIHNpbXBsZSBjb2RlIHN5bnRheCBoaWdobGlnaHRlclxuICpcbiAqIEBzZWUgcmFpbmJvd2NvLmRlXG4gKi9cbmltcG9ydCBQcmlzbSBmcm9tICcuL3ByaXNtJztcbmltcG9ydCB7IGlzTm9kZSBhcyB1dGlsSXNOb2RlLCBpc1dvcmtlciBhcyB1dGlsSXNXb3JrZXIsIGNyZWF0ZVdvcmtlciwgZ2V0TGFuZ3VhZ2VGb3JCbG9jayB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgcmFpbmJvd1dvcmtlciBmcm9tICcuL3dvcmtlcic7XG5cbi8qKlxuICogQW4gYXJyYXkgb2YgdGhlIGxhbmd1YWdlIHBhdHRlcm5zIHNwZWNpZmllZCBmb3IgZWFjaCBsYW5ndWFnZVxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmNvbnN0IHBhdHRlcm5zID0ge307XG5cbi8qKlxuICogQW4gb2JqZWN0IG9mIGxhbmd1YWdlcyBtYXBwaW5nIHRvIHdoYXQgbGFuZ3VhZ2UgdGhleSBzaG91bGQgaW5oZXJpdCBmcm9tXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgaW5oZXJpdGVuY2VNYXAgPSB7fTtcblxuLyoqXG4gKiBBIG1hcHBpbmcgb2YgbGFuZ3VhZ2UgYWxpYXNlc1xuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmNvbnN0IGFsaWFzZXMgPSB7fTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiB0aGUgYWN0dWFsIHJhaW5ib3cgb2JqZWN0XG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xubGV0IFJhaW5ib3cgPSB7fTtcblxuLyoqXG4gKiBDYWxsYmFjayB0byBmaXJlIGFmdGVyIGVhY2ggYmxvY2sgaXMgaGlnaGxpZ2h0ZWRcbiAqXG4gKiBAdHlwZSB7bnVsbHxGdW5jdGlvbn1cbiAqL1xubGV0IG9uSGlnaGxpZ2h0Q2FsbGJhY2s7XG5cbmNvbnN0IGlzTm9kZSA9IHV0aWxJc05vZGUoKTtcbmNvbnN0IGlzV29ya2VyID0gdXRpbElzV29ya2VyKCk7XG5cbmxldCBjYWNoZWRXb3JrZXIgPSBudWxsO1xuZnVuY3Rpb24gX2dldFdvcmtlcigpIHtcbiAgICBpZiAoaXNOb2RlIHx8IGNhY2hlZFdvcmtlciA9PT0gbnVsbCkge1xuICAgICAgICBjYWNoZWRXb3JrZXIgPSBjcmVhdGVXb3JrZXIocmFpbmJvd1dvcmtlciwgUHJpc20pO1xuICAgIH1cblxuICAgIHJldHVybiBjYWNoZWRXb3JrZXI7XG59XG5cbi8qKlxuICogSGVscGVyIGZvciBtYXRjaGluZyB1cCBjYWxsYmFja3MgZGlyZWN0bHkgd2l0aCB0aGVcbiAqIHBvc3QgbWVzc2FnZSByZXF1ZXN0cyB0byBhIHdlYiB3b3JrZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG1lc3NhZ2UgICAgICBkYXRhIHRvIHNlbmQgdG8gd2ViIHdvcmtlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgICBjYWxsYmFjayBmdW5jdGlvbiBmb3Igd29ya2VyIHRvIHJlcGx5IHRvXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfbWVzc2FnZVdvcmtlcihtZXNzYWdlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHdvcmtlciA9IF9nZXRXb3JrZXIoKTtcblxuICAgIGZ1bmN0aW9uIF9saXN0ZW4oZSkge1xuICAgICAgICBpZiAoZS5kYXRhLmlkID09PSBtZXNzYWdlLmlkKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlLmRhdGEpO1xuICAgICAgICAgICAgd29ya2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBfbGlzdGVuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgX2xpc3Rlbik7XG4gICAgd29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIEhhbmRsZXMgcmVzcG9uc2UgZnJvbSB3ZWIgd29ya2VyLCB1cGRhdGVzIERPTSB3aXRoXG4gKiByZXN1bHRpbmcgY29kZSwgYW5kIGZpcmVzIGNhbGxiYWNrXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gd2FpdGluZ09uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gX2dlbmVyYXRlSGFuZGxlcihlbGVtZW50LCB3YWl0aW5nT24sIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIF9oYW5kbGVSZXNwb25zZUZyb21Xb3JrZXIoZGF0YSkge1xuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGRhdGEucmVzdWx0O1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcblxuICAgICAgICBpZiAoZWxlbWVudC5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdQUkUnKSB7XG4gICAgICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCAoZSkgPT4ge1xuICAgICAgICAvLyAgICAgaWYgKGUuYW5pbWF0aW9uTmFtZSA9PT0gJ2ZhZGUtaW4nKSB7XG4gICAgICAgIC8vICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZGVjcmVhc2UtZGVsYXknKTtcbiAgICAgICAgLy8gICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgaWYgKG9uSGlnaGxpZ2h0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIG9uSGlnaGxpZ2h0Q2FsbGJhY2soZWxlbWVudCwgZGF0YS5sYW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgtLXdhaXRpbmdPbi5jID09PSAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIG9wdGlvbnMgbmVlZGVkIHRvIHBhc3MgaW50byBQcmlzbVxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIF9nZXRQcmlzbU9wdGlvbnMob3B0aW9ucykge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBhdHRlcm5zLFxuICAgICAgICBpbmhlcml0ZW5jZU1hcCxcbiAgICAgICAgYWxpYXNlcyxcbiAgICAgICAgZ2xvYmFsQ2xhc3M6IG9wdGlvbnMuZ2xvYmFsQ2xhc3MsXG4gICAgICAgIGRlbGF5OiAhaXNOYU4ob3B0aW9ucy5kZWxheSkgPyBvcHRpb25zLmRlbGF5IDogMFxuICAgIH07XG59XG5cbi8qKlxuICogR2V0cyBkYXRhIHRvIHNlbmQgdG8gd2Vid29ya2VyXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGxhbmdcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gX2dldFdvcmtlckRhdGEoY29kZSwgbGFuZykge1xuICAgIGxldCBvcHRpb25zID0ge307XG4gICAgaWYgKHR5cGVvZiBsYW5nID09PSAnb2JqZWN0Jykge1xuICAgICAgICBvcHRpb25zID0gbGFuZztcbiAgICAgICAgbGFuZyA9IG9wdGlvbnMubGFuZ3VhZ2U7XG4gICAgfVxuXG4gICAgbGFuZyA9IGFsaWFzZXNbbGFuZ10gfHwgbGFuZztcblxuICAgIGNvbnN0IHdvcmtlckRhdGEgPSB7XG4gICAgICAgIGlkOiBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjYpKSArIERhdGUubm93KCksXG4gICAgICAgIGNvZGUsXG4gICAgICAgIGxhbmcsXG4gICAgICAgIG9wdGlvbnM6IF9nZXRQcmlzbU9wdGlvbnMob3B0aW9ucyksXG4gICAgICAgIGlzTm9kZVxuICAgIH07XG5cbiAgICByZXR1cm4gd29ya2VyRGF0YTtcbn1cblxuLyoqXG4gKiBCcm93c2VyIE9ubHkgLSBTZW5kcyBtZXNzYWdlcyB0byB3ZWIgd29ya2VyIHRvIGhpZ2hsaWdodCBlbGVtZW50cyBwYXNzZWRcbiAqIGluXG4gKlxuICogQHBhcmFtIHtBcnJheX0gY29kZUJsb2Nrc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIF9oaWdobGlnaHRDb2RlQmxvY2tzKGNvZGVCbG9ja3MsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgd2FpdGluZ09uID0geyBjOiAwIH07XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBjb2RlQmxvY2tzKSB7XG4gICAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2VGb3JCbG9jayhibG9jayk7XG4gICAgICAgIGlmIChibG9jay5jbGFzc0xpc3QuY29udGFpbnMoJ3JhaW5ib3cnKSB8fCAhbGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBjYW5jZWxzIHRoZSBwZW5kaW5nIGFuaW1hdGlvbiB0byBmYWRlIHRoZSBjb2RlIGluIG9uIGxvYWRcbiAgICAgICAgLy8gc2luY2Ugd2Ugd2FudCB0byBkZWxheSBkb2luZyB0aGlzIHVudGlsIGl0IGlzIGFjdHVhbGx5XG4gICAgICAgIC8vIGhpZ2hsaWdodGVkXG4gICAgICAgIGJsb2NrLmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgICAgICAgYmxvY2suY2xhc3NMaXN0LmFkZCgncmFpbmJvdycpO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRvIGFsc28gYWRkIHRoZSBsb2FkaW5nIGNsYXNzIHRvIHRoZSBwcmUgdGFnXG4gICAgICAgIC8vIGJlY2F1c2UgdGhhdCBpcyBob3cgd2Ugd2lsbCBrbm93IHRvIHNob3cgYSBwcmVsb2FkZXJcbiAgICAgICAgaWYgKGJsb2NrLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ1BSRScpIHtcbiAgICAgICAgICAgIGJsb2NrLnBhcmVudE5vZGUuY2xhc3NMaXN0LmFkZCgnbG9hZGluZycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZ2xvYmFsQ2xhc3MgPSBibG9jay5nZXRBdHRyaWJ1dGUoJ2RhdGEtZ2xvYmFsLWNsYXNzJyk7XG4gICAgICAgIGNvbnN0IGRlbGF5ID0gcGFyc2VJbnQoYmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLWRlbGF5JyksIDEwKTtcblxuICAgICAgICArK3dhaXRpbmdPbi5jO1xuICAgICAgICBfbWVzc2FnZVdvcmtlcihfZ2V0V29ya2VyRGF0YShibG9jay5pbm5lckhUTUwsIHsgbGFuZ3VhZ2UsIGdsb2JhbENsYXNzLCBkZWxheSB9KSwgX2dlbmVyYXRlSGFuZGxlcihibG9jaywgd2FpdGluZ09uLCBjYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICh3YWl0aW5nT24uYyA9PT0gMCkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX2FkZFByZWxvYWRlcihwcmVCbG9jaykge1xuICAgIGNvbnN0IHByZWxvYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHByZWxvYWRlci5jbGFzc05hbWUgPSAncHJlbG9hZGVyJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICBwcmVsb2FkZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xuICAgIH1cbiAgICBwcmVCbG9jay5hcHBlbmRDaGlsZChwcmVsb2FkZXIpO1xufVxuXG4vKipcbiAqIEJyb3dzZXIgT25seSAtIFN0YXJ0IGhpZ2hsaWdodGluZyBhbGwgdGhlIGNvZGUgYmxvY2tzXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBub2RlICAgICAgIEhUTUxFbGVtZW50IHRvIHNlYXJjaCB3aXRoaW5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBfaGlnaGxpZ2h0KG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xuXG4gICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IGNhbiBiZSBhbiBFdmVudCBvciBhIERPTSBFbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSSB3YXMgb3JpZ2luYWxseSBjaGVja2luZyBpbnN0YW5jZW9mIEV2ZW50IGJ1dCB0aGF0IG1hZGUgaXQgYnJlYWtcbiAgICAvLyB3aGVuIHVzaW5nIG1vb3Rvb2xzLlxuICAgIC8vXG4gICAgLy8gQHNlZSBodHRwczovL2dpdGh1Yi5jb20vY2NhbXBiZWxsL3JhaW5ib3cvaXNzdWVzLzMyXG4gICAgbm9kZSA9IG5vZGUgJiYgdHlwZW9mIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUgPT09ICdmdW5jdGlvbicgPyBub2RlIDogZG9jdW1lbnQ7XG5cbiAgICBjb25zdCBwcmVCbG9ja3MgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwcmUnKTtcbiAgICBjb25zdCBjb2RlQmxvY2tzID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpO1xuICAgIGNvbnN0IGZpbmFsUHJlQmxvY2tzID0gW107XG4gICAgY29uc3QgZmluYWxDb2RlQmxvY2tzID0gW107XG5cbiAgICAvLyBGaXJzdCBsb29wIHRocm91Z2ggYWxsIHByZSBibG9ja3MgdG8gZmluZCB3aGljaCBvbmVzIHRvIGhpZ2hsaWdodFxuICAgIGZvciAoY29uc3QgcHJlQmxvY2sgb2YgcHJlQmxvY2tzKSB7XG4gICAgICAgIF9hZGRQcmVsb2FkZXIocHJlQmxvY2spO1xuXG4gICAgICAgIC8vIFN0cmlwIHdoaXRlc3BhY2UgYXJvdW5kIGNvZGUgdGFncyB3aGVuIHRoZXkgYXJlIGluc2lkZSBvZiBhIHByZVxuICAgICAgICAvLyB0YWcuICBUaGlzIG1ha2VzIHRoZSB0aGVtZXMgbG9vayBiZXR0ZXIgYmVjYXVzZSB5b3UgY2FuJ3RcbiAgICAgICAgLy8gYWNjaWRlbnRhbGx5IGFkZCBleHRyYSBsaW5lYnJlYWtzIGF0IHRoZSBzdGFydCBhbmQgZW5kLlxuICAgICAgICAvL1xuICAgICAgICAvLyBXaGVuIHRoZSBwcmUgdGFnIGNvbnRhaW5zIGEgY29kZSB0YWcgdGhlbiBzdHJpcCBhbnkgZXh0cmFcbiAgICAgICAgLy8gd2hpdGVzcGFjZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIDxwcmU+XG4gICAgICAgIC8vICAgICAgPGNvZGU+dmFyIGZvbyA9IHRydWU7PC9jb2RlPlxuICAgICAgICAvLyA8L3ByZT5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gd2lsbCBiZWNvbWU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIDxwcmU+PGNvZGU+dmFyIGZvbyA9IHRydWU7PC9jb2RlPjwvcHJlPlxuICAgICAgICAvL1xuICAgICAgICAvLyBJZiB5b3Ugd2FudCB0byBwcmVzZXJ2ZSB3aGl0ZXNwYWNlIHlvdSBjYW4gdXNlIGEgcHJlIHRhZyBvblxuICAgICAgICAvLyBpdHMgb3duIHdpdGhvdXQgYSBjb2RlIHRhZyBpbnNpZGUgb2YgaXQuXG4gICAgICAgIGlmIChwcmVCbG9jay5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAvLyBUaGlzIGZpeGVzIGEgcmFjZSBjb25kaXRpb24gd2hlbiBSYWluYm93LmNvbG9yIGlzIGNhbGxlZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHRoZSBwcmV2aW91cyBjb2xvciBjYWxsIGhhcyBmaW5pc2hlZC5cbiAgICAgICAgICAgIGlmICghcHJlQmxvY2suZ2V0QXR0cmlidXRlKCdkYXRhLXRyaW1tZWQnKSkge1xuICAgICAgICAgICAgICAgIHByZUJsb2NrLnNldEF0dHJpYnV0ZSgnZGF0YS10cmltbWVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcHJlQmxvY2suaW5uZXJIVE1MID0gcHJlQmxvY2suaW5uZXJIVE1MLnRyaW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIHByZSBibG9jayBoYXMgbm8gY29kZSBibG9ja3MgdGhlbiB3ZSBhcmUgZ29pbmcgdG8gd2FudCB0b1xuICAgICAgICAvLyBwcm9jZXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICBmaW5hbFByZUJsb2Nrcy5wdXNoKHByZUJsb2NrKTtcbiAgICB9XG5cbiAgICAvLyBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjczNTA2Ny9ob3ctdG8tY29udmVydC1hLWRvbS1ub2RlLWxpc3QtdG8tYW4tYXJyYXktaW4tamF2YXNjcmlwdFxuICAgIC8vIFdlIGFyZSBnb2luZyB0byBwcm9jZXNzIGFsbCA8Y29kZT4gYmxvY2tzXG4gICAgZm9yIChjb25zdCBjb2RlQmxvY2sgb2YgY29kZUJsb2Nrcykge1xuICAgICAgICBmaW5hbENvZGVCbG9ja3MucHVzaChjb2RlQmxvY2spO1xuICAgIH1cblxuICAgIF9oaWdobGlnaHRDb2RlQmxvY2tzKGZpbmFsQ29kZUJsb2Nrcy5jb25jYXQoZmluYWxQcmVCbG9ja3MpLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgdG8gbGV0IHlvdSBkbyBzdHVmZiBpbiB5b3VyIGFwcCBhZnRlciBhIHBpZWNlIG9mIGNvZGUgaGFzXG4gKiBiZWVuIGhpZ2hsaWdodGVkXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIG9uSGlnaGxpZ2h0KGNhbGxiYWNrKSB7XG4gICAgb25IaWdobGlnaHRDYWxsYmFjayA9IGNhbGxiYWNrO1xufVxuXG4vKipcbiAqIEV4dGVuZHMgdGhlIGxhbmd1YWdlIHBhdHRlcm4gbWF0Y2hlc1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSAgICAgICAgICAgIG5hbWUgb2YgbGFuZ3VhZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBsYW5ndWFnZVBhdHRlcm5zICAgIG9iamVjdCBvZiBwYXR0ZXJucyB0byBhZGQgb25cbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gaW5oZXJpdHMgIG9wdGlvbmFsIGxhbmd1YWdlIHRoYXQgdGhpcyBsYW5ndWFnZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGluaGVyaXQgcnVsZXMgZnJvbVxuICovXG5mdW5jdGlvbiBleHRlbmQobGFuZ3VhZ2UsIGxhbmd1YWdlUGF0dGVybnMsIGluaGVyaXRzKSB7XG5cbiAgICAvLyBJZiB3ZSBleHRlbmQgYSBsYW5ndWFnZSBhZ2FpbiB3ZSBzaG91bGRuJ3QgbmVlZCB0byBzcGVjaWZ5IHRoZVxuICAgIC8vIGluaGVyaXRlbmNlIGZvciBpdC4gRm9yIGV4YW1wbGUsIGlmIHlvdSBhcmUgYWRkaW5nIHNwZWNpYWwgaGlnaGxpZ2h0aW5nXG4gICAgLy8gZm9yIGEgamF2YXNjcmlwdCBmdW5jdGlvbiB0aGF0IGlzIG5vdCBpbiB0aGUgYmFzZSBqYXZhc2NyaXB0IHJ1bGVzLCB5b3VcbiAgICAvLyBzaG91bGQgYmUgYWJsZSB0byBkb1xuICAgIC8vXG4gICAgLy8gUmFpbmJvdy5leHRlbmQoJ2phdmFzY3JpcHQnLCBbIOKApiBdKTtcbiAgICAvL1xuICAgIC8vIFdpdGhvdXQgc3BlY2lmeWluZyBhIGxhbmd1YWdlIGl0IHNob3VsZCBpbmhlcml0IChnZW5lcmljIGluIHRoaXMgY2FzZSlcbiAgICBpZiAoIWluaGVyaXRlbmNlTWFwW2xhbmd1YWdlXSkge1xuICAgICAgICBpbmhlcml0ZW5jZU1hcFtsYW5ndWFnZV0gPSBpbmhlcml0cztcbiAgICB9XG5cbiAgICBwYXR0ZXJuc1tsYW5ndWFnZV0gPSBsYW5ndWFnZVBhdHRlcm5zLmNvbmNhdChwYXR0ZXJuc1tsYW5ndWFnZV0gfHwgW10pO1xufVxuXG5mdW5jdGlvbiByZW1vdmUobGFuZ3VhZ2UpIHtcbiAgICBkZWxldGUgaW5oZXJpdGVuY2VNYXBbbGFuZ3VhZ2VdO1xuICAgIGRlbGV0ZSBwYXR0ZXJuc1tsYW5ndWFnZV07XG59XG5cbi8qKlxuICogU3RhcnRzIHRoZSBtYWdpYyByYWluYm93XG4gKlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gY29sb3IoLi4uYXJncykge1xuXG4gICAgLy8gSWYgeW91IHdhbnQgdG8gc3RyYWlnaHQgdXAgaGlnaGxpZ2h0IGEgc3RyaW5nIHlvdSBjYW4gcGFzcyB0aGVcbiAgICAvLyBzdHJpbmcgb2YgY29kZSwgdGhlIGxhbmd1YWdlLCBhbmQgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyBSYWluYm93LmNvbG9yKGNvZGUsIGxhbmd1YWdlLCBmdW5jdGlvbihoaWdobGlnaHRlZENvZGUsIGxhbmd1YWdlKSB7XG4gICAgLy8gICAgIC8vIHRoaXMgY29kZSBibG9jayBpcyBub3cgaGlnaGxpZ2h0ZWRcbiAgICAvLyB9KTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHdvcmtlckRhdGEgPSBfZ2V0V29ya2VyRGF0YShhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICAgICAgX21lc3NhZ2VXb3JrZXIod29ya2VyRGF0YSwgKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgICBjYihkYXRhLnJlc3VsdCwgZGF0YS5sYW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KGFyZ3NbMl0pKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB5b3UgcGFzcyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoZW4gd2UgcmVydW4gdGhlIGNvbG9yIGZ1bmN0aW9uXG4gICAgLy8gb24gYWxsIHRoZSBjb2RlIGFuZCBjYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBvbiBjb21wbGV0ZS5cbiAgICAvL1xuICAgIC8vIEV4YW1wbGU6XG4gICAgLy9cbiAgICAvLyBSYWluYm93LmNvbG9yKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZygnQWxsIG1hdGNoaW5nIHRhZ3Mgb24gdGhlIHBhZ2UgYXJlIG5vdyBoaWdobGlnaHRlZCcpO1xuICAgIC8vIH0pO1xuICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBfaGlnaGxpZ2h0KDAsIGFyZ3NbMF0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHdlIHVzZSB3aGF0ZXZlciBub2RlIHlvdSBwYXNzZWQgaW4gd2l0aCBhbiBvcHRpb25hbFxuICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyLlxuICAgIC8vXG4gICAgLy8gRXhhbXBsZTpcbiAgICAvL1xuICAgIC8vIHZhciBwcmVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XG4gICAgLy8gdmFyIGNvZGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY29kZScpO1xuICAgIC8vIGNvZGVFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1sYW5ndWFnZScsICdqYXZhc2NyaXB0Jyk7XG4gICAgLy8gY29kZUVsZW1lbnQuaW5uZXJIVE1MID0gJy8vIEhlcmUgaXMgc29tZSBKYXZhU2NyaXB0JztcbiAgICAvLyBwcmVFbGVtZW50LmFwcGVuZENoaWxkKGNvZGVFbGVtZW50KTtcbiAgICAvLyBSYWluYm93LmNvbG9yKHByZUVsZW1lbnQsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAvLyBOZXcgZWxlbWVudCBpcyBub3cgaGlnaGxpZ2h0ZWRcbiAgICAvLyB9KTtcbiAgICAvL1xuICAgIC8vIElmIHlvdSBkb24ndCBwYXNzIGFuIGVsZW1lbnQgaXQgd2lsbCBkZWZhdWx0IHRvIGBkb2N1bWVudGBcbiAgICBfaGlnaGxpZ2h0KGFyZ3NbMF0sIGFyZ3NbMV0pO1xufVxuXG4vKipcbiAqIE1ldGhvZCB0byBhZGQgYW4gYWxpYXMgZm9yIGFuIGV4aXN0aW5nIGxhbmd1YWdlLlxuICpcbiAqIEZvciBleGFtcGxlIGlmIHlvdSB3YW50IHRvIGhhdmUgXCJjb2ZmZWVcIiBtYXAgdG8gXCJjb2ZmZWVzY3JpcHRcIlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NjYW1wYmVsbC9yYWluYm93L2lzc3Vlcy8xNTRcbiAqIEBwYXJhbSB7c3RyaW5nfSBhbGlhc1xuICogQHBhcmFtIHtzdHJpbmd9IG9yaWdpbmFsTGFuZ3VhZ2VcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGFkZEFsaWFzKGFsaWFzLCBvcmlnaW5hbExhbmd1YWdlKSB7XG4gICAgYWxpYXNlc1thbGlhc10gPSBvcmlnaW5hbExhbmd1YWdlO1xufVxuXG4vKipcbiAqIHB1YmxpYyBtZXRob2RzXG4gKi9cblJhaW5ib3cgPSB7XG4gICAgZXh0ZW5kLFxuICAgIHJlbW92ZSxcbiAgICBvbkhpZ2hsaWdodCxcbiAgICBhZGRBbGlhcyxcbiAgICBjb2xvclxufTtcblxuaWYgKGlzTm9kZSkge1xuICAgIFJhaW5ib3cuY29sb3JTeW5jID0gZnVuY3Rpb24oY29kZSwgbGFuZykge1xuICAgICAgICBjb25zdCB3b3JrZXJEYXRhID0gX2dldFdvcmtlckRhdGEoY29kZSwgbGFuZyk7XG4gICAgICAgIGNvbnN0IHByaXNtID0gbmV3IFByaXNtKHdvcmtlckRhdGEub3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBwcmlzbS5yZWZyYWN0KHdvcmtlckRhdGEuY29kZSwgd29ya2VyRGF0YS5sYW5nKTtcbiAgICB9O1xufVxuXG4vLyBJbiB0aGUgYnJvd3NlciBob29rIGl0IHVwIHRvIGNvbG9yIG9uIHBhZ2UgbG9hZFxuaWYgKCFpc05vZGUgJiYgIWlzV29ya2VyKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIVJhaW5ib3cuZGVmZXIpIHtcbiAgICAgICAgICAgIFJhaW5ib3cuY29sb3IoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSwgZmFsc2UpO1xufVxuXG4vLyBGcm9tIGEgbm9kZSB3b3JrZXIsIGhhbmRsZSB0aGUgcG9zdE1lc3NhZ2UgcmVxdWVzdHMgdG8gaXRcbmlmIChpc1dvcmtlcikge1xuICAgIHNlbGYub25tZXNzYWdlID0gcmFpbmJvd1dvcmtlcjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgUmFpbmJvdztcbiJdLCJuYW1lcyI6WyJpc05vZGUiLCJpc1dvcmtlciIsImxldCIsImNvbnN0IiwidXRpbElzTm9kZSIsInV0aWxJc1dvcmtlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBQ08sU0FBU0EsUUFBTSxHQUFHOztRQUVyQixPQUFPLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxPQUFPLE1BQU0sQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDO0tBQzlFOztBQUVELEFBQU8sSUFBQSxTQUFTQyxVQUFRLEdBQUc7UUFDdkIsT0FBTyxPQUFPLFFBQVEsS0FBSyxXQUFXLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxDQUFDO0tBQ3pFOzs7Ozs7OztBQVFELEFBQU8sSUFBQSxTQUFTLG1CQUFtQixDQUFDLEtBQUssRUFBRTs7Ozs7OztRQU92Q0MsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQzs7Ozs7O1FBTXJHLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDWEMsSUFBTSxPQUFPLEdBQUcsdUJBQXVCLENBQUM7WUFDeENBLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7WUFFMUYsSUFBSSxLQUFLLEVBQUU7Z0JBQ1AsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN2QjtTQUNKOztRQUVELElBQUksUUFBUSxFQUFFO1lB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