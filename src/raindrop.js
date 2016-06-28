import * as util from './util';

/**
 * Raindrop is a class used to highlight individual blocks of code
 *
 * @class
 */
class Raindrop {
    constructor(options) {
        /**
         * Object of replacements to process at the end of the processing
         *
         * @type {Object}
         */
        const replacements = {};

        /**
         * Language associated with this Raindrop object
         *
         * @type {string}
         */
        let currentLanguage;

        /**
         * Object of start and end positions of blocks to be replaced
         *
         * @type {Object}
         */
        const replacementPositions = {};

        /**
         * Determines if the match passed in falls inside of an existing match.
         * This prevents a regex pattern from matching inside of another pattern
         * that matches a larger amount of code.
         *
         * For example this prevents a keyword from matching `function` if there
         * is already a match for `function (.*)`.
         *
         * @param {number} start    start position of new match
         * @param {number} end      end position of new match
         * @return {boolean}
         */
        function _matchIsInsideOtherMatch(start, end) {
            for (let key in replacementPositions) {
                key = parseInt(key, 10);

                // If this block completely overlaps with another block
                // then we should remove the other block and return `false`.
                if (util.hasCompleteOverlap(key, replacementPositions[key], start, end)) {
                    delete replacementPositions[key];
                    delete replacements[key];
                }

                if (util.intersects(key, replacementPositions[key], start, end)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Takes a string of code and wraps it in a span tag based on the name
         *
         * @param {string} name        name of the pattern (ie keyword.regex)
         * @param {string} code        block of code to wrap
         * @param {string} globalClass class to apply to every span
         * @return {string}
         */
        function _wrapCodeInSpan(name, code) {
            const globalClass = options.globalClass;
            return `<span class="${name.replace(/\./g, ' ')}${(globalClass ? ` ${globalClass}` : '')}">${code}</span>`;
        }

        /**
         * Process replacements in the string of code to actually update
         * the markup
         *
         * @param {string} code         the code to process replacements in
         * @return {string}
         */
        function _processReplacements(code) {
            const positions = util.keys(replacements);
            for (const position of positions) {
                const replacement = replacements[position];
                code = util.replaceAtPosition(position, replacement.replace, replacement.with, code);
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
            const regex = pattern.pattern;
            if (!regex) {
                return;
            }

            const match = regex.exec(code);
            if (!match) {
                return;
            }

            // Treat match 0 the same way as name
            if (!pattern.name && typeof pattern.matches[0] === 'string') {
                pattern.name = pattern.matches[0];
                delete pattern.matches[0];
            }

            let replacement = match[0];
            const startPos = match.index;
            const endPos = match[0].length + startPos;

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
             * @param {number} groupKey      index of group
             * @return {void}
             */
            function _processGroup(groupKey) {
                const block = match[groupKey];

                // If there is no match here then move on
                if (!block) {
                    return;
                }

                const group = pattern.matches[groupKey];
                const language = group.language;

                /**
                 * Process group is what group we should use to actually process
                 * this match group.
                 *
                 * For example if the subgroup pattern looks like this:
                 *
                 * 2: {
                 *     'name': 'keyword',
                 *     'pattern': /true/g
                 * }
                 *
                 * then we use that as is, but if it looks like this:
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
                const groupToProcess = group.name && group.matches ? group.matches : group;

                /**
                 * Takes the code block matched at this group, replaces it
                 * with the highlighted block, and optionally wraps it with
                 * a span with a name
                 *
                 * @param {string} passedBlock
                 * @param {string} replaceBlock
                 * @param {string|null} matchName
                 */
                const _getReplacement = function(passedBlock, replaceBlock, matchName) {
                    replacement = util.replaceAtPosition(util.indexOfGroup(match, groupKey), passedBlock, matchName ? _wrapCodeInSpan(matchName, replaceBlock) : replaceBlock, replacement);
                    return;
                };

                // If this is a string then this match is directly mapped
                // to selector so all we have to do is wrap it in a span
                // and continue.
                if (typeof group === 'string') {
                    _getReplacement(block, block, group);
                    return;
                }

                let localCode;
                const drop = new Raindrop(options);

                // If this is a sublanguage go and process the block using
                // that language
                if (language) {
                    localCode = drop.refract(block, language);
                    _getReplacement(block, localCode);
                    return;
                }

                // The process group can be a single pattern or an array of
                // patterns. `_processCodeWithPatterns` always expects an array
                // so we convert it here.
                localCode = drop.refract(block, currentLanguage, groupToProcess.length ? groupToProcess : [groupToProcess]);
                _getReplacement(block, localCode, group.matches ? group.name : 0);
            }

            // If this pattern has sub matches for different groups in the regex
            // then we should process them one at a time by running them through
            // the _processGroup function to generate the new replacement.
            //
            // We use the `keys` function to run through them backwards because
            // the match position of earlier matches will not change depending
            // on what gets replaced in later matches.
            const groupKeys = util.keys(pattern.matches);
            for (const groupKey of groupKeys) {
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
            for (const pattern of patterns) {
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
            const patterns = options.patterns[language] || [];
            const defaultPatterns = options.patterns.generic || [];
            return options.bypass[language] ? patterns : patterns.concat(defaultPatterns);
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
            return _processCodeWithPatterns(util.htmlEntities(code), patterns);
        }

        this.refract = _highlightBlockForLanguage;
    }
}

export default Raindrop;
