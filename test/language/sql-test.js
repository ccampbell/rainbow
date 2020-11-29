const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'sql';

export function testSQL(t) {
    run(
        t,

        language,

        'select statement',

        "SELECT * FROM `user` WHERE type = 'pro' ORDER BY id DESC LIMIT 10;",

        '<span class="keyword">SELECT</span> <span class="keyword operator">*</span> <span class="keyword">FROM</span> <span class="string">`user`</span> <span class="keyword">WHERE</span> type <span class="keyword operator">=</span> <span class="string">\'pro\'</span> <span class="keyword">ORDER</span> <span class="keyword">BY</span> id <span class="keyword">DESC</span> <span class="keyword">LIMIT</span> <span class="constant numeric">10</span>;'
    );

    run(
        t,

        language,

        'select statement on multiple lines',

        `  SELECT id,
                 name,
                 display_name
            FROM \`user\`
           WHERE type = 'pro'
        ORDER BY id DESC
           LIMIT 10;`,

        `  <span class="keyword">SELECT</span> id,
                 name,
                 display_name
            <span class="keyword">FROM</span> <span class="string">\`user\`</span>
           <span class="keyword">WHERE</span> type <span class="keyword operator">=</span> <span class="string">\'pro\'</span>
        <span class="keyword">ORDER</span> <span class="keyword">BY</span> id <span class="keyword">DESC</span>
           <span class="keyword">LIMIT</span> <span class="constant numeric">10</span>;`
    );

    run(
        t,

        language,

        'lowercase query',

        'select count(*) from some_table WHERE some_column is not null;',

        '<span class="keyword">select</span> <span class="function call">count</span>(<span class="keyword operator">*</span>) <span class="keyword">from</span> some_table <span class="keyword">WHERE</span> some_column <span class="keyword">is</span> <span class="keyword">not</span> <span class="keyword">null</span>;'
    );

    run(
        t,

        language,

        'comments',

        `/* This
        is a 
        multi-line
        comment */
        select count(*) -- This is a one type of single line comment
        from some_table # This is another type of single line comment
        WHERE some_column is not null;`,

        '<span class="comment">/* This\n        is a \n        multi-line\n        comment */</span>\n        <span class="keyword">select</span> <span class="function call">count</span>(<span class="keyword operator">*</span>) <span class="comment">-- This is a one type of single line comment</span>\n        <span class="keyword">from</span> some_table <span class="comment"># This is another type of single line comment</span>\n        <span class="keyword">WHERE</span> some_column <span class="keyword">is</span> <span class="keyword">not</span> <span class="keyword">null</span>;'
    );
}
