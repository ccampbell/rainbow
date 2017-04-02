/**
 * PHP patterns
 *
 * @author Craig Campbell
 */
Rainbow.extend('php', [
    {
        name: 'support',
        pattern: /\becho\b/ig
    },
    {
        matches: {
            1: 'variable.dollar-sign',
            2: 'variable'
        },
        pattern: /(\$)(\w+)\b/g
    },
    {
        name: 'constant.language',
        pattern: /true|false|null/ig
    },
    {
        name: 'constant',
        pattern: /\b[A-Z0-9_]{2,}\b/g
    },
    {
        name: 'keyword.dot',
        pattern: /\./g
    },
    {
        name: 'keyword',
        pattern: /\b(die|end(for(each)?|switch|if)|case|require(_once)?|include(_once)?)(?=\b)/ig
    },
    {
        matches: {
            1: 'keyword',
            2: {
                name: 'support.class',
                pattern: /\w+/g
            }
        },
        pattern: /(instanceof)\s([^\$].*?)(\)|;)/ig
    },

    /**
     * these are the top 50 most used PHP functions
     * found from running a script and checking the frequency of each function
     * over a bunch of popular PHP frameworks then combining the results
     */
    {
        matches: {
            1: 'support.function'
        },
        pattern: /\b(array(_key_exists|_merge|_keys|_shift)?|isset|count|empty|unset|printf|is_(array|string|numeric|object)|sprintf|each|date|time|substr|pos|str(len|pos|tolower|_replace|totime)?|ord|trim|in_array|implode|end|preg_match|explode|fmod|define|link|list|get_class|serialize|file|sort|mail|dir|idate|log|intval|header|chr|function_exists|dirname|preg_replace|file_exists)(?=\()/ig
    },
    {
        name: 'variable.language.php-tag',
        pattern: /(&lt;\?(php)?|\?&gt;)/ig
    },
    {
        matches: {
            1: 'keyword.namespace',
            2: {
                name: 'support.namespace',
                pattern: /\w+/g
            }
        },
        pattern: /\b(namespace|use)\s(.*?);/ig
    },
    {
        matches: {
            1: 'storage.modifier',
            2: 'storage.class',
            3: 'entity.name.class',
            4: 'storage.modifier.extends',
            5: 'entity.other.inherited-class',
            6: 'storage.modifier.extends',
            7: 'entity.other.inherited-class'
        },
        pattern: /\b(abstract|final)?\s?(class|interface|trait)\s(\w+)(\sextends\s)?([\w\\]*)?(\simplements\s)?([\w\\]*)?\s?\{?(\n|\})/ig
    },
    {
        name: 'keyword.static',
        pattern: /self::|static::/ig
    },
    {
        matches: {
            1: 'storage.function',
            2: 'entity.name.function.magic'
        },
        pattern: /(function)\s(__.*?)(?=\()/ig
    },
    {
        matches: {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        pattern: /(function)\s(.*?)(?=\()/ig
    },
    {
        matches: {
            1: 'keyword.new',
            2: {
                name: 'support.class',
                pattern: /\w+/g
            }
        },
        pattern: /\b(new)\s([^\$][a-z0-9_\\]*?)(?=\)|\(|;)/ig
    },
    {
        matches: {
            1: {
                name: 'support.class',
                pattern: /\w+/g
            },
            2: 'keyword.static'
        },
        pattern: /([\w\\]*?)(::)(?=\b|\$)/g
    },
    {
        matches: {
            2: {
                name: 'support.class',
                pattern: /\w+/g
            }
        },
        pattern: /(\(|,\s?)([\w\\]*?)(?=\s\$)/g
    }
], 'generic');
