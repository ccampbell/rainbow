/**
 * Smalltalk patterns
 *
 * @author Frank Shearar <frank@angband.za.org>
 * @version 1.0
 */
Rainbow.extend('smalltalk', [
    {
        /* making peace with HTML */
        'name': 'plain',
        'pattern': /&gt;|&lt;|&amp;/g
    },
    {'name': 'keyword',
     'pattern': /\b(self|thisContext|^)/g
    },
    {'name': 'keyword.operator',
     'pattern': /[\|\\@%\^&*_\-+=~?><\(\)\[\]]{1,2}|#\[|#\(|:=/g
    },
    {'name': 'constant.language',
     'pattern': /false|nil|true/g
    },
    {
        'matches': {
            1: 'storage.class',
            2: 'entity.name.class',
            3: 'entity.other.inherited-class'
        },
        'pattern': /\b[A-Z]\w*/g
    },
    {'name': 'constant.numeric',
     'pattern': /\b\d+(?!r)|\d{1,2}r[\d|a-zA-Z]+\b/g
    },
    {'name': 'entity.name.function',
     'pattern': /[a-z][A-Za-z0-9_]*\:?/g
    },
    {'name': 'string',
     'pattern': /'(?:[^']|'')*'/g
    },
    {'name': 'comment',
     'pattern': /"(?:[^"]|"")*"/g
    },
    {'name': 'string.symbol',
     'pattern': /#\w+/g
    },
    {'name': 'string.character',
     'pattern': /\$./g
    },
]);
