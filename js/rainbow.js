/**
 * Copyright 2014 Craig Campbell
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
 * @preserve @version 1.2
 * @url rainbowco.de
 */
(function(global) {
    /**
     * an array of the language patterns specified for each language
     *
     * @type {Object}
     */
    var languagePatterns = {},

        /**
         * an array of languages and whether they should bypass the default patterns
         *
         * @type {Object}
         */
        bypassDefaults = {},

        /**
         * constant used to refer to the default language
         *
         * @type {number}
         */
        DEFAULT_LANGUAGE = 0,

        /**
         * @type {null|string}
         */
        globalClass,

        /**
         * @type {null|Function}
         */
        onHighlight,

        /**
         * @type Worker
         */
        worker,

        /**
         * @type {Boolean}
         */
        isWorker = typeof document === 'undefined';

    /**
     * gets the language for this block of code
     *
     * @param {Element} block
     * @returns {string|null}
     */
    function _getLanguageForBlock(block) {

        // if this doesn't have a language but the parent does then use that
        // this means if for example you have: <pre data-language="php">
        // with a bunch of <code> blocks inside then you do not have
        // to specify the language for each block
        var language = block.getAttribute('data-language') || block.parentNode.getAttribute('data-language');

        // this adds support for specifying language via a css class
        // you can use the Google Code Prettify style: <pre class="lang-php">
        // or the HTML5 style: <pre><code class="language-php">
        if (!language) {
            var pattern = /\blang(?:uage)?-(\w+)/,
                match = block.className.match(pattern) || block.parentNode.className.match(pattern);

            if (match) {
                language = match[1];
            }
        }

        if (language) {
            return language.toLowerCase();
        }
    }

    /**
     * makes sure html entities are always used for tags
     *
     * @param {string} code
     * @returns {string}
     */
    function _htmlEntities(code) {
        return code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&(?![\w\#]+;)/g, '&amp;');
    }

    /**
     * determines if a new match intersects with an existing one
     *
     * @param {number} start1    start position of existing match
     * @param {number} end1      end position of existing match
     * @param {number} start2    start position of new match
     * @param {number} end2      end position of new match
     * @returns {boolean}
     */
    function _intersects(start1, end1, start2, end2) {
        if (start2 >= start1 && start2 < end1) {
            return true;
        }

        return end2 > start1 && end2 < end1;
    }

    /**
     * determines if two different matches have complete overlap with each other
     *
     * @param {number} start1   start position of existing match
     * @param {number} end1     end position of existing match
     * @param {number} start2   start position of new match
     * @param {number} end2     end position of new match
     * @returns {boolean}
     */
    function _hasCompleteOverlap(start1, end1, start2, end2) {

        // if the starting and end positions are exactly the same
        // then the first one should stay and this one should be ignored
        if (start2 == start1 && end2 == end1) {
            return false;
        }

        return start2 <= start1 && end2 >= end1;
    }

    /**
     * takes a string of code and wraps it in a span tag based on the name
     *
     * @param {string} name     name of the pattern (ie keyword.regex)
     * @param {string} code     block of code to wrap
     * @returns {string}
     */
    function _wrapCodeInSpan(name, code) {
        return '<span class="' + name.replace(/\./g, ' ') + (globalClass ? ' ' + globalClass : '') + '">' + code + '</span>';
    }

    /**
     * finds out the position of group match for a regular expression
     *
     * @see http://stackoverflow.com/questions/1985594/how-to-find-index-of-groups-in-match
     *
     * @param {Object} match
     * @param {number} groupNumber
     * @returns {number}
     */
    function _indexOfGroup(match, groupNumber) {
        var index = 0,
            i;

        for (i = 1; i < groupNumber; ++i) {
            if (match[i]) {
                index += match[i].length;
            }
        }

        return index;
    }

    /**
     * should a language bypass the default patterns?
     *
     * if you call Rainbow.extend() and pass true as the third argument
     * it will bypass the defaults
     */
    function _bypassDefaultPatterns(language)
    {
        return bypassDefaults[language];
    }

    /**
     * returns a list of regex patterns for this language
     *
     * @param {string} language
     * @returns {Array}
     */
    function _getPatternsForLanguage(language) {
        var patterns = languagePatterns[language] || [],
            defaultPatterns = languagePatterns[DEFAULT_LANGUAGE] || [];

        return _bypassDefaultPatterns(language) ? patterns : patterns.concat(defaultPatterns);
    }

    /**
     * substring replace call to replace part of a string at a certain position
     *
     * @param {number} position         the position where the replacement should happen
     * @param {string} replace          the text we want to replace
     * @param {string} replaceWith      the text we want to replace it with
     * @param {string} code             the code we are doing the replacing in
     * @returns {string}
     */
    function _replaceAtPosition(position, replace, replaceWith, code) {
        var subString = code.substr(position);
        return code.substr(0, position) + subString.replace(replace, replaceWith);
    }

   /**
     * sorts an object by index descending
     *
     * @param {Object} object
     * @return {Array}
     */
    function keys(object) {
        var locations = [];

        for(var location in object) {
            if (object.hasOwnProperty(location)) {
                locations.push(location);
            }
        }

        // numeric descending
        return locations.sort(function(a, b) {
            return b - a;
        });
    }

    function Raindrop() {
        /**
         * array of replacements to process at the end
         *
         * @type {Object}
         */
        var replacements = {};

        /**
         * an array of start and end positions of blocks to be replaced
         *
         * @type {Object}
         */
        var replacementPositions = {};

        /**
         * processing level
         *
         * replacements are stored at this level so if there is a sub block of code
         * (for example php inside of html) it runs at a different level
         *
         * @type {number}
         */
        var currentLevel = 0;

        /**
         * determines if the match passed in falls inside of an existing match
         * this prevents a regex pattern from matching inside of a bigger pattern
         *
         * @param {number} start - start position of new match
         * @param {number} end - end position of new match
         * @returns {boolean}
         */
        function _matchIsInsideOtherMatch(start, end) {
            for (var key in replacementPositions[currentLevel]) {
                key = parseInt(key, 10);

                // if this block completely overlaps with another block
                // then we should remove the other block and return false
                if (_hasCompleteOverlap(key, replacementPositions[currentLevel][key], start, end)) {
                    delete replacementPositions[currentLevel][key];
                    delete replacements[currentLevel][key];
                }

                if (_intersects(key, replacementPositions[currentLevel][key], start, end)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * process replacements in the string of code to actually update the markup
         *
         * @param {string} code         the code to process replacements in
         * @returns void
         */
        function _processReplacements(code) {
            var positions = keys(replacements[currentLevel]);
            for (var i = 0; i < positions.length; i++) {
                var pos = positions[i];
                var replacement = replacements[currentLevel][pos];
                code = _replaceAtPosition(pos, replacement['replace'], replacement['with'], code);
            }
            return code;
        }

        /**
         * matches a regex pattern against a block of code
         * finds all matches that should be processed and stores the positions
         * of where they should be replaced within the string
         *
         * this is where pretty much all the work is done but it should not
         * be called directly
         *
         * @param {Object} pattern
         * @param {string} code
         * @returns void
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

            // treat match 0 the same way as name
            if (!pattern['name'] && typeof pattern['matches'][0] == 'string') {
                pattern['name'] = pattern['matches'][0];
                delete pattern['matches'][0];
            }

            var replacement = match[0];
            var startPos = match.index;
            var endPos = match[0].length + startPos;

            // if this is not a child match and it falls inside of another
            // match that already happened we should skip it and continue processing
            if (_matchIsInsideOtherMatch(startPos, endPos)) {
                _processPattern(pattern, code);
                return;
            }

            /**
             * callback for when a match was successfully processed
             *
             * @param {string} replacement
             * @returns void
             */
            function onMatchSuccess(replacement) {
                // if this match has a name then wrap it in a span tag
                if (pattern['name']) {
                    replacement = _wrapCodeInSpan(pattern['name'], replacement);
                }

                // console.log('LEVEL ' + currentLevel + ' replace ' + match[0] + ' with ' + replacement + ' at position ' + startPos + ' to ' + endPos);

                // store what needs to be replaced with what at this position
                if (!replacements[currentLevel]) {
                    replacements[currentLevel] = {};
                    replacementPositions[currentLevel] = {};
                }

                replacements[currentLevel][startPos] = {
                    'replace': match[0],
                    'with': replacement
                };

                // store the range of this match so we can use it for comparisons
                // with other matches later
                replacementPositions[currentLevel][startPos] = endPos;

                _processPattern(pattern, code);
            }

            /**
             * callback for processing a sub group
             *
             * @param {number} i
             * @param {Array} groupKeys
             * @param {Function} callback
             */
            function _processGroup(groupKey) {
                var block = match[groupKey];

                // if there is no match here then move on
                if (!block) {
                    return;
                }

                var group = pattern['matches'][groupKey];
                var language = group['language'];

                /**
                 * process group is what group we should use to actually process
                 * this match group
                 *
                 * for example if the subgroup pattern looks like this
                 * 2: {
                 *     'name': 'keyword',
                 *     'pattern': /true/g
                 * }
                 *
                 * then we use that as is, but if it looks like this
                 *
                 * 2: {
                 *     'name': 'keyword',
                 *     'matches': {
                 *          'name': 'special',
                 *          'pattern': /whatever/g
                 *      }
                 * }
                 *
                 * we treat the 'matches' part as the pattern and keep
                 * the name around to wrap it with later
                 */
                var groupToProcess = group['name'] && group['matches'] ? group['matches'] : group;

                /**
                 * takes the code block matched at this group, replaces it
                 * with the highlighted block, and optionally wraps it with
                 * a span with a name
                 *
                 * @param {string} block
                 * @param {string} replaceBlock
                 * @param {string|null} matchName
                 */
                var _getReplacement = function(block, replaceBlock, matchName) {
                    replacement = _replaceAtPosition(_indexOfGroup(match, groupKey), block, matchName ? _wrapCodeInSpan(matchName, replaceBlock) : replaceBlock, replacement);
                    return replacement;
                };

                var localCode;

                // if this is a sublanguage go and process the block using that language
                if (language) {
                    localCode = _highlightBlockForLanguage(block, language);
                    _getReplacement(block, localCode);
                    return;
                }

                // if this is a string then this match is directly mapped to selector
                // so all we have to do is wrap it in a span and continue
                if (typeof group === 'string') {
                    _getReplacement(block, block, group);
                    return;
                }

                // the process group can be a single pattern or an array of patterns
                // _processCodeWithPatterns always expects an array so we convert it here
                localCode = _processCodeWithPatterns(block, groupToProcess.length ? groupToProcess : [groupToProcess]);
                _getReplacement(block, localCode, group['matches'] ? group['name'] : 0);
            }

            // if this pattern has sub matches for different groups in the regex
            // then we should process them one at a time by rerunning them through
            // this function to generate the new replacement
            //
            // we run through them backwards because the match position of earlier
            // matches will not change depending on what gets replaced in later
            // matches
            var groupKeys = keys(pattern['matches']);
            for (var i = 0; i < groupKeys.length; i++) {
                _processGroup(groupKeys[i]);
            }

            onMatchSuccess(replacement);
        }

        /**
         * takes a string of code and highlights it according to the language specified
         *
         * @param {string} code
         * @param {string} language
         * @param {Function} onComplete
         * @returns void
         */
        function _highlightBlockForLanguage(code, language) {
            var patterns = _getPatternsForLanguage(language);
            return _processCodeWithPatterns(_htmlEntities(code), patterns);
        }

        /**
         * processes a block of code using specified patterns
         *
         * @param {string} code
         * @param {Array} patterns
         * @returns void
         */
        function _processCodeWithPatterns(code, patterns) {
            // we have to increase the level here so that the
            // replacements will not conflict with each other when
            // processing sub blocks of code
            ++currentLevel;

            for (var i = 0; i < patterns.length; i++) {
                _processPattern(patterns[i], code);
            }

            // we are done processing the patterns
            // process the replacements and update the DOM
            code = _processReplacements(code);

            // when we are done processing replacements
            // we are done at this level so we can go back down
            delete replacements[currentLevel];
            delete replacementPositions[currentLevel];
            --currentLevel;

            return code;
        }

        return {
            refract: _highlightBlockForLanguage
        };
    }

    function _handleMessageFromRainbow(message) {
        languagePatterns = message.data.languagePatterns;
        bypassDefaults = message.data.bypassDefaults;
        var drop = new Raindrop();
        var result = drop.refract(message.data.code, message.data.lang);
        postMessage({
            id: message.data.id,
            result: result
        });
    }

    function _handleResponseFromWorker(message) {
        var element = document.querySelector('.' + message.data.id);
        if (element) {
            element.innerHTML = message.data.result;
        }
    }

    function _highlightCodeBlocks(codeBlocks, onComplete) {
        for (var i = 0; i < codeBlocks.length; i++) {
            var block = codeBlocks[i];
            var language = _getLanguageForBlock(block);

            if (block.classList.contains('rainbow') || !language) {
                continue;
            }

            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            var uniqueId = randLetter.toLowerCase() + Date.now();
            block.classList.add(uniqueId);

            worker.postMessage({
                id: uniqueId,
                lang: language,
                code: block.innerHTML,
                languagePatterns: languagePatterns,
                bypassDefaults: bypassDefaults
            });
        }
    }

    /**
     * start highlighting all the code blocks
     *
     * @returns void
     */
    function _highlight(node, onComplete) {

        // the first argument can be an Event or a DOM Element
        // I was originally checking instanceof Event but that makes it break
        // when using mootools
        //
        // @see https://github.com/ccampbell/rainbow/issues/32
        //
        node = node && typeof node.getElementsByTagName == 'function' ? node : document;

        var preBlocks = node.getElementsByTagName('pre'),
            codeBlocks = node.getElementsByTagName('code'),
            i,
            finalPreBlocks = [],
            finalCodeBlocks = [];

        // first loop through all pre blocks to find which ones to highlight
        // also strip whitespace
        for (i = 0; i < preBlocks.length; ++i) {

            // strip whitespace around code tags when they are inside of a pre tag
            // this makes the themes look better because you can't accidentally
            // add extra linebreaks at the start and end
            //
            // when the pre tag contains a code tag then strip any extra whitespace
            // for example
            // <pre>
            //      <code>var foo = true;</code>
            // </pre>
            //
            // will become
            // <pre><code>var foo = true;</code></pre>
            //
            // if you want to preserve whitespace you can use a pre tag on its own
            // without a code tag inside of it
            if (preBlocks[i].getElementsByTagName('code').length) {
                preBlocks[i].innerHTML = preBlocks[i].innerHTML.replace(/^\s+/, '').replace(/\s+$/, '');
                continue;
            }

            // if the pre block has no code blocks then we are going to want to
            // process it directly
            finalPreBlocks.push(preBlocks[i]);
        }

        // @see http://stackoverflow.com/questions/2735067/how-to-convert-a-dom-node-list-to-an-array-in-javascript
        // we are going to process all <code> blocks
        for (i = 0; i < codeBlocks.length; ++i) {
            finalCodeBlocks.push(codeBlocks[i]);
        }

        _highlightCodeBlocks(finalCodeBlocks.concat(finalPreBlocks), onComplete);
    }

    /**
     * extends the language pattern matches
     *
     * @param {*} language     name of language
     * @param {*} patterns      array of patterns to add on
     * @param {boolean|null} bypass      if true this will bypass the default language patterns
     */
    function _extend(language, patterns, bypass) {

        // if there is only one argument then we assume that we want to
        // extend the default language rules
        if (arguments.length == 1) {
            patterns = language;
            language = DEFAULT_LANGUAGE;
        }

        bypassDefaults[language] = bypass;
        languagePatterns[language] = patterns.concat(languagePatterns[language] || []);
    }

    /**
     * call back to let you do stuff in your app after a piece of code has been highlighted
     *
     * @param {Function} callback
     */
    function _onHighlight(callback) {
        onHighlight = callback;
    }

    /**
     * method to set a global class that will be applied to all spans
     *
     * @param {string} className
     */
    function _addGlobalClass(className) {
        globalClass = className;
    }

    /**
     * starts the magic rainbow
     *
     * @returns void
     */
    function _color() {

        // if you want to straight up highlight a string you can pass the string of code,
        // the language, and a callback function
        if (typeof arguments[0] == 'string') {
            var drop = new Raindrop();
            var result = drop.refract(arguments[0], arguments[1]);
            if (arguments[2]) {
                arguments[2](result);
            }
        }

        // if you pass a callback function then we rerun the color function
        // on all the code and call the callback function on complete
        if (typeof arguments[0] == 'function') {
            return _highlight(0, arguments[0]);
        }

        // otherwise we use whatever node you passed in with an optional
        // callback function as the second parameter
        _highlight(arguments[0], arguments[1]);
    }

    /**
     * public methods
     */
    var _rainbow = {
        extend: _extend,
        onHighlight: _onHighlight,
        addClass: _addGlobalClass,
        color: _color
    };

    // @see http://stackoverflow.com/questions/5408406/web-workers-without-a-separate-javascript-file
    if (!isWorker && typeof Worker !== 'undefined') {
        var id = Date.now();
        document.write('<script id="wts' + id + '"></script>');
        var src = document.getElementById('wts' + id).previousSibling.src;
        worker = new Worker(src);
        worker.addEventListener('message', _handleResponseFromWorker, false);
    }

    global.Rainbow = _rainbow;

    /**
     * adds event listener to start highlighting
     */
    if (!isWorker && document.addEventListener) {
        return document.addEventListener('DOMContentLoaded', _rainbow.color, false);
    }

    if (isWorker) {
        self.addEventListener('message', _handleMessageFromRainbow);
    }
}) (this);
