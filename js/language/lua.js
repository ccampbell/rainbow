/**
 * Lua patterns
 *
 * @author Javier Aguirre
 * @version 0.0.1
 */
Rainbow.extend('lua', [
    {
        'matches': {
            1: {
                'name': 'keyword.operator',
                'pattern': /\=/g
            },
            2: {
                'name': 'string',
                'matches': {
                    'name': 'constant.character.escape',
                    'pattern': /\\('|"){1}/g
                }
            }
        },
        'pattern': /(\(|\s|\[|\=)(('|")([^\\\1]|\\.)*?(\3))/gm
    },
   /* {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\/|(\/\/|\#)[\s\S]*?$/gm
    },*/
    {
        'name': 'comment',
        'pattern': /\-\-\[\[\-\-[\s\S]*?\-\-\]\]\-\-|(\-\-)[\s\S]*?$/gm
    },
    {
        'name': 'constant.numeric',
        'pattern': /\b(\d+(\.\d+)?(e(\+|\-)?\d+)?(f|d)?|0x[\da-f]+)\b/gi
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b((a|e)nd|in|repeat|break|local|return|do|for|then|else(if)?|function|not|if|or|until|while)(?=\(|\b)/gi
    },
    {
        'name': 'constant.language',
        'pattern': /true|false|nil/g
    },
    {
        'name': 'keyword.operator',
        'pattern': /\+|\!|\-|&(gt|lt|amp);|\||\*|\=|#/g
    },
    {
        'matches': {
            1: 'function.call'
        },
        'pattern': /(\w+?)(?=\()/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(function)\s(.*?)(?=\()/g
    }
]);
