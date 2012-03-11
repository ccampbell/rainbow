/**
 * Rainbow is a simple code syntax highlighter
 *
 * @author Craig Campbell <iamcraigcampbell@gmail.com>
 */
window.Rainbow = (function() {

    /**
     * array of replacements and positions
     *
     * @var {Object}
     */
    var replacements = {},
        replacement_positions = {},
        language_patterns = {},
        bypass_defaults = {},
        CURRENT_LEVEL = 0,
        DEFAULT_LANGUAGE = 0;

    /**
     * cross browser get attribute for an element
     *
     * @see http://stackoverflow.com/questions/3755227/cross-browser-javascript-getattribute-method
     *
     * @param {Object} element
     * @param {String} attribute you are trying to get
     * @returns {String}
     */
    function _attr(el, attr) {
        var result = (el.getAttribute && el.getAttribute(attr)) || null;

        if (!result) {
            var attrs = el.attributes,
                length = attrs.length,
                i;

            for(i = 0; i < length; ++i) {
                if (attr[i].nodeName === attr) {
                    result = attr[i].nodeValue;
                }
            }
        }

        return result;
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
        if (start2 == start1 && end2 == end1) {
            return false;
        }

        return start2 <= start1 && end2 >= end1;
    }

    /**
     * determines if the match passed in falls inside of an existing match
     * this prevents a regex pattern from matching inside of a bigger pattern
     *
     * @param {number} start - start position of new match
     * @param {number} end - end position of new match
     * @returns {boolean}
     */
    function _matchIsInsideOtherMatch(start, end) {
        for (var key in replacement_positions[CURRENT_LEVEL]) {

            // if this block completely overlaps with another block
            // then we should remove the other block and return false
            if (_hasCompleteOverlap(key, replacement_positions[CURRENT_LEVEL][key], start, end)) {
                delete replacement_positions[CURRENT_LEVEL][key];
                delete replacements[CURRENT_LEVEL][key];
            }

            if (_intersects(key, replacement_positions[CURRENT_LEVEL][key], start, end)) {
                return true;
            }
        }

        return false;
    }

    /**
     * takes a string of code and wraps it in a span tag based on the name
     *
     * @param {string} name     name of the pattern (ie keyword.regex)
     * @param {string} code     block of code to wrap
     * @returns {string}
     */
    function _wrapCodeInSpan(name, code) {
        return '<span class="' + name.replace(/\./g, ' ') + '">' + code + '</span>';
    }

    function _indexOfGroup(match, group_number) {
        var index= match.index;
        for (var i = 1; i < group_number; ++i) {
            index += match[i].length;
        }
        return index;
    }

    /**
     * matches a regex pattern against a block of code
     * finds all matches that should be processed and stores the positions
     * of where they should be replaced within the string
     *
     * this is where pretty much all the work is done but it should not
     * be called directly
     *
     * @param {RegExp} pattern
     * @param {string} code
     * @returns void
     */
    function _processPattern(pattern, code) {
        var regex = pattern['pattern'],
            match = regex.exec(code),
            replacement,
            group,
            start_pos,
            end_pos;

        // continue looping through until all matches are found in the string
        while (match !== null) {

            // this is the entire match
            replacement = match[0];
            start_pos = match.index;
            end_pos = match[0].length + start_pos;

            // if this is not a child match and it falls inside of another
            // match that already happened we should skip it and continue processing
            if (_matchIsInsideOtherMatch(start_pos, end_pos)) {
                // console.warn(match);
                match = regex.exec(code);
                continue;
            }

            // if this pattern has sub matches for different groups in the regex
            // then we should process them one at a time by rerunning them through
            // this function to generate the new replacement
            var group_keys = keys(pattern['matches']);
            for (var i = 0; i < group_keys.length; ++i) {

                if (!match[group_keys[i]]) {
                    continue;
                }

                group = pattern['matches'][group_keys[i]];

                /*
                if this is a sublanguage go and process the block using that language
                this is specified by using:

                'matches': {
                    1: {
                        'language': 'language_name'
                    }
                }
                */
                var language = group['language'];
                if (language) {
                    replacement = replacement.replace(match[group_keys[i]], _highlightBlockForLanguage(match[group_keys[i]], language));
                    continue;
                }

                /*
                if this is a submatch go and process the block using the specified pattern
                this is specified by using:

                'matches': {
                     1: {
                         'name': 'match.name',
                         'pattern': /regex/g
                     }
                }
                */
                var name = group['name'];
                if (name) {
                    replacement = replacement.replace(match[group_keys[i]], _processCodeWithPatterns(match[group_keys[i]],[{
                        'name': group['name'],
                        'pattern': group['pattern']
                    }]));
                    continue;
                }

                var group_match_position = _indexOfGroup(match, group_keys[i]) - match.index;
                replacement = _replaceAtPosition(group_match_position, match[group_keys[i]], _wrapCodeInSpan(group, match[group_keys[i]]), replacement);

            }

            // if this match has a name then wrap it in a span tag
            if (pattern['name']) {
                replacement = _wrapCodeInSpan(pattern['name'], replacement);
            }

            // console.log('LEVEL', CURRENT_LEVEL, 'replace', match[0], 'with', replacement, 'at position', start_pos, 'to', end_pos);

            // store what needs to be replaced with what at this position
            if (!replacements[CURRENT_LEVEL]) {
                replacements[CURRENT_LEVEL] = {};
                replacement_positions[CURRENT_LEVEL] = {};
            }

            replacements[CURRENT_LEVEL][start_pos] = {
                'replace': match[0],
                'with': replacement
            };

            // store the range of this match so we can use it for comparisons
            // with other matches later
            replacement_positions[CURRENT_LEVEL][start_pos] = end_pos;

            // find the next match and continue on in this loop
            match = regex.exec(code);
        }
    }

    /**
     * should a language bypass the default patterns?
     *
     * if you call Rainbow.extend() and pass true as the third argument
     * it will bypass the defaults
     */
    function _bypassDefaultPatterns(language)
    {
        return bypass_defaults[language] == 1;
    }

    /**
     * returns a list of regex patterns for this language
     *
     * @param {string} language
     * @returns {Array}
     */
    function _getPatternsForLanguage(language) {
        var patterns = language_patterns[language] || [],
            default_patterns = language_patterns[DEFAULT_LANGUAGE];

        if (_bypassDefaultPatterns(language)) {
            return patterns;
        }

        return patterns.concat(default_patterns);
    }

    /**
     * substring replace call to replace part of a string at a certain position
     *
     * @param {number} position         the position where the replacement should happen
     * @param {string} replace          the text we want to replace
     * @param {string} replace_with     the text we want to replace it with
     * @param {string} code             the code we are doing the replacing in
     * @returns {string}
     */
    function _replaceAtPosition(position, replace, replace_with, code) {
        var sub_string = code.substr(position);
        code = code.replace(sub_string, sub_string.replace(replace, replace_with));
        return code;
    }

   /**
     * sorts an object by index descending
     *
     * @param {Object} object
     * @return {array}
     */
    function keys(object) {
        var locations = [],
            replacement,
            pos;

        for(var location in object) {
            if (object.hasOwnProperty(location)) {
                locations.push(location);
            }
        }

        // numeric descending
        return locations.sort(function(a,b) {
            return b - a;
        });
    }

    /**
     * processes a block of code using specified patterns
     *
     * @param {string} code
     * @param {array} patterns
     * @returns {string}
     */
    function _processCodeWithPatterns(code, patterns)
    {
        // we have to increase the level here so that the
        // replacements will not conflict with each other when
        // processing sub blocks of code
        ++CURRENT_LEVEL;

        // process all the regex patterns
        for (var i = 0; i < patterns.length; ++i) {
            _processPattern(patterns[i], code);
        }

        // actually do the replacing
        var string_positions = keys(replacements[CURRENT_LEVEL]);
        for (i = 0; i < string_positions.length; ++i) {
            pos = string_positions[i];
            replacement = replacements[CURRENT_LEVEL][pos];
            code = _replaceAtPosition(pos, replacement['replace'], replacement['with'], code);
        }

        // we are done at this level so we can go back down
        delete replacements[CURRENT_LEVEL];
        delete replacement_positions[CURRENT_LEVEL];
        --CURRENT_LEVEL;

        return code;
    }

    /**
     * takes a string of code and highlights it according to the language specified
     *
     * @param {string} code
     * @param {string} language
     * @returns {string}
     */
    function _highlightBlockForLanguage(code, language) {
        var patterns = _getPatternsForLanguage(language);
        code = _processCodeWithPatterns(code, patterns);
        return code;
    }

    /**
     * highlight an individual code block
     *
     * @param {Element} code_block
     * @returns void
     */
    function _highlightCodeBlock(code_block) {
        var language = _attr(code_block, 'data-language').toLowerCase();

        if (language) {
            code_block.className = language;

            var code = _highlightBlockForLanguage(code_block.innerHTML, language);

            code_block.innerHTML = code;

            // reset the replacement arrays
            replacements = {};
            replacement_positions = {};
        }
    }

    /**
     * start highlighting all the code blocks
     *
     * @returns void
     */
    function _highlight() {
        var code_blocks = document.getElementsByTagName('code'),
            i;

        for (i = 0; i < code_blocks.length; ++i) {
            _highlightCodeBlock(code_blocks[i]);
        }
    }

    return {

        /**
         * extends the language pattern matches
         *
         * @param {string} language     name of language
         * @param {Array} patterns      array of patterns to add on
         * @param {boolean} bypass      if true this will bypass the default language patterns
         */
        extend: function(language, patterns, bypass) {

            // if there is only one argument then we assume that we want to
            // extend the default language rules
            if (arguments.length == 1) {
                patterns = language;
                language = DEFAULT_LANGUAGE;
            }

            if (bypass) {
                bypass_defaults[language] = 1;
            }

            language_patterns[language] = patterns.concat(language_patterns[language] || []);
        },

        /**
         * starts the magic rainbow
         *
         * @returns void
         */
        init: function() {
            _highlight();
        }
    };
}) ();


/**
 * adds event listener to start highlighting
 */
(function (w) {
    if (w.addEventListener) {
        return w.addEventListener('load', Rainbow.init, false);
    }
    w.attachEvent('onload', Rainbow.init);
}) (window);


/**
 * add the default language patterns
 */
Rainbow.extend([
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\/|\/\/[\s\S]*?$|\#[\s\S]*?$/gm
    },
    {
        'matches': {
            2: 'string'
        },
        'pattern': /(\(|\s|\[)(('|")[\s\S]*?(\3))/gm
    },
    {
        'name': 'integer',
        'pattern': /\b(0x[\da-f]+|\d+)\b/g
    },
    {
        'name': 'constant',
        'pattern': /\b[A-Z0-9_]{2,}\b/g
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(and|or|xor|import|print|echo|def|for|do|while|foreach|as|return|die|exit|if|then|else|elseif|new|delete|try|throw|catch|finally|class|function|string|array|object|resource|var|bool|boolean|int|integer|float|double|real|string|array|global|const|static|public|private|protected|published|extends|switch|void|this|self|struct|char|signed|unsigned|short|long)(\(|\b)/g
    },
    {
        'name': 'constant.language',
        'pattern': /true|false|null/g
    },
    {
        'name': 'keyword.operator',
        'pattern': /\+|\!|\-|&gt;|&lt;|&amp;|\||\*|\=/g
    },
    {
        'matches': {
            1: 'function.call'
        },
        'pattern': /(\w+?)(?=\()/g
    },
    {
        'matches': {
            1: 'keyword',
            2: 'meta.function-call'
        },
        'pattern': /(function)\s(.*?)(?=\()/g
    }
]);
