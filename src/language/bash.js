/**
 * Bash patterns
 * Bash for developers [Version 1.0]
 * 
 * @author Moamen Eltouny (Raggi)
 */
Rainbow.extend('bash', [
    {
        name: 'bash',
        matches: {
            1: {
                language: 'bash'
            }
        },
        pattern: /\$\(([\s\S]*?)\)/gm
    },
    {
        name: "string",
        pattern: /([-]{1,2}([a-zA-Z\-_=\"]+))/g
    },
    {
        name: "storage.modifier.extends",
        pattern: /([a-zA-Z\-_]+\/[a-zA-Z\-_]+)/g
    },
    {
        name: 'storage.function',
        pattern: /(.+?)(?=\(\)\s{0,}\{)/g
    },
    /**
     * Environment variables
     */
    {
        name: "support.command",
        pattern: /\b(composer|npm|npx|php|php artisan|git|node|mysql)/g
    },
    {
        matches: {
            1: "keyword"
        },
        pattern: /\b(i|install|require|remove|info|run|push|pull|fetch|stash|pop|([a-zA-Z]+:[a-zA-Z]+))(?=\b)/g
    },
]);
