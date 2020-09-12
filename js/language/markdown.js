// <https://github.com/tovic>
Rainbow.extend('markdown', [
    {
        'name': 'bold',
        'pattern': /([*_]{2}).*?\1/g
    },
    {
        'name': 'italic',
        'pattern': /([*_]).*?\1/g
    },
    {
        'name': 'strike',
        'pattern': /(~{2}).*?\1/g
    },
    {
        'matches': {
            1: 'hr'
        },
        'pattern': /^ {0,3}([-+* ]{3,})$/gm
    },
    {
        'name': 'header',
        'pattern': /^#{1,6} *.+|(^|\n).+\n[-=]+$/gm
    },
    {
        'name': 'pre',
        'pattern': /^([~`]{3,}) *\.?[a-z0-9\-]+[\s\S]*?\n\1$/gm
    },
    {
        'name': 'code',
        'pattern': /`.*?`/g
    },
    {
        matches: {
            1: 'bullet'
        },
        'pattern': /^\s*([0-9]+\.|[-+*]) /gm
    },
    {
        matches: {
            0: 'image',
            1: 'link'
        },
        'pattern': /!?(\[.*?\]\(.*?\))/g
    },
    {
        'name': 'footnote',
        'pattern': /\[\^.*?\]:?/g
    },
    {
        'name': 'abbr',
        'pattern': /^ *\*\[.*?\]:/gm
    },
    {
        'name': 'link',
        'pattern': /&lt;(?:ht|f)tps?:\/\/.*?&gt;/g
    },
    {
        'name': 'html',
        'pattern': /&lt;.*?&gt;/g
    }
], true);
