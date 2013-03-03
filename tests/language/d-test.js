/**
 * D tests
 *
 * @author Matthew Brennan Jones
 */
RainbowTester.startTest('d');

RainbowTester.run(
    'echo',

    'writeln("hello world");',

    'writeln(<span class="string">"hello world"</span>);'
);

RainbowTester.run(
    'variable',

    'bool foo = true;',

    '<span class="keyword">bool</span> foo <span class="operator">=</span> <span class="constant">true</span>;'
);

RainbowTester.run(
    'string concatenation',

    'string foo = "test " ~ "string " ~ "concatenation";',

    '<span class="keyword">string</span> foo <span class="operator">=</span> <span class="string">"test "</span> <span class="operator">~</span> <span class="string">"string "</span> <span class="operator">~</span> <span class="string">"concatenation"</span>;'
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
    'module declaration',

    'module SonicDatabase;',

    '<span class="keyword">module</span> SonicDatabase;'
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
    'test new class',

    'new SomeClass();',

    '<span class="keyword new">new</span> <span class="support class">SomeClass</span>();'
);

RainbowTester.run(
    'test new namespace class',

    'auto s = new Sonic.Database.Query();',

    '<span class="keyword">auto</span> s <span class="operator">=</span> <span class="keyword new">new</span> <span class="support class">Sonic</span>.<span class="support class">Database</span>.<span class="support class">Query</span>();'
);

RainbowTester.run(
    'test static class call',

    'auto path = Sonic.App.getInstance();',

    '<span class="keyword">auto</span> path <span class="operator">=</span> Sonic.App.getInstance();'
);

RainbowTester.run(
    'type hint',

    'public static string getForUser(User user, Sort sort) {}',

    '<span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">string</span> getForUser(User user, Sort sort) {}'
);

RainbowTester.run(
    'template',

    'public List!string firstNames = new List!string()',

    '<span class="keyword">public</span> List!<span class="keyword">string</span> firstNames <span class="operator">=</span> <span class="keyword new">new</span> List!<span class="keyword">string</span>()'
);

RainbowTester.endTest('d');

