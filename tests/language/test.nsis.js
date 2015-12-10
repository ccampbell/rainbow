/* global describe, run */
var language = 'nsis';

describe(language, function() {
    run(
        language,

        'comment line 1',

        '; this is a comment',

        '<span class="comment line">; this is a comment</span>'
    );
    run(
        language,

        'comment line 2',

        '# this is a comment',

        '<span class="comment line"># this is a comment</span>'
    );

    run(
        language,

        'comment block',

        '/*\n' +
        'NSIS v3.0a\n' +
        'Released under the zlib/png license\n' +
        '*/',

        '<span class="comment block">/*\n' +
        'NSIS v3.0a\n' +
        'Released under the zlib/png license\n' +
        '*/</span>'
    );

    run(
        language,

        'include',

        '!include LogicLib.nsh',

        '<span class="support compiler">!include</span> LogicLib.nsh'
    );

    run(
        language,

        'string',

        '"this is a string"',

        '<span class="string"><span class="string open">"</span>this is a string<span class="string close">"</span></span>'
    );

    run(
        language,

        'language constant',

        'LangString DESC_SECTION_INDEX ${LANG_ENGLISH} "this is a string"',

        '<span class="keyword command">LangString</span> DESC_SECTION_INDEX <span class="variable definition">${LANG_ENGLISH}</span> <span class="string"><span class="string open">"</span>this is a string<span class="string close">"</span></span>'
    );

    run(
        language,

        'variable assignment',

        'StrCpy $0 "this is a string"',

        '<span class="keyword command">StrCpy</span> <span class="variable dollar-sign">$</span><span class="variable">0</span> <span class="string"><span class="string open">"</span>this is a string<span class="string close">"</span></span>'
    );

    run(
        language,

        'operator math',

        'IntOp $0 1 + 1',

        '<span class="keyword command">IntOp</span> <span class="variable dollar-sign">$</span><span class="variable">0</span> <span class="constant numeric">1</span> + <span class="constant numeric">1</span>'
    );

    run(
        language,

        'function',

        'Function .onInit\n'+
        '    Nop\n'+
        'FunctionEnd',

        '<span class="entity command block">Function</span> .onInit\n'+
        '    <span class="keyword command">Nop</span>\n'+
        '<span class="entity command block">FunctionEnd</span>'
    );

    run(
        language,

        'conditional',

        '!if 0 < 1\n'+
        '    MessageBox MB_OK "Always true"\n'+
        '!endif',

        '<span class="entity compiler block">!if</span> <span class="constant numeric">0</span> <span class="keyword operator">&lt;</span> <span class="constant numeric">1</span>\n'+
        '    <span class="keyword command">MessageBox</span> <span class="constant option">MB_OK</span> <span class="string"><span class="string open">"</span>Always true<span class="string close">"</span></span>\n'+
        '<span class="entity compiler block">!endif</span>'
    );

    run(
        language,

        'plugin',

        'nsExec::Exec "calc.exe"',

        '<span class="keyword plugin">nsExec::Exec</span> <span class="string"><span class="string open">"</span>calc.exe<span class="string close">"</span></span>'
    );

});
