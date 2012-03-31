/**
 * Ruby patterns
 *
 * @author Matthew King
 * @author Jesse Farmer <jesse@20bits.com>
 * @version 1.0.3
 */
Rainbow.extend('ruby', [
    {
        'name': 'comment',
        'pattern': /#.*$/gm
    },
    {
        'name': 'comment',
        'pattern': /^\=begin[\s\S]*?\=end$/gm
    },
    {
        'name': 'string.single-quoted',
        'pattern': /'([^\\'\n]|\\.)*'/g
    },
    {
        'name': 'string.single-quoted',
        'pattern': /'([^\\']|\\[\S\s])*'/g
    },
    {
        'name': 'string.double-quoted',
        'pattern': /"([^\\"\n]|\\.)*"/g
    },
    {
        'name': 'string.double-quoted',
        'pattern': /"([^\\"]|\\[\S\s])*"/g
    },
    {
        'name': 'string',
        'pattern': /%[qQ](?=(\(|\[|\{|&lt;|.)(.*?)(?:'|\)|\]|\}|&gt;|\1))(?:\(\2\)|\[\2\]|\{\2\}|\&lt;\2&gt;|\1\2\1)/g
    },
    /**
     * Heredocs
     * Heredocs of the form `<<'HTML' ... HTML` are unsupported.
     */
    {
        'matches': {
            1: 'string',
            2: 'string',
            3: 'string'
        },
        'pattern': /(&lt;&lt;)(\w+).*?$([\s\S]*?^\2)/gm
    },
    {
        'matches': {
            1: 'string',
            2: 'string',
            3: 'string'
        },
        'pattern': /(&lt;&lt;\-)(\w+).*?$([\s\S]*?\2)/gm
    },
    /**
     * Regular expressions
     * Escaped delimiter (`/\//`) is unsupported.
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
        'pattern': /(\/)(.*?)(\/)([a-z]*)/g
    },
    {
        'name': 'constant.regex',
        'matches': {
            1: 'support.regex.open',
            2: {
                'name': 'constant.regex.escape',
                'pattern': /\\(.){1}/g
            },
            3: 'support.regex.close',
            4: 'support.regex.modifier'
        },
        'pattern': /%r(?=(\(|\[|\{|&lt;|.)(.*?)('|\)|\]|\}|&gt;|\1))(?:\(\2\)|\[\2\]|\{\2\}|\&lt;\2&gt;|\1\2\1)([a-z]*)/g
    },
    /**
     * Symbols
     */
    {
        'matches': {
            1: 'constant'
        },
        'pattern': /(\w+:)[^:]/g
    },
    {
        'matches': {
            1: 'constant.symbol'
        },
        'pattern': /[^:](:(?:\w+|(?=['"](.*?)['"])(?:"\2"|'\2')))/g
    },
    {
        'name': 'integer',
        'pattern': /\b(0x[\da-f]+|\d+)\b/g
    },
    {
        'name': 'support.class-name',
        'pattern': /\b[A-Z]\w*(?=((\.|::)[A-Za-z]|\[))/g
    },
    {
        'name': 'constant',
        'pattern': /\b[A-Z]\w*\b/g
    },
    /**
     * Class names begin with an upper-case letter
     */
    {
        'matches': {
            1: 'keyword.class',
            2: 'meta.class-name',
            3: 'meta.parent.class-name'
        },
        'pattern': /\s*(class)\s+((?:(?:::)?[A-Z]\w*)+)(?:\s+&lt;\s+((?:(?:::)?[A-Z]\w*)+))?/g
    },
    {
        'matches': {
            1: 'keyword.module',
            2: 'meta.class-name',
        },
        'pattern': /\s*(module)\s+((?:(?:::)?[A-Z]\w*)+)/g
    },
    {
        'name': 'variable.global',
        'pattern': /\$([a-zA-Z_]\w*)\b/g
    },
    {
        'name': 'variable.class',
        'pattern': /@@([a-zA-Z_]\w*)\b/g
    },
    {
        'name': 'variable.instance',
        'pattern': /@([a-zA-Z_]\w*)\b/g
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(alias|and|begin|break|case|class|continue|def|defined|do|else|elsif|end|ensure|extend|false|for|if|in|include|module|next|nil|not|private|or|raise|redo|require|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield)(?=\(|\b)/g
    },
    /**
    * Functions
    */
    {
        'matches': {
            1: 'keyword.def',
            2: 'meta.function'
        },
        'pattern': /(def)\s(.*?)(?=(\s|\())/g
    }


], true);
