/**
 * CSS patterns
 *
 * @license http://www.apache.org/licenses/LICENSE-2.0
 * @author Craig Campbell
 * @version 1.0
 */
window.Rainbow = window.Rainbow || {};

Rainbow.extend('css', [
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\//gm
    },
    {
        'name': 'constant.hex-color',
        'pattern': /#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})(?=;|\s)/g
    },
    {
        'matches': {
            1: 'integer',
            2: 'keyword.px'
        },
        'pattern': /(\d+)(px)/g
    },
    {
        'name': 'string',
        'pattern': /('|")(.*?)\1/g
    },
    {
        'name': 'support.css-property',
        'pattern': /[\w-]+(?=\s|:)(?!.*\{)/g
    },
    {
        'name': 'meta.tag',
        'pattern': /[\w]+(?=.*\{)/g
    },
    {
        'name': 'meta.class',
        'pattern': /\.[\w]+(?=.*\{)/g
    },
    {
        'name': 'meta.id',
        'pattern': /\#[\w]+(?=.*\{)/g
    },
    {
        'matches': {
            2: 'support.vender-prefix',
            3: 'support.value'
        },
        'pattern': /(:|,)\s?(-o-|-moz-|-webkit-|-ms-)?([a-zA-Z-]*)(?=\b)(?!.*\{)/g
    },
    {
        'matches': {
            1: {
                'name': 'meta.style-tag',
                'pattern': /\w+/g
            }
        },
        'pattern': /&lt;\/?(.*?)(?=\=|&gt;)/g
    }
], true);
