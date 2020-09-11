const rainbow = require('./src/rainbow-node.js');

import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'd';

export function testD(t) {
    run(
        t,

        language,

        'echo',

        'writeln("hello world");',

        'writeln(<span class="string">"hello world"</span>);'
    );

    run(
        t,

        language,

        'variable',

        'bool foo = true;',

        '<span class="keyword">bool</span> foo <span class="operator">=</span> <span class="constant">true</span>;'
    );

    run(
        t,

        language,

        'string concatenation',

        'string foo = "test " ~ "string " ~ "concatenation";',

        '<span class="keyword">string</span> foo <span class="operator">=</span> <span class="string">"test "</span> <span class="operator">~</span> <span class="string">"string "</span> <span class="operator">~</span> <span class="string">"concatenation"</span>;'
    );

    run(
        t,

        language,

        'typeof',

        "auto is_array_object = typeof(System.Array);",

        '<span class="keyword">auto</span> is_array_object <span class="operator">=</span> <span class="keyword">typeof</span>(System.Array);'
    );

    run(
        t,

        language,

        'array stuff',

        `string[] turtles = new string[] {
           "leonardo",
           "michaelangelo",
           "donatello",
           "raphael"
        };

        bool exists = turtles[0] == "leonardo";`,

        `<span class="keyword">string</span>[] turtles <span class="operator">=</span> <span class="keyword">new</span> <span class="keyword">string</span>[] {
           <span class="string">"leonardo"</span>,
           <span class="string">"michaelangelo"</span>,
           <span class="string">"donatello"</span>,
           <span class="string">"raphael"</span>
        };

        <span class="keyword">bool</span> exists <span class="operator">=</span> turtles[<span class="integer">0</span>] <span class="operator">==</span> <span class="string">"leonardo"</span>;`
    );

    run(
        t,

        language,

        'module declaration',

        'module SonicDatabase;',

        '<span class="keyword">module</span> SonicDatabase;'
    );

    run(
        t,

        language,

        'class declaration',

        'class MyClass {}',

        '<span class="storage class">class</span> <span class="entity name class">MyClass</span> {}'
    );

    run(
        t,

        language,

        'abstract class declaration',

        'abstract class MyClass {}',

        '<span class="storage modifier">abstract</span> <span class="storage class">class</span> <span class="entity name class">MyClass</span> {}'
    );

    run(
        t,

        language,

        'child class declaration',

        'class MyCollection : ICollection {}',

        '<span class="keyword">class</span> MyCollection <span class="operator">:</span> ICollection {}'
    );

    run(
        t,

        language,

        'test static',

        'static void doSomethingElse() {}',

        '<span class="keyword">static</span> <span class="keyword">void</span> doSomethingElse() {}'
    );

    run(
        t,

        language,

        'test new class',

        'new SomeClass();',

        '<span class="keyword new">new</span> <span class="support class">SomeClass</span>();'
    );

    run(
        t,

        language,

        'test new namespace class',

        'auto s = new Sonic.Database.Query();',

        '<span class="keyword">auto</span> s <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">Sonic</span>.<span class="support class">Database</span>.<span class="support class">Query</span>();'
    );

    run(
        t,

        language,

        'test static class call',

        'auto path = Sonic.App.getInstance();',

        '<span class="keyword">auto</span> path <span class="operator">=</span> Sonic.App.getInstance();'
    );

    run(
        t,

        language,

        'type hint',

        'public static string getForUser(User user, Sort sort) {}',

        '<span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">string</span> getForUser(User user, Sort sort) {}'
    );

    run(
        t,

        language,

        'template',

        'public List!string firstNames = new List!(string)()',

        '<span class="keyword">public</span> List<span class="operator">!</span><span class="keyword">string</span> firstNames <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">List</span>!(<span class="keyword">string</span>)()'
    );
}
