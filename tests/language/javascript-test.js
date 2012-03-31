/**
 * javascript tests
 *
 * @author Craig Campbell
 */
RainbowTester.startTest('javascript');

RainbowTester.run(
    'selector 1',

    '$.get()',

    '<span class="selector">$</span>.<span class="function call">get</span>()'
);

RainbowTester.run(
    'selector 2',

    ' $(\'.some_class\').show()',

    '<span class="selector"> $</span>(<span class="string">\'.some_class\'</span>).<span class="function call">show</span>()'
);

RainbowTester.run(
    'window',

    'console.log(window.scrollX)',

    'console.<span class="support method">log</span>(<span class="support">window</span>.scrollX)'
);

RainbowTester.run(
    'document',

    'document.getElementById(\'#some_id\')',

    '<span class="support">document</span>.<span class="support method">getElementById</span>(<span class="string">\'#some_id\'</span>)'
);

RainbowTester.run(
    'regex',

    'var pattern = /\\((.*?)\\)/g',

    '<span class="keyword">var</span> pattern <span class="keyword operator">=</span> <span class="regex"><span class="regex open">/</span><span class="constant regex escape">\\(</span>(.*?)<span class="constant regex escape">\\)</span><span class="regex close">/</span><span class="regex modifier">g</span></span>'
);

RainbowTester.run(
    'string no regex',

    'var test = "http://website.com/could/match/regex/i";',

    '<span class="keyword">var</span> test <span class="keyword operator">=</span> <span class="string">"http://website.com/could/match/regex/i"</span>;'
);

RainbowTester.run(
    'functions in object',

    'window.Rainbow = {\n' +
    '    color: function() {\n' +
    '        // do something\n' +
    '    },\n' +
    '\n' +
    '    other: function() {}\n' +
    '};',

    '<span class="support">window</span>.Rainbow <span class="keyword operator">=</span> {\n' +
    '    <span class="meta function-call">color</span>: <span class="keyword">function</span>() {\n' +
    '        <span class="comment">// do something</span>\n' +
    '    },\n' +
    '\n' +
    '    <span class="meta function-call">other</span>: <span class="keyword">function</span>() {}\n' +
    '};'
);

RainbowTester.endTest('javascript');
