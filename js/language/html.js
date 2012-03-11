window.Rainbow = window.Rainbow || {};

Rainbow.extend('html', [
    {
        'name': 'php',
        'matches': {
            2: {
                'language': 'php'
            }
        },
        'pattern': /&lt;\?(php)?([\s\S]*?)(\?&gt;)/gm
    },
    {
        'name': 'support.tag',
        'pattern': /&lt;([^\s]*?)&gt;/g
    },
    {
        'name': 'support.tag',
        'matches': {
            1: 'support.tag-name'
        },
        'pattern': /&lt;\/?(\w+)(?=\s|\&)/g
    },
    {
        'name': 'support.tag',
        'matches': {
            1: 'support.attribute',
            2: 'support.operator',
            3: 'string'
        },
        'pattern': /([a-z-]+)(=)(('|")(.*?)(\4))(&gt;)?/g
    },
    {
        'name': 'comment.html',
        'pattern': /&lt;\!--[\S\s]*?--&gt;/g
    }
], true);

