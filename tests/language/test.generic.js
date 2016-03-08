/* global describe, run */
var language = 'generic';

describe(language, function() {
    run(
        language,

        'string alone',

        'foo = "this is a string"',

        'foo <span class="keyword operator">=</span> <span class="string">"this is a string"</span>'
    );

    run(
        language,

        'string after equal sign',

        'foo=\'this is a string\'',

        'foo<span class="keyword operator">=</span><span class="string">\'this is a string\'</span>'
    );

    run(
        language,

        'string in brackets',

        'foo = ["one", "two", "three"];',

        'foo <span class="keyword operator">=</span> [<span class="string">"one"</span>, <span class="string">"two"</span>, <span class="string">"three"</span>];'
    );

    run(
        language,

        'string in function call',

        "someFunction('some string', true);",

        '<span class="function call">someFunction</span>(<span class="string">\'some string\'</span>, <span class="constant language">true</span>);'
    );

    run(
        language,

        'concatenated string',

        "foo = 'string1' + 'string2';",

        'foo <span class="keyword operator">=</span> <span class="string">\'string1\'</span> <span class="keyword operator">+</span> <span class="string">\'string2\'</span>;'
    );

    run(
        language,

        'quoted comment with string',

        '# someone\'s comment\n' +
        'doSomething(\'js\')\n' +
        'doSomethingElse()\n' +
        'test = \'other string\'',

        '<span class="comment"># someone\'s comment</span>\n' +
        '<span class="function call">doSomething</span>(<span class="string">\'js\'</span>)\n' +
        '<span class="function call">doSomethingElse</span>()\n' +
        'test <span class="keyword operator">=</span> <span class="string">\'other string\'</span>'
    );

    run(
        language,

        'quoted comment with multi-line string',

        '/* someone\'s comment */\n' +
        'doSomething(\'js\')\n' +
        'doSomethingElse()\n' +
        'test = \'other string\n' +
        'string is still going\'',

        '<span class="comment">/* someone\'s comment */</span>\n' +
        '<span class="function call">doSomething</span>(<span class="string">\'js\'</span>)\n' +
        '<span class="function call">doSomethingElse</span>()\n' +
        'test <span class="keyword operator">=</span> <span class="string">\'other string\n' +
        'string is still going\'</span>'
    );

    run(
        language,

        'quoted comment with multi-line directly after',

        '// someone\'s comment\n' +
        'test = \'blah blah\n' +
        'blah blah blah\'',

        '<span class="comment">// someone\'s comment</span>\n' +
        'test <span class="keyword operator">=</span> <span class="string">\'blah blah\n' +
        'blah blah blah\'</span>'
    );

    run(
        language,

        'comment inline 1',

        '// this is a comment',

        '<span class="comment">// this is a comment</span>'
    );

    run(
        language,

        'comment inline 2',

        '// this is a comment\n' +
        '//\n' +
        '// other comment',

        '<span class="comment">// this is a comment</span>\n' +
        '<span class="comment">//</span>\n' +
        '<span class="comment">// other comment</span>'
    );

    run(
        language,

        'comment inline 3',

        '# this is a comment',

        '<span class="comment"># this is a comment</span>'
    );

    run(
        language,

        'comment inline 4',

        '/* this is a comment */',

        '<span class="comment">/* this is a comment */</span>'
    );

    run(
        language,

        'comment block',

        '/**\n' +
        ' * test comment\n' +
        ' */',

        '<span class="comment">/**\n' +
        ' * test comment\n' +
        ' */</span>'
    );

    run(
        language,

        'integer',

        '23',

        '<span class="constant numeric">23</span>'
    );

    run(
        language,

        'decimal',

        '3.21',

        '<span class="constant numeric">3.21</span>'
    );

    run(
        language,

        'float',

        '23.5f',

        '<span class="constant numeric">23.5f</span>'
    );

    run(
        language,

        'exponential',

        '121.22e-10',

        '<span class="constant numeric">121.22e-10</span>'
    );

    run(
        language,

        'hex',

        '0x0A',

        '<span class="constant numeric">0x0A</span>'
    );

    run(
        language,

        'language constants',

        'if (thing == true) {\n' +
        '    thing = false;\n' +
        '}\n' +
        'other_thing = null;' ,

        '<span class="keyword">if</span> (thing <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="constant language">true</span>) {\n' +
        '    thing <span class="keyword operator">=</span> <span class="constant language">false</span>;\n' +
        '}\n' +
        'other_thing <span class="keyword operator">=</span> <span class="constant language">null</span>;'
    );

    run(
        language,

        'comment after string',

        'var test = "some string" // comment after string',

        '<span class="keyword">var</span> test <span class="keyword operator">=</span> <span class="string">"some string"</span> <span class="comment">// comment after string</span>'
    );

    run(
        language,

        'operator math',

        'value = (25 * 2) + (14 / 2) - 10',

        'value <span class="keyword operator">=</span> (<span class="constant numeric">25</span> <span class="keyword operator">*</span> <span class="constant numeric">2</span>) <span class="keyword operator">+</span> (<span class="constant numeric">14</span> / <span class="constant numeric">2</span>) <span class="keyword operator">-</span> <span class="constant numeric">10</span>'
    );

    run(
        language,

        'operator comparison not escaped',

        'if ((test > 0 && test < 25) || test == 50) {\n' +
        '    print "nice";\n' +
        '}',

        '<span class="keyword">if</span> ((test <span class="keyword operator">&gt;</span> <span class="constant numeric">0</span> <span class="keyword operator">&amp;</span><span class="keyword operator">&amp;</span> test <span class="keyword operator">&lt;</span> <span class="constant numeric">25</span>) <span class="keyword operator">|</span><span class="keyword operator">|</span> test <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="constant numeric">50</span>) {\n' +
        '    <span class="keyword">print</span> <span class="string">"nice"</span>;\n' +
        '}'
    );

    run(
        language,

        'operator comparison escaped',

        'if ((test &gt; 0 &amp;&amp; test &lt; 25) || test == 50) {\n' +
        '    print "nice";\n' +
        '}',

        '<span class="keyword">if</span> ((test <span class="keyword operator">&gt;</span> <span class="constant numeric">0</span> <span class="keyword operator">&amp;</span><span class="keyword operator">&amp;</span> test <span class="keyword operator">&lt;</span> <span class="constant numeric">25</span>) <span class="keyword operator">|</span><span class="keyword operator">|</span> test <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="constant numeric">50</span>) {\n' +
        '    <span class="keyword">print</span> <span class="string">"nice"</span>;\n' +
        '}'
    );

    run(
        language,

        'function call',

        'someFunction(arg);',

        '<span class="function call">someFunction</span>(arg);'
    );

    run(
        language,

        'function definition',

        'function someFunction(arg) {\n' +
        '    return strtolower(arg);\n' +
        '}',

        '<span class="storage function">function</span> <span class="entity name function">someFunction</span>(arg) {\n' +
        '    <span class="keyword">return</span> <span class="function call">strtolower</span>(arg);\n' +
        '}'
    );

    skip(
        language,

        'comment after website string',

        'var test = "http://website.com/index.html"; // sweet website',

        '<span class="keyword">var</span> test <span class="keyword operator">=</span> <span class="string">"http://website.com/index.html"</span>; <span class="comment">// sweet website</span>'
    );

    run(
        language,

        'escaped string single quote',

        'var test = \'someone\\\'s string\'',

        '<span class="keyword">var</span> test <span class="keyword operator">=</span> <span class="string">\'someone<span class="constant character escape">\\\'</span>s string\'</span>'
    );

    run(
        language,

        'escaped string double quote',

        'var test = \"someone\\\"s string\"',

        '<span class="keyword">var</span> test <span class="keyword operator">=</span> <span class="string">"someone<span class="constant character escape">\\\"</span>s string"</span>'
    );

    run(
        language,

        'string concatenation with +',

        'time=h+":"+m+":"+s;',

        'time<span class="keyword operator">=</span>h<span class="keyword operator">+</span><span class="string">":"</span><span class="keyword operator">+</span>m<span class="keyword operator">+</span><span class="string">":"</span><span class="keyword operator">+</span>s;'
    );

    run(
        language,

        'string concatenation with .',

        'NV_CSS.\'/app.css\'',

        'NV_CSS<span class="keyword dot">.</span><span class="string">\'/app.css\'</span>'
    );
});
