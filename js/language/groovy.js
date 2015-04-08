/**
 * Groovy language patterns
 *
 * @author Matt Cholick
 * @version 1.0.1
 */
Rainbow.extend("groovy", [
    {
        name: "constant",
        pattern: /\b(false|null|true|[A-Z_]+)\b/g
    },
    {
        matches: {
            1: "keyword",
            2: "support.namespace"
        },
        pattern: /(import|package)\s(.+)/g
    },
    {
        // see http://groovy.codehaus.org/Reserved+Words
        name: "keyword",
        pattern: /\b(abstract|as|assert|boolean|break|byte|case|catch|char|class|const|continue|def|default|do|double|else|enum|extends|false|final|finally|float|for|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|threadsafe|throw|throws|transient|true|try|void|volatile|while)\b/g
    },
    {
        name: "string",
        pattern: /(".*?")|('.*?')|(\/.*?\/)/g
    },
    {
        'name': 'comment.docstring',
        'pattern': /('{3}|"{3})[\s\S]*?\1/gm
    },
    {
        name: "char",
        pattern: /(')(.|\\.|\\u[\dA-Fa-f]{4})\1/g
    },
    {
        name: "integer",
        pattern: /\b(0x[\da-f]+|\d+)L?\b/g
    },
    {
        name: "comment",
        pattern: /\/\*[\s\S]*?\*\/|(\/\/).*?$/gm
    },
    {
        name: "support.languagelabel",
        pattern: /(\w+:)/g
    },
    // see http://groovy.codehaus.org/Operators and http://docs.oracle.com/javase/tutorial/java/nutsandbolts/operators.html
    {
        name: "operator",
        pattern: /(\*\.@)|(\?:)|(\.&amp;)|(&lt;=&gt;)|(={1,2}~)|(\*\.)|(\.@)|(\+{1,2}|-{1,2}|~|!|\*|\/|%|(?:&lt;){1,2}|(?:&gt;){1,3}|instanceof|(?:&amp;){1,2}|\^|\|{1,2}|\?|:|(?:=|!|\+|-|\*|\/|%|\^|\||(?:&lt;){1,2}|(?:&gt;){1,3})?=)/g
    },
    {
        name: "support.annotation",
        pattern: /(@\w+)/g
    },
    {
        matches: {
            1: "entity.function"
        },
        pattern: /([^@\.\s]+)\(/g
    },
    {
        name: "entity.class",
        pattern: /\b([A-Z]\w*)\b/g
    }
], true);
