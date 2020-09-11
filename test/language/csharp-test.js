const rainbow = require('./src/rainbow-node.js');

import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'csharp';

export function testCsharp(t) {
    run(
        t,

        language,

        'echo',

        'Console.WriteLine("hello world");',

        'Console.WriteLine(<span class="string">"hello world"</span>);'
    );

    run(
        t,

        language,

        'variable',

        'var foo = true;',

        '<span class="keyword">var</span> foo <span class="operator">=</span> <span class="constant">true</span>;'
    );

    run(
        t,

        language,

        'string concatenation',

        'string foo = "test " + "string " + "concatenation";',

        '<span class="keyword">string</span> foo <span class="operator">=</span> <span class="string">"test "</span> <span class="operator">+</span> <span class="string">"string "</span> <span class="operator">+</span> <span class="string">"concatenation"</span>;'
    );

    run(
        t,

        language,

        'typeof',

        "var is_array_object = typeof(System.Array);",

        '<span class="keyword">var</span> is_array_object <span class="operator">=</span> <span class="keyword">typeof</span>(System.Array);'
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

        'namespace declaration',

        'namespace Sonic.Database {',

        '<span class="keyword">namespace</span> Sonic.Database {'
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

        'sealed class declaration',

        `sealed class TestClass
        {
        }`,

        `<span class="storage modifier">sealed</span> <span class="storage class">class</span> <span class="entity name class">TestClass</span>
        {
        }`
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

        'test magic function',

        `protected void Page_Load(object sender, EventArgs e)
        {
           // do whatever
        }`,

        `<span class="keyword">protected</span> <span class="keyword">void</span> Page_Load(<span class="keyword">object</span> sender, EventArgs e)
        {
           <span class="comment">// do whatever</span>
        }`
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

        'var s = new Sonic.Database.Query();',

        '<span class="keyword">var</span> s <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">Sonic</span>.<span class="support class">Database</span>.<span class="support class">Query</span>();'
    );

    run(
        t,

        language,

        'test static class call',

        'var path = Sonic.App.getInstance();',

        '<span class="keyword">var</span> path <span class="operator">=</span> Sonic.App.getInstance();'
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

        'generics',

        'public IList&lt;string&gt; firstNames = new List&lt;string&gt;()',

        '<span class="keyword">public</span> IList&lt;<span class="keyword">string</span>&gt; firstNames <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">List</span>&lt;<span class="keyword">string</span>&gt;()'
    );
}
