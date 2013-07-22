/* global describe, run */
var language = 'javascript';

describe(language, function() {
    run(
        language,

        'selector 1',

        '$.get()',

        '<span class="selector">$</span>.<span class="function call">get</span>()'
    );

    run(
        language,

        'selector 2',

        ' $(\'.some_class\').show()',

        '<span class="selector"> $</span>(<span class="string">\'.some_class\'</span>).<span class="function call">show</span>()'
    );

    run(
        language,

        'window',

        'console.log(window.scrollX)',

        'console.<span class="support method">log</span>(<span class="support">window</span>.scrollX)'
    );

    run(
        language,

        'document',

        'document.getElementById(\'#some_id\')',

        '<span class="support">document</span>.<span class="support method">getElementById</span>(<span class="string">\'#some_id\'</span>)'
    );

    run(
        language,

        'regex',

        'var pattern = /\\((.*?)\\)/g',

        '<span class="keyword">var</span> pattern <span class="keyword operator">=</span> <span class="string regexp"><span class="string regexp open">/</span><span class="constant regexp escape">\\(</span>(.*?)<span class="constant regexp escape">\\)</span><span class="string regexp close">/</span><span class="string regexp modifier">g</span></span>'
    );

    run(
        language,

        'regex 2',

        'var pattern = /true/',

        '<span class="keyword">var</span> pattern <span class="keyword operator">=</span> <span class="string regexp"><span class="string regexp open">/</span>true<span class="string regexp close">/</span></span>'
    );

    run(
        language,

        'string no regex',

        'var test = "http://website.com/could/match/regex/i";',

        '<span class="keyword">var</span> test <span class="keyword operator">=</span> <span class="string">"http://website.com/could/match/regex/i"</span>;'
    );

    run(
        language,

        'single line comment vs. regex',

        'var Animal = function() { /* some comment */ };',

        '<span class="storage">var</span> <span class="entity function">Animal</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() { <span class="comment">/* some comment */</span> };'
    );

    run(
        language,

        'class instantiation',

        'var animal = new Animal();',

        '<span class="keyword">var</span> animal <span class="keyword operator">=</span> <span class="keyword">new</span> <span class="entity function">Animal</span>();'
    );

    run(
        language,

        'inline function',

        'var foo = true,\n' +
        '    something = function() {\n' +
        '       // do something\n' +
        '    };',

        '<span class="keyword">var</span> foo <span class="keyword operator">=</span> <span class="constant language">true</span>,\n' +
        '    <span class="entity function">something</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {\n' +
        '       <span class="comment">// do something</span>\n' +
        '    };'
    );

    run(
        language,

        'inline function beginning of line',

        'something = function() {\n' +
        '   // do something\n' +
        '};',

        '<span class="entity function">something</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {\n' +
        '   <span class="comment">// do something</span>\n' +
        '};'
    );

    run(
        language,

        'functions in object',

        'window.Rainbow = {\n' +
        '    color: function() {\n' +
        '        // do something\n' +
        '    },\n' +
        '\n' +
        '    other: function() {}\n' +
        '};',

        '<span class="support">window</span>.Rainbow <span class="keyword operator">=</span> {\n' +
        '    <span class="entity function">color</span>: <span class="keyword">function</span>() {\n' +
        '        <span class="comment">// do something</span>\n' +
        '    },\n' +
        '\n' +
        '    <span class="entity function">other</span>: <span class="keyword">function</span>() {}\n' +
        '};'
    );

    run(
        language,

        'JSON 1',

        '{\n' +
        '   "generated_in": "0.0423",\n' +
        '   "stat": "fail"\n' +
        '   "err": {\n' +
        '       "code": "1",\n' +
        '       "expl": "The user id or name was either not valid or not provided.",\n' +
        '       "msg": "User not found"\n' +
        '   }\n' +
        '}',

        '{\n' +
        '   <span class="string">"generated_in"</span>: <span class="string">"0.0423"</span>,\n' +
        '   <span class="string">"stat"</span>: <span class="string">"fail"</span>\n' +
        '   <span class="string">"err"</span>: {\n' +
        '       <span class="string">"code"</span>: <span class="string">"1"</span>,\n' +
        '       <span class="string">"expl"</span>: <span class="string">"The user id or name was either not valid or not provided."</span>,\n' +
        '       <span class="string">"msg"</span>: <span class="string">"User not found"</span>\n' +
        '   }\n' +
        '}'
    );

    run(
        language,

        'JSON 2',

        '{\n' +
        '   "generated_in":"0.0423",\n' +
        '   "stat":"fail"\n' +
        '   "err":{\n' +
        '       "code":"1",\n' +
        '       "expl":"The user id or name was either not valid or not provided.",\n' +
        '       "msg":"User not found"\n' +
        '   }\n' +
        '}',

        '{\n' +
        '   <span class="string">"generated_in"</span>:<span class="string">"0.0423"</span>,\n' +
        '   <span class="string">"stat"</span>:<span class="string">"fail"</span>\n' +
        '   <span class="string">"err"</span>:{\n' +
        '       <span class="string">"code"</span>:<span class="string">"1"</span>,\n' +
        '       <span class="string">"expl"</span>:<span class="string">"The user id or name was either not valid or not provided."</span>,\n' +
        '       <span class="string">"msg"</span>:<span class="string">"User not found"</span>\n' +
        '   }\n' +
        '}'
    );

    run(
        language,

        'multiple var declarations',

        'var language = getLanguage(source);\n' +
        'var parseAndHighlight = function() {};\n' +
        'var parseAndHighlight2 = function() {};',

        '<span class="keyword">var</span> language <span class="keyword operator">=</span> <span class="function call">getLanguage</span>(source);\n' +
        '<span class="storage">var</span> <span class="entity function">parseAndHighlight</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {};\n' +
        '<span class="storage">var</span> <span class="entity function">parseAndHighlight2</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {};'
    );
});
