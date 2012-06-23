/**
 * Smalltalk tests
 *
 * @author Frank Shearar
 */
RainbowTester.startTest('smalltalk');

RainbowTester.run(
    'constant true',

    'true',

    '<span class="keyword constant">true</span>'
);

RainbowTester.run(
    'constant false',

    'false',

    '<span class="keyword constant">false</span>'
);

RainbowTester.run(
    'constant nil',

    'nil',

    '<span class="keyword constant">nil</span>'
);

RainbowTester.run(
    'self pseudovariable',

    'self',

    '<span class="keyword pseudovariable">self</span>'
);

RainbowTester.run(
    'thisContext pseudovariable',

    'thisContext',

    '<span class="keyword pseudovariable">thisContext</span>'
);

RainbowTester.run(
    'two-character operator !!',

    '!!',

    '<span class="entity name binary">!!</span>'
);

RainbowTester.run(
    'two-character operator //',

    '//',

    '<span class="entity name binary">//</span>'
);

RainbowTester.run(
    '| delimiter',

    '|',

    '<span class="entity name binary">|</span>'
);

RainbowTester.run(
    '|| binary selector',

    '||',

    '<span class="entity name binary">||</span>'
);

RainbowTester.run(
    'HTML-unfriendly operator',

    '&',

    '<span class="entity name binary">&amp;</span>'
);

RainbowTester.run(
    'three-character operator',

    '>>=',

    '<span class="entity name binary">&gt;&gt;=</span>'
);

RainbowTester.run(
    'String-like Symbol',

    "#'this is a symbol'",

    "<span class=\"string symbol\">#'this is a symbol'</span>"
);

RainbowTester.run(
    'Symbol',

    "#thisIsaSymbol0",

    "<span class=\"string symbol\">#thisIsaSymbol0</span>"
);

RainbowTester.run(
    'String',

    "'This is a string'",

    '<span class="string">\'This is a string\'</span>'
);

RainbowTester.run(
    'Comment',

    '"This is a comment"',

    '<span class="comment">"This is a comment"</span>'
);

RainbowTester.run(
    'Comment in between message sends',

    'self "this is a comment" foo',

    '<span class="keyword pseudovariable">self</span> <span class="comment">"this is a comment"</span> <span class="entity name function">foo</span>'
);

RainbowTester.run(
    'Integer',

    '987654321',

    '<span class="constant numeric">987654321</span>'
);

RainbowTester.run(
    'Negative integer',

    '-987654321',

    '<span class="constant numeric">-987654321</span>'
);

RainbowTester.run(
    'Exponent integer',

    '987654321e10',

    '<span class="constant numeric">987654321e10</span>'
);

RainbowTester.run(
    'Negative exponent integer',

    '-987654321e10',

    '<span class="constant numeric">-987654321e10</span>'
);

RainbowTester.run(
    'Radix Integer',

    '16r987654321deadbeef',

    '<span class="constant numeric">16r987654321deadbeef</span>'
);

RainbowTester.run(
    'Negative radix Integer',

    '16r-987654321deadbeef',

    '<span class="constant numeric">16r-987654321deadbeef</span>'
);

RainbowTester.run(
    'Float',

    '987654321.0',

    '<span class="constant numeric">987654321.0</span>'
);

RainbowTester.run(
    'Negative float',

    '-987654321.0',

    '<span class="constant numeric">-987654321.0</span>'
);

RainbowTester.run(
    'Exponent float',

    '1.0e10',

    '<span class="constant numeric">1.0e10</span>'
);

RainbowTester.run(
    'Negative exponent float',

    '1.0e-10',

    '<span class="constant numeric">1.0e-10</span>'
);

RainbowTester.run(
    'Negative exponent negative float',

    '-1.0e-10',

    '<span class="constant numeric">-1.0e-10</span>'
);

RainbowTester.run(
    'Scaled decimal',

    '1.0s10',

    '<span class="constant numeric">1.0s10</span>'
);

RainbowTester.run(
    'Class name, normal',

    'Class',

    '<span class="entity name class">Class</span>'
);

RainbowTester.run(
    'Class name, with digits',

    'Class0zero',

    '<span class="entity name class">Class0zero</span>'
);

RainbowTester.endTest('smalltalk');
