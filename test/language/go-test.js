const rainbow = require('./src/rainbow-node.js');

import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'go';

export function testGo(t) {
    run(
        t,

        language,

        'package declaration',

        'package examples',

        '<span class="keyword">package</span> examples'
    );

    run(
        t,

        language,

        'import declaration',

        `import (
            "fmt",
            "log",
            "github.com/ccampbell/clapp"
        )`,

        `<span class="keyword">import</span> (
            <span class="string">"fmt"</span>,
            <span class="string">"log"</span>,
            <span class="string">"github.com/ccampbell/clapp"</span>
        )`
    );

    run(
        t,

        language,

        'variable declaration',

        'var valid bool = true',

        '<span class="storage type">var</span> valid <span class="storage type">bool</span> <span class="keyword operator">=</span> <span class="constant language">true</span>'
    );

    run(
        t,

        language,

        'shorthand variable declaration',

        'count := 123',

        'count <span class="keyword operator initialize">:=</span> <span class="constant numeric">123</span>'
    );

    run(
        t,

        language,

        'function declaration',

        'func test(data MyStruct) {}',

        '<span class="storage function">func</span> <span class="entity name function">test</span>(data MyStruct) {}'
    );

    run(
        t,

        language,

        'function declaration with type',

        'func myFunc (nonHighlightedPrimitiveArg string, foo bar) {}',

        '<span class="storage function">func</span> <span class="entity name function">myFunc </span>(nonHighlightedPrimitiveArg <span class="storage type">string</span>, foo bar) {}'
    );

    skip(
        language,

        'placeholder inside of string',

        'graveAccentString = `highlights %s and %[1]s`',

        'graveAccentString <span class="keyword operator">=</span> <span class="string">`highlights <span class="constant other placeholder">%s</span> and <span class="constant other placeholder">%[1]s</span>`</span>'
    );

    run(
        t,

        language,

        'structure declaration',

        `type myStruct struct {
            Field1 string    \`tag1:""\`
        }`,

        `<span class="storage type">type</span> <span class="entity name struct">myStruct</span> <span class="storage type">struct</span> {
            Field1 <span class="storage type">string</span>    <span class="string">\`tag1:""\`</span>
        }`
    );

    run(
        t,

        language,

        'type declaration',

        'type LocalType map[int32]int64',

        '<span class="storage type">type</span> <span class="entity name type">LocalType</span> <span class="storage type">map</span>[<span class="storage type">int32</span>]<span class="storage type">int64</span>'
    );

    run(
        t,

        language,

        'func alone',

        'func',

        '<span class="storage type">func</span>'
    );

    run(
        t,

        language,

        'func attached to struct',

        'func (v *Type) myFunc(nonHighlightedPrimitiveArg /* Test, comments(!) */ [10]string, foo bar) (',

        '<span class="storage function">func</span> (v *Type) <span class="entity name function">myFunc</span>(nonHighlightedPrimitiveArg <span class="comment">/* Test, comments(!) */</span> [<span class="constant numeric">10</span>]<span class="storage type">string</span>, foo bar) ('
    );

    run(
        t,

        language,

        'func attached to struct simple',

        'func (t funcTypeExample) foobar() {}',

        '<span class="storage function">func</span> (t funcTypeExample) <span class="entity name function">foobar</span>() {}'
    );

    run(
        t,

        language,

        'type inside of word',

        'contentType := mime.TypeByExtension(path.Ext(file.Path()))',

        'contentType <span class="keyword operator initialize">:=</span> mime.<span class="function call">TypeByExtension</span>(path.<span class="function call">Ext</span>(file.<span class="function call">Path</span>()))'
    );

    run(
        t,

        language,

        'comment after website in string',

        'test := `http://example.com` // wow it works now',

        'test <span class="keyword operator initialize">:=</span> <span class="string">`http://example.com`</span> <span class="comment">// wow it works now</span>'
    );

    run(
        t,

        language,

        'concatenated ` strings',

        'test := `string`+`other string`',

        'test <span class="keyword operator initialize">:=</span> <span class="string">`string`</span><span class="keyword operator">+</span><span class="string">`other string`</span>'
    );
}
