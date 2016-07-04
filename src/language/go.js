/**
 * GO Language
 *
 * @author Javier Aguirre
 * @author Craig Campbell
 */
Rainbow.extend('go', [
    {
        matches: {
            1: [
                {
                    name: 'keyword.operator',
                    pattern: /\=|\+/g
                }
            ],
            2: {
                name: 'string',
                matches: {
                    name: 'constant.character.escape',
                    pattern: /\\(`|"){1}/g
                }
            }
        },
        pattern: /(\(|\s|\[|\=|:|\+|\{|,)((`|")([^\\\1]|\\.)*?(\3))/gm
    },
    {
        name: 'comment',
        pattern: /\/\*[\s\S]*?\*\/|(\/\/)(?!.*(`|").*?\1).*?$/gm
    },
    {
        matches: {
            1: 'keyword'
        },
        pattern: /\b(d(efault|efer)|fallthrough|go(to)?|range|select)(?=\b)/gi
    },
    {
        name: 'keyword',
        pattern: /\bpackage(?=\s*\w)/gi
    },
    {
        matches: {
            1: 'storage.type',
            2: 'entity.name.struct'
        },
        pattern: /\b(type)\s+(\w+)\b(?=\s+struct\b)/gi
    },
    {
        matches: {
            1: 'storage.type',
            2: 'entity.name.type'
        },
        pattern: /\b(type)\s+(\w+)\b/gi
    },
    {
        name: 'storage.type',
        pattern: /\b(bool|byte|complex(64|128)|float(32|64)|func|interface|map|rune|string|struct|u?int(8|16|32|64)?|var)(?=\b)/g
    },
    {
        name: 'keyword.operator.initialize',
        pattern: /\:=/g
    },
    {
        matches: {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        pattern: /(func)\s+(?:\(.*?\))\s+(.*?)(?=\()/g
    },
    {
        matches: {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        pattern: /(func)\s+(.*?)(?=\()/g
    }
], 'generic');
