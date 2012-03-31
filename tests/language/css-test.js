/**
 * css tests
 *
 * @author Craig Campbell
 */
RainbowTester.startTest('css');

RainbowTester.run(
    'comment',

    '/* comment */',

    '<span class="comment">/* comment */</span>'
);

RainbowTester.run(
    'multi-line comment',

    '/**\n' +
    ' * comment\n' +
    ' */',

    '<span class="comment">/**\n' +
    ' * comment\n' +
    ' */</span>'
);

RainbowTester.run(
    'pixels',

    'margin:10px 20px 5px 30px;',

    '<span class="support css-property">margin</span>:<span class="integer">10</span><span class="keyword unit">px</span> <span class="integer">20</span><span class="keyword unit">px</span> <span class="integer">5</span><span class="keyword unit">px</span> <span class="integer">30</span><span class="keyword unit">px</span>;'
);

RainbowTester.run(
    'cm',

    'margin: 1cm 2cm 1.3cm 4cm;',

    '<span class="support css-property">margin</span>: <span class="integer">1</span><span class="keyword unit">cm</span> <span class="integer">2</span><span class="keyword unit">cm</span> <span class="integer">1</span>.<span class="integer">3</span><span class="keyword unit">cm</span> <span class="integer">4</span><span class="keyword unit">cm</span>;'
);

RainbowTester.run(
    'string single quote',

    '\'test string\'',

    '<span class="string">\'test string\'</span>'
);

RainbowTester.run(
    'string double quote',

    '"test string"',

    '<span class="string">"test string"</span>'
);

RainbowTester.run(
    'transition - vendor prefix',

    'code span {\n' +
        '   -moz-transition: color .8s ease-in;\n' +
        '   -o-transition: color .8s ease-in;\n' +
        '   -webkit-transition: color .8s ease-in;\n' +
        '   transition: color .8s ease-in;\n' +
    '}',

    '<span class="meta tag">code</span> <span class="meta tag">span</span> {\n' +
    '   <span class="support css-property"><span class="support vendor-prefix">-moz-</span>transition</span>: <span class="support css-value">color</span> .<span class="integer">8</span><span class="keyword unit">s</span> ease-in;\n' +
    '   <span class="support css-property"><span class="support vendor-prefix">-o-</span>transition</span>: <span class="support css-value">color</span> .<span class="integer">8</span><span class="keyword unit">s</span> ease-in;\n' +
    '   <span class="support css-property"><span class="support vendor-prefix">-webkit-</span>transition</span>: <span class="support css-value">color</span> .<span class="integer">8</span><span class="keyword unit">s</span> ease-in;\n' +
    '   <span class="support css-property">transition</span>: <span class="support css-value">color</span> .<span class="integer">8</span><span class="keyword unit">s</span> ease-in;\n' +
    '}'
);

RainbowTester.run(
    'tag',

    'p {',

    '<span class="meta tag">p</span> {'
);

RainbowTester.run(
    'class',

    'p.intro {',

    '<span class="meta tag">p</span><span class="meta class">.intro</span> {'
);

RainbowTester.run(
    'id',

    'p#intro {',

    '<span class="meta tag">p</span><span class="meta id">#intro</span> {'
);

RainbowTester.run(
    'direct descendant',

    'p > span {',

    '<span class="meta tag">p</span> <span class="direct-descendant">&gt;</span> <span class="meta tag">span</span> {'
);

RainbowTester.run(
    'scss',

    'article {\n' +
    '   &amp;.cool {\n' +
    '       p {\n' +
    '           margin-top: 20px;\n' +
    '       }\n' +
    '   }\n' +
    '}',

    '<span class="meta tag">article</span> {\n' +
    '   <span class="meta sass">&amp;</span><span class="meta class">.cool</span> {\n' +
    '       <span class="meta tag">p</span> {\n' +
    '           <span class="support css-property">margin-top</span>: <span class="integer">20</span><span class="keyword unit">px</span>;\n' +
    '       }\n' +
    '   }\n' +
    '}'
);

RainbowTester.run(
    'style tag',

    '<style></style>',

    '&lt;<span class="meta style-tag">style</span>&gt;&lt;/<span class="meta style-tag">style</span>&gt;'
);

RainbowTester.run(
    'style tag with type',

    '<style type="text/css"></style>',

    '&lt;<span class="meta style-tag">style</span> <span class="meta style-tag">type</span>=<span class="string">"text/css"</span>&gt;&lt;/<span class="meta style-tag">style</span>&gt;'
);

RainbowTester.endTest('css');
