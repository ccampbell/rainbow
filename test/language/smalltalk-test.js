const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'smalltalk';

export function testSmalltalk(t) {
    run(
        t,

        language,

        'constant true',

        'true',

        '<span class="keyword constant">true</span>'
    );

    run(
        t,

        language,

        'constant false',

        'false',

        '<span class="keyword constant">false</span>'
    );

    run(
        t,

        language,

        'constant nil',

        'nil',

        '<span class="keyword constant">nil</span>'
    );

    run(
        t,

        language,

        'self pseudovariable',

        'self',

        '<span class="keyword pseudovariable">self</span>'
    );

    run(
        t,

        language,

        'thisContext pseudovariable',

        'thisContext',

        '<span class="keyword pseudovariable">thisContext</span>'
    );

    run(
        t,

        language,

        'two-character operator !!',

        '!!',

        '<span class="entity name binary">!!</span>'
    );

    run(
        t,

        language,

        'two-character operator //',

        '//',

        '<span class="entity name binary">//</span>'
    );

    run(
        t,

        language,

        '| delimiter',

        '|',

        '<span class="entity name binary">|</span>'
    );

    run(
        t,

        language,

        '|| binary selector',

        '||',

        '<span class="entity name binary">||</span>'
    );

    run(
        t,

        language,

        'HTML-unfriendly operator',

        '&',

        '<span class="entity name binary">&amp;</span>'
    );

    run(
        t,

        language,

        'three-character operator',

        '>>=',

        '<span class="entity name binary">&gt;&gt;=</span>'
    );

    run(
        t,

        language,

        'String-like Symbol',

        "#'this is a symbol'",

        "<span class=\"string symbol\">#'this is a symbol'</span>"
    );

    run(
        t,

        language,

        'Symbol',

        "#thisIsaSymbol0",

        "<span class=\"string symbol\">#thisIsaSymbol0</span>"
    );

    run(
        t,

        language,

        'String',

        "'This is a string'",

        '<span class="string">\'This is a string\'</span>'
    );

    run(
        t,

        language,

        'Comment',

        '"This is a comment"',

        '<span class="comment">"This is a comment"</span>'
    );

    run(
        t,

        language,

        'Comment in between message sends',

        'self "this is a comment" foo',

        '<span class="keyword pseudovariable">self</span> <span class="comment">"this is a comment"</span> <span class="entity name function">foo</span>'
    );

    run(
        t,

        language,

        'Integer',

        '987654321',

        '<span class="constant numeric">987654321</span>'
    );

    run(
        t,

        language,

        'Negative integer',

        '-987654321',

        '<span class="constant numeric">-987654321</span>'
    );

    run(
        t,

        language,

        'Exponent integer',

        '987654321e10',

        '<span class="constant numeric">987654321e10</span>'
    );

    run(
        t,

        language,

        'Negative exponent integer',

        '-987654321e10',

        '<span class="constant numeric">-987654321e10</span>'
    );

    run(
        t,

        language,

        'Radix Integer',

        '16r987654321deadbeef',

        '<span class="constant numeric">16r987654321deadbeef</span>'
    );

    run(
        t,

        language,

        'Negative radix Integer',

        '16r-987654321deadbeef',

        '<span class="constant numeric">16r-987654321deadbeef</span>'
    );

    run(
        t,

        language,

        'Float',

        '987654321.0',

        '<span class="constant numeric">987654321.0</span>'
    );

    run(
        t,

        language,

        'Negative float',

        '-987654321.0',

        '<span class="constant numeric">-987654321.0</span>'
    );

    run(
        t,

        language,

        'Exponent float',

        '1.0e10',

        '<span class="constant numeric">1.0e10</span>'
    );

    run(
        t,

        language,

        'Negative exponent float',

        '1.0e-10',

        '<span class="constant numeric">1.0e-10</span>'
    );

    run(
        t,

        language,

        'Negative exponent negative float',

        '-1.0e-10',

        '<span class="constant numeric">-1.0e-10</span>'
    );

    run(
        t,

        language,

        'Scaled decimal',

        '1.0s10',

        '<span class="constant numeric">1.0s10</span>'
    );

    run(
        t,

        language,

        'Class name, normal',

        'Class',

        '<span class="entity name class">Class</span>'
    );

    run(
        t,

        language,

        'Class name, with digits',

        'Class0zero',

        '<span class="entity name class">Class0zero</span>'
    );
}
