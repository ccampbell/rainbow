/**
 * JSON Patterns
 *
 * @author Nijiko Yonskai
 * @version 1.0.3
 */
Rainbow.extend('json', [
    {
        'name': 'constant.language',
        'pattern': /\b(false|null|true)\b/g
    },
    {
        'name': 'comment.json',
        'pattern': /\\\*[\S\s]*?\*\//g
    },
    {
        'name': 'support.attribute',
        'pattern': /((?:"|')\\?.*?(?:"|'))\s+?(\:)/g
    },
    {
        'matches': {
            1: 'support.tag.open',
            2: 'support.tag.close'
        },
        'pattern': /(\{|\[)|(\]|\})/g
    },
    {
        'name': 'string.value',
        'pattern': /(\"|\')(\\?.)*?\1/g
    },
    {
        'matches': {
            1: 'constant.numeric'
        },
        'pattern': /\b(-?(0x)?\d*\.?[\da-f]+|NaN|-?Infinity)\b/gi
    }
], true);