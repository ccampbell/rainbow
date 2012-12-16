/**
 * Haskell patterns
 *
 * @author Bruno Dias
 * @version 1.0.1
 */
//TODO: support module declaration.
//      {-# #-} stuff...
Rainbow.extend('haskell', [
    {
        'name': 'comment',
        'pattern': /\{\-\-[\s\S(.*)]+[\-\-][\}$]/gm
        // /\{\-{2}[\s\S(.*)]+[\-\-][\}$]/gm [multiple lines]
    },
    {
        'name': 'comment',
        'pattern': /\-\-(.*)/g
        // /\-\-\s(.+)$/gm [single]
    },
    // From c.js
    {
        'name': 'meta.preprocessor',
        'matches': {
            1: [
                {
                    'matches': {
                        1: 'keyword.define',
                        2: 'entity.name'
                    },
                    'pattern': /(\w+)\s(\w+)\b/g
                },
                {
                    'name': 'keyword.define',
                    'pattern': /endif/g
                },
                {
                    'name': 'constant.numeric',
                    'pattern': /\d+/g
                },
                {
                    'matches': {
                        1: 'keyword.include',
                        2: 'string'
                    },
                    'pattern': /(include)\s(.*?)$/g
                }
            ]
        },
        'pattern': /\#([\S\s]*?)$/gm
    },
    {
        'matches': {
            1: 'keyword.namespace',
            2: {
                'name': 'support.namespace',
                'pattern': /\w+/g
            }
        },
        'pattern': /\b(module)\s(.*?);/g
    },
    {
        'name': 'keyword.operator',
        'pattern': /\+|\!|\-|&(gt|lt|amp);|\/\=|\||\:{2}|\.|\+{2}|\*|\=|#|\.{2}|(\\)[a-zA-Z_]/g
    },
    {
        'name': 'keyword',
        'pattern': /\b(case|class|foreign|hiddin|qualified|data|family|default|deriving|do|else|if|import|in|infix|infixl|infixr|instance|let|in|module|newtype|of|then|type|where|_)\b/g
    },
    {
        'name': 'keyword',
        'pattern': /[\`][a-zA-Z_']*?[\`]/g
    }
    ,
    {
        'name': 'keyword',
        'pattern': /\b[A-Z][A-Za-z_']*/g
    }
]);