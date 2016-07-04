import '../../src/language/generic';
import '../../src/language/javascript';
import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'javascript';

describe(language, () => {
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

        ' <span class="selector">$</span>(<span class="string">\'.some_class\'</span>).<span class="function call">show</span>()'
    );

    run(
        language,

        'window',

        'console.log(window.scrollX)',

        'console.<span class="function call">log</span>(<span class="support">window</span>.scrollX)'
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

        '<span class="storage type">var</span> pattern <span class="keyword operator">=</span> <span class="string regexp"><span class="string regexp open">/</span><span class="constant regexp escape">\\(</span>(.*?)<span class="constant regexp escape">\\)</span><span class="string regexp close">/</span><span class="string regexp modifier">g</span></span>'
    );

    run(
        language,

        'regex 2',

        'var pattern = /true/',

        '<span class="storage type">var</span> pattern <span class="keyword operator">=</span> <span class="string regexp"><span class="string regexp open">/</span>true<span class="string regexp close">/</span></span>'
    );

    run(
        language,

        'string no regex',

        'var test = "http://website.com/could/match/regex/i";',

        '<span class="storage type">var</span> test <span class="keyword operator">=</span> <span class="string">"http://website.com/could/match/regex/i"</span>;'
    );

    run(
        language,

        'single line comment vs. regex',

        'var Animal = function() { /* some comment */ };',

        '<span class="storage type">var</span> <span class="entity function">Animal</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() { <span class="comment">/* some comment */</span> };'
    );

    run(
        language,

        'class instantiation',

        'var animal = new Animal();',

        '<span class="storage type">var</span> animal <span class="keyword operator">=</span> <span class="keyword">new</span> <span class="variable type">Animal</span>();'
    );

    run(
        language,

        'inline function',

        `var foo = true,
            something = function() {
               // do something
            };`,

        `<span class="storage type">var</span> foo <span class="keyword operator">=</span> <span class="constant language">true</span>,
            <span class="entity function">something</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {
               <span class="comment">// do something</span>
            };`
    );

    run(
        language,

        'inline function beginning of line',

        `something = function() {
           // do something
        };`,

        `<span class="entity function">something</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {
           <span class="comment">// do something</span>
        };`
    );

    run(
        language,

        'functions in object',

        `window.Rainbow = {
            color: function() {
                // do something
            },

            other: function() {}
        };`,

        `<span class="support">window</span>.Rainbow <span class="keyword operator">=</span> {
            <span class="entity function">color</span>: <span class="keyword">function</span>() {
                <span class="comment">// do something</span>
            },

            <span class="entity function">other</span>: <span class="keyword">function</span>() {}
        };`
    );

    run(
        language,

        'JSON 1',

        `{
           "generated_in": "0.0423",
           "stat": "fail"
           "err": {
               "code": "1",
               "expl": "The user id or name was either not valid or not provided.",
               "msg": "User not found"
           }
        }`,

        `{
           <span class="string">"generated_in"</span>: <span class="string">"0.0423"</span>,
           <span class="string">"stat"</span>: <span class="string">"fail"</span>
           <span class="string">"err"</span>: {
               <span class="string">"code"</span>: <span class="string">"1"</span>,
               <span class="string">"expl"</span>: <span class="string">"The user id or name was either not valid or not provided."</span>,
               <span class="string">"msg"</span>: <span class="string">"User not found"</span>
           }
        }`
    );

    run(
        language,

        'JSON 2',

        `{
           "generated_in":"0.0423",
           "stat":"fail"
           "err":{
               "code":"1",
               "expl":"The user id or name was either not valid or not provided.",
               "msg":"User not found"
           }
        }`,

        `{
           <span class="string">"generated_in"</span>:<span class="string">"0.0423"</span>,
           <span class="string">"stat"</span>:<span class="string">"fail"</span>
           <span class="string">"err"</span>:{
               <span class="string">"code"</span>:<span class="string">"1"</span>,
               <span class="string">"expl"</span>:<span class="string">"The user id or name was either not valid or not provided."</span>,
               <span class="string">"msg"</span>:<span class="string">"User not found"</span>
           }
        }`
    );

    run(
        language,

        'multiple var declarations',

        `var language = getLanguage(source);
        var parseAndHighlight = function() {};
        var parseAndHighlight2 = function() {};`,

        `<span class="storage type">var</span> language <span class="keyword operator">=</span> <span class="function call">getLanguage</span>(source);
        <span class="storage type">var</span> <span class="entity function">parseAndHighlight</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {};
        <span class="storage type">var</span> <span class="entity function">parseAndHighlight2</span> <span class="keyword operator">=</span> <span class="keyword">function</span>() {};`
    );

    run(
        language,

        'multiple regex same line',

        "code.replace(/</g, '&lt;').replace(/>/g, '&gt;')",

        'code.<span class="support method">replace</span>(<span class="string regexp"><span class="string regexp open">/</span>&lt;<span class="string regexp close">/</span><span class="string regexp modifier">g</span></span>, <span class="string">\'&lt;\'</span>).<span class="support method">replace</span>(<span class="string regexp"><span class="string regexp open">/</span>&gt;<span class="string regexp close">/</span><span class="string regexp modifier">g</span></span>, <span class="string">\'&gt;\'</span>)'
    );

    run(
        language,

        'quotes inside curly brackets',

        '{\' \'}\n' +
        'var str = \'something\';',

        '{<span class="string">\' \'</span>}\n' +
        '<span class="storage type">var</span> str <span class="keyword operator">=</span> <span class="string">\'something\'</span>;'
    );

    run(
        language,

        'complex regex',

        '/\\/\\*[\\s\\S]*?\\*\\//gm',

        '<span class="string regexp"><span class="string regexp open">/</span><span class="constant regexp escape">\\/</span><span class="constant regexp escape">\\*</span>[<span class="constant regexp escape">\\s</span><span class="constant regexp escape">\\S</span>]*?<span class="constant regexp escape">\\*</span><span class="constant regexp escape">\\/</span><span class="string regexp close">/</span><span class="string regexp modifier">gm</span></span>'
    );

    run(
        language,

        'const declaration',

        'const something = true;',

        '<span class="storage type">const</span> something <span class="keyword operator">=</span> <span class="constant language">true</span>;'
    );

    run(
        language,

        'let declaration',

        'let something = true;',

        '<span class="storage type">let</span> something <span class="keyword operator">=</span> <span class="constant language">true</span>;'
    );

    run(
        language,

        'import statement',

        'import * as templates from \'./templates\'',

        '<span class="keyword">import</span> <span class="constant other">*</span> <span class="keyword">as</span> templates <span class="keyword">from</span> <span class="string">\'./templates\'</span>'
    );

    run(
        language,

        'export statement',

        'export default Template;',

        '<span class="keyword">export</span> <span class="keyword">default</span> Template;'
    );

    run(
        language,

        'export statement with asterisk',

        'export * from "./othermod";',

        '<span class="keyword">export</span> <span class="constant other">*</span> <span class="keyword">from</span> <span class="string">"./othermod"</span>;'
    );

    run(
        language,

        'class definition',

        `class Test {
            constructor(blah) {
                super(blah);
            }
        }`,

        `<span class="storage type class">class</span> <span class="entity name class">Test</span> {
            <span class="entity name function">constructor</span>(blah) {
                <span class="variable language super">super</span>(blah);
            }
        }`
    );

    run(
        language,

        'child class definition',

        'class Test extends SomethingElse {}',

        '<span class="storage type class">class</span> <span class="entity name class">Test</span> <span class="storage modifier extends">extends</span> <span class="entity other inherited-class">SomethingElse</span> {}'
    );

    run(
        language,

        'setters and getters',

        `set name(name) {
            this._name = name;
        }

        get name() {
            return this._name;
        }`,

       `<span class="storage type accessor">set</span> <span class="entity name function">name</span>(name) {
            <span class="variable language this">this</span>._name <span class="keyword operator">=</span> name;
        }

        <span class="storage type accessor">get</span> <span class="entity name function">name</span>() {
            <span class="keyword">return</span> <span class="variable language this">this</span>._name;
        }`
    );

    run(
        language,

        'default function arguments',

        'function something({ one = true, two = 123 } = {}) {}',

        '<span class="storage function">function</span> <span class="entity name function">something</span>({ one <span class="keyword operator">=</span> <span class="constant language">true</span>, two <span class="keyword operator">=</span> <span class="constant numeric">123</span> } <span class="keyword operator">=</span> {}) {}'
    );

    run(
        language,

        'arrow function with promise',

        `function test() {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }`,

        `<span class="storage function">function</span> <span class="entity name function">test</span>() {
            <span class="keyword">return</span> <span class="keyword">new</span> <span class="support class promise">Promise</span>((resolve, reject) <span class="storage type function arrow">=&gt;</span> {
                <span class="function call">resolve</span>();
            });
        }`
    );

    run(
        language,

        'keywords inside of other things',

        `const variation = true;
        let constrained = true;
        var outlet = true;`,

        `<span class="storage type">const</span> variation <span class="keyword operator">=</span> <span class="constant language">true</span>;
        <span class="storage type">let</span> constrained <span class="keyword operator">=</span> <span class="constant language">true</span>;
        <span class="storage type">var</span> outlet <span class="keyword operator">=</span> <span class="constant language">true</span>;`
    );

    // This is the same test as generic, but javascript could match regex patterns
    run(
        language,

        'comment after website string',

        'var test = "http://example.com/index.html"; // sweet website',

        '<span class="storage type">var</span> test <span class="keyword operator">=</span> <span class="string">"http://example.com/index.html"</span>; <span class="comment">// sweet website</span>'
    );

    run(
        language,

        'comment after website string again',

        "var test = 'http://example.com'; // what the hell?",

        '<span class="storage type">var</span> test <span class="keyword operator">=</span> <span class="string">\'http://example.com\'</span>; <span class="comment">// what the hell?</span>'
    );

    run(
        language,

        'promise as part of another word',

        'initPromise.then(function() {});',

        'initPromise.<span class="function call">then</span>(<span class="keyword">function</span>() {});'
    );
});

