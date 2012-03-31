/**
 * Javascript patterns
 *
 * @author Craig Campbell
 * @version 1.0.4
 */
Rainbow.extend('javascript', [

    /**
     * matches $. or $(
     */
    {
        'name': 'selector',
        'pattern': /(\s|^)\$(?=\.|\()/g
    },
    {
        'name': 'support',
        'pattern': /\b(window|document)\b/g
    },
    {
        'matches': {
            1: 'support.property'
        },
        'pattern': /\.(length|node(Name|Value))\b/g
    },
    {
        'matches': {
            1: 'support.function'
        },
        'pattern': /(setTimeout|setInterval)(?=\()/g

    },
    {
        'matches': {
            1: 'support.method'
        },
        'pattern': /\.(getAttribute|push|getElementById|getElementsByClassName|log|setTimeout|setInterval)(?=\()/g
    },
    {
        'matches': {
            2: [
                {
                    'name': 'string',
                    'pattern': /('|")(.*?)(\1)/g
                },
                {
                    'name': 'meta.script-tag',
                    'pattern': /(\w+)/g
                }
            ]
        },
        'pattern': /(&lt;\/?)(script(.*?))(&gt;)/g
    },

    /**
     * matches any escaped characters inside of a js regex pattern
     *
     * @see https://github.com/ccampbell/rainbow/issues/22
     *
     * this was causing single line comments to fail so it now checks
     * for a regex modifier directly after the / this is not a perfect
     * solution, but it works for now
     *
     * @todo check that there is valid regex in match group 1
     */
    {
        'name': 'regex',
        'matches': {
            1: 'regex.open',
            2: {
                'name': 'constant.regex.escape',
                'pattern': /\\(.){1}/g
            },
            3: 'regex.close',
            4: 'regex.modifier'
        },
        'pattern': /(\/)(.+)(\/)([igm]{1,3})/g
    },

    /**
     * matches any function call in the style functionName: function()
     */
    {
        'name': 'meta.function-call',
        'pattern': /(\w+)(?=:\s{0,}function)/g
    }
    /*,
    {
        'name': 'comment',
        'matches': {
            1: {
                'name': 'keyword.jsdoc',
                'pattern': /\s+@\w+/g
            }
        },
        'pattern': /\/\*([\s\S]*?)\*\//gm
    } */
]);
