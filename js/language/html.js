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
        'pattern': /&lt;|&gt;/g
    },
    {
        'matches': {
            1: 'support.tag',
            2: 'support.tag.end',
            3: 'support.tag-name'
        },
        'pattern': /(&lt;)(\/?)(\w+)(?=\s|\&)/g
    },
    {
        'matches': {
            1: 'support.attribute',
            2: 'support.operator',
            3: 'string'
        },
        'pattern': /([a-z-]+)(=)(('|")(.*?)(\4))/g
    },
    {
        'name': 'comment.html',
        'pattern': /&lt;\!--[\S\s]*?--&gt;/g
    }
], true);

