const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'php';

export function testPHP(t) {
    run(
        t,

        language,

        'echo',

        'echo \'hello world\';',

        '<span class="support">echo</span> <span class="string">\'hello world\'</span>;'
    );

    run(
        t,

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
        t,

        language,

        'string concatenation',

        "$foo = 'test' . 'string' . 'concatenation';",

        '<span class="variable dollar-sign">$</span><span class="variable">foo</span> <span class="keyword operator">=</span> <span class="string">\'test\'</span> <span class="keyword dot">.</span> <span class="string">\'string\'</span> <span class="keyword dot">.</span> <span class="string">\'concatenation\'</span>;'
    );

    run(
        t,

        language,

        'include 1',

        "include 'App.php';",

        '<span class="keyword">include</span> <span class="string">\'App.php\'</span>;'
    );

    run(
        t,

        language,

        'include 2',

        "include_once('App.php');",

        '<span class="keyword">include_once</span>(<span class="string">\'App.php\'</span>);'
    );

    run(
        t,

        language,

        'instanceof',

        '$is_array_object = $collection instanceof ArrayObject;',

        '<span class="variable dollar-sign">$</span><span class="variable">is_array_object</span> <span class="keyword operator">=</span> <span class="variable dollar-sign">$</span><span class="variable">collection</span> <span class="keyword">instanceof</span> <span class="support class">ArrayObject</span>;'
    );

    run(
        t,

        language,

        'instanceof namespace class',

        '$is_user = $object instanceof App\\User;',

        '<span class="variable dollar-sign">$</span><span class="variable">is_user</span> <span class="keyword operator">=</span> <span class="variable dollar-sign">$</span><span class="variable">object</span> <span class="keyword">instanceof</span> <span class="support class">App</span>\\<span class="support class">User</span>;'
    );

    run(
        t,

        language,

        'array stuff',

        `$turtles = array(
           'leonardo',
           'michaelangelo',
           'donatello',
           'raphael'
        );

        $exists = array_key_exists(0, $turtles);`,

        `<span class="variable dollar-sign">$</span><span class="variable">turtles</span> <span class="keyword operator">=</span> <span class="support function">array</span>(
           <span class="string">'leonardo'</span>,
           <span class="string">'michaelangelo'</span>,
           <span class="string">'donatello'</span>,
           <span class="string">'raphael'</span>
        );

        <span class="variable dollar-sign">$</span><span class="variable">exists</span> <span class="keyword operator">=</span> <span class="support function">array_key_exists</span>(<span class="constant numeric">0</span>, <span class="variable dollar-sign">$</span><span class="variable">turtles</span>);`
    );

    run(
        t,

        language,

        'php tag',

        '&lt;?php echo $foo; ?&gt;',

        '<span class="variable language php-tag">&lt;?php</span> <span class="support">echo</span> <span class="variable dollar-sign">$</span><span class="variable">foo</span>; <span class="variable language php-tag">?&gt;</span>'
    );

    run(
        t,

        language,

        'php tag 2',

        '&lt;?php echo \'?&gt;\'; ?&gt;',

        '<span class="variable language php-tag">&lt;?php</span> <span class="support">echo</span> <span class="string">\'?&gt;\'</span>; <span class="variable language php-tag">?&gt;</span>'
    );

    run(
        t,

        language,

        'namespace declaration',

        'namespace Sonic\\Database;',

        '<span class="keyword namespace">namespace</span> <span class="support namespace">Sonic</span>\\<span class="support namespace">Database</span>;'
    );

    run(
        t,

        language,

        'use declaration',

        'use Sonic;',

        '<span class="keyword namespace">use</span> <span class="support namespace">Sonic</span>;'
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

        'trait declaration',

        'trait MyClass {}',

        '<span class="storage class">trait</span> <span class="entity name class">MyClass</span> {}'
    );

    run(
        t,

        language,

        'interface declaration',

        'interface IMyClass {}',

        '<span class="storage class">interface</span> <span class="entity name class">IMyClass</span> {}'
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

        'final class declaration',

        `final class TestClass
        {
        }`,

        `<span class="storage modifier">final</span> <span class="storage class">class</span> <span class="entity name class">TestClass</span>
        {
        }`
    );

    run(
        t,

        language,

        'class with an implementation declaration',

        'class Collection implements IList {}',

        '<span class="storage class">class</span> <span class="entity name class">Collection</span><span class="storage modifier extends"> implements </span><span class="entity other inherited-class">IList</span> {}'
    );

    run(
        t,

        language,

        'child class declaration',

        'class Collection extends ArrayObject {}',

        '<span class="storage class">class</span> <span class="entity name class">Collection</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">ArrayObject</span> {}'
    );

    run(
        t,

        language,

        'child class with an implementation declaration',

        'class Collection extends ArrayObject implements IList {}',

        '<span class="storage class">class</span> <span class="entity name class">Collection</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">ArrayObject</span><span class="storage modifier extends"> implements </span><span class="entity other inherited-class">IList</span> {}'
    );

    run(
        t,

        language,

        'final child class declaration',

        'final class TestClass extends \\Some\\Other\\Class {}',

        '<span class="storage modifier">final</span> <span class="storage class">class</span> <span class="entity name class">TestClass</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">\\Some\\Other\\Class</span> {}'
    );

    run(
        t,

        language,

        'test static',

        `self::_doSomething();
        static::_doSomethingElse();`,

        `<span class="keyword static">self::</span><span class="function call">_doSomething</span>();
        <span class="keyword static">static::</span><span class="function call">_doSomethingElse</span>();`
    );

    run(
        t,

        language,

        'test magic function',

        `function __autoload($class)
        {
           // do whatever
        }`,

        `<span class="storage function">function</span> <span class="entity name function magic">__autoload</span>(<span class="variable dollar-sign">$</span><span class="variable">class</span>)
        {
           <span class="comment">// do whatever</span>
        }`
    );

    run(
        t,

        language,

        'test magic method',

        `class SomeThing
        {
           protected $_foo;

           public function __construct($foo)
           {
               $this->_foo = $foo;
           }
        }`,

        `<span class="storage class">class</span> <span class="entity name class">SomeThing</span>
        {
           <span class="keyword">protected</span> <span class="variable dollar-sign">$</span><span class="variable">_foo</span>;

           <span class="keyword">public</span> <span class="storage function">function</span> <span class="entity name function magic">__construct</span>(<span class="variable dollar-sign">$</span><span class="variable">foo</span>)
           {
               <span class="variable dollar-sign">$</span><span class="variable">this</span><span class="keyword operator">-</span><span class="keyword operator">&gt;</span>_foo <span class="keyword operator">=</span> <span class="variable dollar-sign">$</span><span class="variable">foo</span>;
           }
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

        'new Sonic\\Database\\Query();',

        '<span class="keyword new">new</span> <span class="support class">Sonic</span>\\<span class="support class">Database</span>\\<span class="support class">Query</span>();'
    );

    run(
        t,

        language,

        'test new class without parenthesis',

        'new Sonic\\Controller;',

        '<span class="keyword new">new</span> <span class="support class">Sonic</span>\\<span class="support class">Controller</span>;'
    );

    run(
        t,

        language,

        'test static class call',

        '$path = Sonic\\App::getInstance()->getPath();',

        '<span class="variable dollar-sign">$</span><span class="variable">path</span> <span class="keyword operator">=</span> <span class="support class">Sonic</span>\\<span class="support class">App</span><span class="keyword static">::</span><span class="function call">getInstance</span>()<span class="keyword operator">-</span><span class="keyword operator">&gt;</span><span class="function call">getPath</span>();'
    );

    run(
        t,

        language,

        'constant language',

        'true; TRUE;',

        '<span class="constant language">true</span>; <span class="constant language">TRUE</span>;'
    );

    run(
        t,

        language,

        'constant',

        'TEST_CONSTANT',

        '<span class="constant">TEST_CONSTANT</span>'
    );

    run(
        t,

        language,

        'constant 2',

        '(TEST_CONSTANT_2)',

        '(<span class="constant">TEST_CONSTANT_2</span>)'
    );

    run(
        t,

        language,

        'class constant',

        '$version = Sonic\\App::VERSION',

        '<span class="variable dollar-sign">$</span><span class="variable">version</span> <span class="keyword operator">=</span> <span class="support class">Sonic</span>\\<span class="support class">App</span><span class="keyword static">::</span><span class="constant">VERSION</span>'
    );

    run(
        t,

        language,

        'static variable access',

        '$foo = Sonic\\App::$static_property;',

        '<span class="variable dollar-sign">$</span><span class="variable">foo</span> <span class="keyword operator">=</span> <span class="support class">Sonic</span>\\<span class="support class">App</span><span class="keyword static">::</span><span class="variable dollar-sign">$</span><span class="variable">static_property</span>;'
    );

    run(
        t,

        language,

        'type hint',

        'public static function getForUser(User $user, Sort $sort) {}',

        '<span class="keyword">public</span> <span class="keyword">static</span> <span class="storage function">function</span> <span class="entity name function">getForUser</span>(<span class="support class">User</span> <span class="variable dollar-sign">$</span><span class="variable">user</span>, <span class="support class">Sort</span> <span class="variable dollar-sign">$</span><span class="variable">sort</span>) {}'
    );


    run(
        t,

        language,

        'type hint with namespace',

        'public static function getForUser(\\SomeApp\\User $user) {}',

        '<span class="keyword">public</span> <span class="keyword">static</span> <span class="storage function">function</span> <span class="entity name function">getForUser</span>(\\<span class="support class">SomeApp</span>\\<span class="support class">User</span> <span class="variable dollar-sign">$</span><span class="variable">user</span>) {}'
    );

    run(
        t,

        language,

        'things should be case insensitive',

        `FUNCTION SOMETHING() {
            ECHO 'HELLO';
        }`,

        `<span class="storage function">FUNCTION</span> <span class="entity name function">SOMETHING</span>() {
            <span class="support">ECHO</span> <span class="string">\'HELLO\'</span>;
        }`
    );

    run(
        t,

        language,

        'new class syntax should not allow any character',

        "echo 'something something in New York' . $meh;",

        '<span class="support">echo</span> <span class="string">\'something something in New York\'</span> <span class="keyword dot">.</span> <span class="variable dollar-sign">$</span><span class="variable">meh</span>;'
    );
}
