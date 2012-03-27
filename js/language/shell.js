/**
 * Shell patterns
 *
 * @author Matthew King
 * @version 0.1.0
 */
window.Rainbow = window.Rainbow || {};

Rainbow.extend('shell', [
    /**
     * This handles the case where subshells contain quotes.
     * For example: `"$(resolve_link "$name" || true)"`.
     *
     * Caveat: This really should match balanced parentheses, but cannot. 
     * @see http://stackoverflow.com/questions/133601/can-regular-expressions-be-used-to-match-nested-patterns
     */
    {
        'name': 'shell',
        'matches': {
            1: {
                'language': 'shell' 
            }
        },
        'pattern': /\$\(([\s\S]*?)\)/gm
    },
    {
        'matches': {
            1: {
                'name': 'keyword.operator',
                'pattern': /\=/g
            },
            2: 'string'
        },
        'pattern': /(\(|\s|\[|\=)(('|")[\s\S]*?(\3))/gm
    },
    {
        'name': 'comment',
        'pattern': /\#[\s\S]*?$/gm
    },
    /**
     * Environment variables
     */
    {
        'name': 'constant',
        'pattern': /\b[A-Z0-9_]{2,}\b/g
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(break|case|continue|do|done|elif|else|esac|eval|export|fi|for|function|if|in|local|return|set|then|unset|until|while)(?=\(|\b)/g
    }
], true);
