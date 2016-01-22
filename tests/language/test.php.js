/* global describe, run */
var language = 'php';

describe(language, function() {
    run(
        language,

        'echo',

        'echo \'hello world\';',

        '<span class="support">echo</span> <span class="string">\'hello world\'</span>;'
    );

    run(
        language,

        'variable',

        '$foo = true;',

        '<span class="variable dollar-sign">$</span><span class="variable">foo</span> <span class="keyword operator">=</span> <span class="constant language">true</span>;'
    );

    skip(
        language,

        'variable variable',

        '$$foo = true;',

        '<span class="variable dollar-sign">$$</span><span class="variable">foo</span> <span class="keyword operator">=</span> <span class="constant language">true</span>;'
    );

    run(
        language,

        'string concatenation',

        "$foo = 'test' . 'string' . 'concatenation';",

        '<span class="variable dollar-sign">$</span><span class="variable">foo</span> <span class="keyword operator">=</span> <span class="string">\'test\'</span> <span class="keyword dot">.</span> <span class="string">\'string\'</span> <span class="keyword dot">.</span> <span class="string">\'concatenation\'</span>;'
    );

    run(
        language,

        'include 1',

        "include 'App.php';",

        '<span class="keyword">include</span> <span class="string">\'App.php\'</span>;'
    );

    run(
        language,

        'include 2',

        "include_once('App.php');",

        '<span class="keyword">include_once</span>(<span class="string">\'App.php\'</span>);'
    );

    run(
        language,

        'instanceof',

        "$is_array_object = $collection instanceof ArrayObject;",

        '<span class="variable dollar-sign">$</span><span class="variable">is_array_object</span> <span class="keyword operator">=</span> <span class="variable dollar-sign">$</span><span class="variable">collection</span> <span class="keyword">instanceof</span> <span class="support class">ArrayObject</span>;'
    );

    run(
        language,

        'instanceof namespace class',

        "$is_user = $object instanceof App\\User;",

        '<span class="variable dollar-sign">$</span><span class="variable">is_user</span> <span class="keyword operator">=</span> <span class="variable dollar-sign">$</span><span class="variable">object</span> <span class="keyword">instanceof</span> <span class="support class">App</span>\\<span class="support class">User</span>;'
    );

    run(
        language,

        'array stuff',

        '$turtles = array(\n' +
        '   \'leonardo\',\n' +
        '   \'michaelangelo\',\n' +
        '   \'donatello\',\n' +
        '   \'raphael\'\n' +
        ');\n' +
        '\n' +
        '$exists = array_key_exists(0, $turtles);',

        '<span class="variable dollar-sign">$</span><span class="variable">turtles</span> <span class="keyword operator">=</span> <span class="support function">array</span>(\n' +
        '   <span class="string">\'leonardo\'</span>,\n' +
        '   <span class="string">\'michaelangelo\'</span>,\n' +
        '   <span class="string">\'donatello\'</span>,\n' +
        '   <span class="string">\'raphael\'</span>\n' +
        ');\n' +
        '\n' +
        '<span class="variable dollar-sign">$</span><span class="variable">exists</span> <span class="keyword operator">=</span> <span class="support function">array_key_exists</span>(<span class="constant numeric">0</span>, <span class="variable dollar-sign">$</span><span class="variable">turtles</span>);'
    );

    run(
        language,

        'php tag',

        '&lt;?php echo $foo; ?&gt;',

        '<span class="variable language php-tag">&lt;?php</span> <span class="support">echo</span> <span class="variable dollar-sign">$</span><span class="variable">foo</span>; <span class="variable language php-tag">?&gt;</span>'
    );

    run(
        language,

        'php tag 2',

        '&lt;?php echo \'?&gt;\'; ?&gt;',

        '<span class="variable language php-tag">&lt;?php</span> <span class="support">echo</span> <span class="string">\'?&gt;\'</span>; <span class="variable language php-tag">?&gt;</span>'
    );

    run(
        language,

        'namespace declaration',

        'namespace Sonic\\Database;',

        '<span class="keyword namespace">namespace</span> <span class="support namespace">Sonic</span>\\<span class="support namespace">Database</span>;'
    );

    run(
        language,

        'use declaration',

        'use Sonic;',

        '<span class="keyword namespace">use</span> <span class="support namespace">Sonic</span>;'
    );

    run(
        language,

        'class declaration',

        'class MyClass {}',

        '<span class="storage class">class</span> <span class="entity name class">MyClass</span> {}'
    );

    run(
        language,

        'trait declaration',

        'trait MyClass {}',

        '<span class="storage class">trait</span> <span class="entity name class">MyClass</span> {}'
    );

    run(
        language,

        'interface declaration',

        'interface IMyClass {}',

        '<span class="storage class">interface</span> <span class="entity name class">IMyClass</span> {}'
    );

    run(
        language,

        'abstract class declaration',

        'abstract class MyClass {}',

        '<span class="storage modifier">abstract</span> <span class="storage class">class</span> <span class="entity name class">MyClass</span> {}'
    );

    run(
        language,

        'final class declaration',

        'final class TestClass\n' +
        '{\n' +
        '}',

        '<span class="storage modifier">final</span> <span class="storage class">class</span> <span class="entity name class">TestClass</span>\n' +
        '{\n' +
        '}'
    );

    run(
        language,

        'class with an implementation declaration',

        'class Collection implements IList {}',

        '<span class="storage class">class</span> <span class="entity name class">Collection</span><span class="storage modifier extends"> implements </span><span class="entity other inherited-class">IList</span> {}'
    );

    run(
        language,

        'child class declaration',

        'class Collection extends ArrayObject {}',

        '<span class="storage class">class</span> <span class="entity name class">Collection</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">ArrayObject</span> {}'
    );

    run(
        language,

        'child class with an implementation declaration',

        'class Collection extends ArrayObject implements IList {}',

        '<span class="storage class">class</span> <span class="entity name class">Collection</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">ArrayObject</span><span class="storage modifier extends"> implements </span><span class="entity other inherited-class">IList</span> {}'
    );

    run(
        language,

        'final child class declaration',

        'final class TestClass extends \\Some\\Other\\Class {}',

        '<span class="storage modifier">final</span> <span class="storage class">class</span> <span class="entity name class">TestClass</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">\\Some\\Other\\Class</span> {}'
    );

    run(
        language,

        'test static',

        'self::_doSomething();\n' +
        'static::_doSomethingElse();',

        '<span class="keyword static">self::</span><span class="function call">_doSomething</span>();\n' +
        '<span class="keyword static">static::</span><span class="function call">_doSomethingElse</span>();'
    );

    run(
        language,

        'test magic function',

        'function __autoload($class)\n' +
        '{\n' +
        '   // do whatever\n' +
        '}',

        '<span class="storage function">function</span> <span class="support magic">__autoload</span>(<span class="variable dollar-sign">$</span><span class="variable">class</span>)\n' +
        '{\n' +
        '   <span class="comment">// do whatever</span>\n' +
        '}'
    );

    run(
        language,

        'test magic method',

        'class SomeThing\n' +
        '{\n' +
        '   protected $_foo;\n' +
        '\n' +
        '   public function __construct($foo)\n' +
        '   {\n' +
        '       $this->_foo = $foo;\n' +
        '   }\n' +
        '}',

        '<span class="storage class">class</span> <span class="entity name class">SomeThing</span>\n' +
        '{\n' +
        '   <span class="keyword">protected</span> <span class="variable dollar-sign">$</span><span class="variable">_foo</span>;\n' +
        '\n' +
        '   <span class="keyword">public</span> <span class="storage function">function</span> <span class="support magic">__construct</span>(<span class="variable dollar-sign">$</span><span class="variable">foo</span>)\n' +
        '   {\n' +
        '       <span class="variable dollar-sign">$</span><span class="variable">this</span><span class="keyword operator">-</span><span class="keyword operator">&gt;</span>_foo <span class="keyword operator">=</span> <span class="variable dollar-sign">$</span><span class="variable">foo</span>;\n' +
        '   }\n' +
        '}'
    );

    run(
        language,

        'test new class',

        'new SomeClass();',

        '<span class="keyword new">new</span> <span class="support class">SomeClass</span>();'
    );

    run(
        language,

        'test new namespace class',

        'new Sonic\\Database\\Query();',

        '<span class="keyword new">new</span> <span class="support class">Sonic</span>\\<span class="support class">Database</span>\\<span class="support class">Query</span>();'
    );

    run(
        language,

        'test new class without parenthesis',

        'new Sonic\\Controller;',

        '<span class="keyword new">new</span> <span class="support class">Sonic</span>\\<span class="support class">Controller</span>;'
    );

    run(
        language,

        'test static class call',

        '$path = Sonic\\App::getInstance()->getPath();',

        '<span class="variable dollar-sign">$</span><span class="variable">path</span> <span class="keyword operator">=</span> <span class="support class">Sonic</span>\\<span class="support class">App</span><span class="keyword static">::</span><span class="function call">getInstance</span>()<span class="keyword operator">-</span><span class="keyword operator">&gt;</span><span class="function call">getPath</span>();'
    );

    run(
        language,

        'constant language',

        'true; TRUE;',

        '<span class="constant language">true</span>; <span class="constant language">TRUE</span>;'
    );

    run(
        language,

        'constant',

        'TEST_CONSTANT',

        '<span class="constant">TEST_CONSTANT</span>'
    );

    run(
        language,

        'constant 2',

        '(TEST_CONSTANT_2)',

        '(<span class="constant">TEST_CONSTANT_2</span>)'
    );

    run(
        language,

        'class constant',

        '$version = Sonic\\App::VERSION',

        '<span class="variable dollar-sign">$</span><span class="variable">version</span> <span class="keyword operator">=</span> <span class="support class">Sonic</span>\\<span class="support class">App</span><span class="keyword static">::</span><span class="constant">VERSION</span>'
    );

    run(
        language,

        'static variable access',

        '$foo = Sonic\\App::$static_property;',

        '<span class="variable dollar-sign">$</span><span class="variable">foo</span> <span class="keyword operator">=</span> <span class="support class">Sonic</span>\\<span class="support class">App</span><span class="keyword static">::</span><span class="variable dollar-sign">$</span><span class="variable">static_property</span>;'
    );

    run(
        language,

        'type hint',

        'public static function getForUser(User $user, Sort $sort) {}',

        '<span class="keyword">public</span> <span class="keyword">static</span> <span class="storage function">function</span> <span class="entity name function">getForUser</span>(<span class="support class">User</span> <span class="variable dollar-sign">$</span><span class="variable">user</span>, <span class="support class">Sort</span> <span class="variable dollar-sign">$</span><span class="variable">sort</span>) {}'
    );


    run(
        language,

        'type hint with namespace',

        'public static function getForUser(\\SomeApp\\User $user) {}',

        '<span class="keyword">public</span> <span class="keyword">static</span> <span class="storage function">function</span> <span class="entity name function">getForUser</span>(\\<span class="support class">SomeApp</span>\\<span class="support class">User</span> <span class="variable dollar-sign">$</span><span class="variable">user</span>) {}'
    );
});
