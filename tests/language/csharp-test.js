/**
 * C# tests
 *
 * @author Dan Stewart
 * The csharp.js file is configured to not load generic.js
 */
RainbowTester.startTest('csharp');

RainbowTester.run(
    'echo',

    'Console.WriteLine("hello world");',

    'Console.WriteLine(<span class="string">"hello world"</span>);'
);

RainbowTester.run(
    'variable',

    'var foo = true;',

    '<span class="keyword">var</span> foo <span class="operator">=</span> <span class="constant">true</span>;'
);

RainbowTester.run(
    'string concatenation',

    'string foo = "test " + "string " + "concatenation";',

    '<span class="keyword">string</span> foo <span class="operator">=</span> <span class="string">"test "</span> <span class="operator">+</span> <span class="string">"string "</span> <span class="operator">+</span> <span class="string">"concatenation"</span>;'
);

RainbowTester.run(
    'typeof',

    "var is_array_object = typeof(System.Array);",

    '<span class="keyword">var</span> is_array_object <span class="operator">=</span> <span class="keyword">typeof</span>(System.Array);'
);

RainbowTester.run(
    'array stuff',

    'string[] turtles = new string[] {\n' +
    '   "leonardo",\n' +
    '   "michaelangelo",\n' +
    '   "donatello",\n' +
    '   "raphael"\n' +
    '};\n' +
    '\n' +
    'bool exists = turtles[0] == "leonardo";',

    '<span class="keyword">string</span>[] turtles <span class="operator">=</span> <span class="keyword">new</span> <span class="keyword">string</span>[] {\n' +
    '   <span class="string">"leonardo"</span>,\n' +
    '   <span class="string">"michaelangelo"</span>,\n' +
    '   <span class="string">"donatello"</span>,\n' +
    '   <span class="string">"raphael"</span>\n' +
    '};\n' +
    '\n' +
    '<span class="keyword">bool</span> exists <span class="operator">=</span> turtles[<span class="integer">0</span>] <span class="operator">==</span> <span class="string">"leonardo"</span>;'
);

RainbowTester.run(
    'namespace declaration',

    'namespace Sonic.Database {',

    '<span class="keyword">namespace</span> Sonic.Database {'
);

RainbowTester.run(
    'class declaration',

    'class MyClass {}',

    '<span class="storage class">class</span> <span class="entity name class">MyClass</span> {}'
);

RainbowTester.run(
    'abstract class declaration',

    'abstract class MyClass {}',

    '<span class="storage modifier">abstract</span> <span class="storage class">class</span> <span class="entity name class">MyClass</span> {}'
);

RainbowTester.run(
    'sealed class declaration',

    'sealed class TestClass\n' +
    '{\n' +
    '}',

    '<span class="storage modifier">sealed</span> <span class="storage class">class</span> <span class="entity name class">TestClass</span>\n' +
    '{\n' +
    '}'
);

RainbowTester.run(
    'child class declaration',

    'class MyCollection : ICollection {}',

    '<span class="keyword">class</span> MyCollection <span class="operator">:</span> ICollection {}'
);

RainbowTester.run(
    'test static',

    'static void doSomethingElse() {}',

    '<span class="keyword">static</span> <span class="keyword">void</span> doSomethingElse() {}'
);

RainbowTester.run(
    'test magic function',

    'protected void Page_Load(object sender, EventArgs e)\n' +
	'{\n' +
    '   // do whatever\n' +
    '}',

    '<span class="keyword">protected</span> <span class="keyword">void</span> Page_Load(<span class="keyword">object</span> sender, EventArgs e)\n' +
    '{\n' +
    '   <span class="comment">// do whatever</span>\n' +
    '}'
);

RainbowTester.run(
    'test new class',

    'new SomeClass();',

    '<span class="keyword new">new</span> <span class="support class">SomeClass</span>();'
);

RainbowTester.run(
    'test new namespace class',

    'var s = new Sonic.Database.Query();',

    '<span class="keyword">var</span> s <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">Sonic</span>.<span class="support class">Database</span>.<span class="support class">Query</span>();'
);

RainbowTester.run(
    'test static class call',

    'var path = Sonic.App.getInstance();',

    '<span class="keyword">var</span> path <span class="operator">=</span> Sonic.App.getInstance();'
);

RainbowTester.run(
    'type hint',

    'public static string getForUser(User user, Sort sort) {}',

    '<span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">string</span> getForUser(User user, Sort sort) {}'
);

RainbowTester.run(
    'generics',

    'public IList&lt;string&gt; firstNames = new List&lt;string&gt;()',

    '<span class="keyword">public</span> IList&lt;<span class="keyword">string</span>&gt; firstNames <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">List</span>&lt;<span class="keyword">string</span>&gt;()'
);

RainbowTester.endTest('csharp');