/**
 * JSON Patterns
 *
 * @author Nijiko Yonskai
 * @version 1.0.0
 */
Rainbow.extend('json', [
    {
        'name': 'comment.json',
        'pattern': /\\\*[\S\s]*?\*\//g
    },
    {
        'matches': {
            1: 'support.tag.open',
            2: 'support.tag.close'
        },
        'pattern': /(\{|\[)|(\]|\})/g
    },
    {
        'matches': {
            1: 'string.quote',
            2: 'support.attribute',
            3: 'string.quote',
            4: 'string.operator'
        },
        'pattern': /(\")([^\"]+)(\")(\:)/g
    },
    {
        'matches': {
            1: 'string.quote',
            2: 'support.attribute',
            3: 'string.quote',
            4: 'string.operator'
        },
        'pattern': /(\')([^\']+)(\')(\:)/g
    },
    {
        'matches': {
            1: 'string.quote',
            2: 'string.value',
            3: 'string.quote'
        },
        'pattern': /(\'|\")([^\1]+?)(\1)/g
    },
    {
        'matches': {
            1: 'string.value'
        },
        'pattern': /\s+?([a-z0-9\-\+\*\%\^\!\~\.]+)/gi
    }
], true);