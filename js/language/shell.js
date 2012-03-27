/**
 * Shell patterns
 *
 * @author Matthew King
 * @version 0.1.0
 */
window.Rainbow = window.Rainbow || {};

Rainbow.extend('shell', [
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
