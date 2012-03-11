window.Rainbow = window.Rainbow || {};

Rainbow.extend('php', [
    {
        'name': 'support',
        'pattern': /\becho\b/g
    },
    {
        'name': 'variable',
        'pattern': /\$\w+\b/g
    },
    {
        'name': 'keyword.dot',
        'pattern': /\./g
    },
    {
        'name': 'keyword',
        'pattern': /\b(continue|break|require(_once)?|include(_once)?)\b/g
    },
    {
        'matches': {
            1: 'keyword',
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /(instanceof)\s([^\$].*?)(\)|;)/g
    },
    {
        'matches': {
            1: 'support.function'
        },
        'pattern': /\b(apc_(fetch|store)|array|asort|file_get_contents|get_(called_)?class|getenv|in_array|json_(encode|decode)|mt_rand|rand|spl_autoload_register|str(tolower|str|pos|_replace)|trigger_error)(?=\()/g
    },
    {
        'name': 'phptag',
        'pattern': /(&lt;\?(php)?|\?&gt;)/g
    },
    {
        'matches': {
            1: 'keyword.namespace',
           2: {
                'name': 'support.namespace',
                'pattern': /\w+/g
            }
        },
        'pattern': /\b(namespace\s)(.*?);/g
    },
    {
        'matches': {
            1: 'keyword.class.description',
            2: 'keyword.class',
            3: 'meta.class-name',
            5: 'keyword.extends',
            6: 'meta.parent.class-name'
        },
        'pattern': /\b(abstract|final)\s(class)\s(\w+)(\s(extends)\s([^\\]*))?\n/g
    },
    {
        'name': 'keyword.static',
        'pattern': /self::/g
    },
    {
        'matches': {
            1: 'keyword',
            2: 'support.magic'
        },
        'pattern': /(function)\s(__.*?)(?=\()/g
    },
    {
        'matches': {
            1: 'keyword.new',
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /\b(new)\s([^\$].*?)(?=\)|\(|;)/g
    },
    {
        'matches': {
            1: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /([\w\\]*?)::\b/g
    },
    {
        'matches': {
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /(\(|,\s?)([\w\\]*?)(?=\s\$)/g
    }
]);
