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
        'name': 'css',
        'matches': {
            0: {
                'language': 'css'
            }
        },
        'pattern': /&lt;style(.*?)&gt;([\s\S]*?)&lt;\/style&gt;/gm
    },
    {
        'name': 'js',
        'matches': {
            0: {
                'language': 'javascript'
            }
        },
        'pattern': /&lt;script(.*?)&gt;([\s\S]*?)&lt;\/script&gt;/gm
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

