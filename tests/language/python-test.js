/**
 * Python tests
 *
 * @author Craig Campbell
 */
RainbowTester.startTest('python');

RainbowTester.run(
    'no constant',

    'TEST_CONSTANT',

    '<span class="variable">TEST_CONSTANT</span>'
);

RainbowTester.run(
    'no self',

    'print self.something',

    '<span class="keyword">print</span> <span class="variable self">self</span>.something'
);

RainbowTester.run(
    'comment',

    '# this is a comment',

    '<span class="comment"># this is a comment</span>'
);

RainbowTester.run(
    'language constants',

    'var1 = None\n' +
    'var2 = True\n' +
    'someFunction(var3=False)',

    'var1 <span class="keyword operator">=</span> <span class="constant language">None</span>\n' +
    'var2 <span class="keyword operator">=</span> <span class="constant language">True</span>\n' +
    '<span class="function call">someFunction</span>(var3<span class="keyword operator">=</span><span class="constant language">False</span>)'
);

RainbowTester.run(
    'object',

    'object',

    '<span class="support object">object</span>'
);

RainbowTester.run(
    'import',

    'from SomePackage import SomeThing',

    '<span class="keyword">from</span> SomePackage <span class="keyword">import</span> SomeThing'
);

RainbowTester.run(
    'class',

    'class Something(object):\n' +
    '    pass',

    '<span class="keyword class">class</span> <span class="meta class-name">Something</span>(<span class="meta parent class-name">object</span>):\n' +
    '    <span class="keyword">pass</span>'
);

RainbowTester.run(
    'special method',

    'def __init__(self, some_var):\n' +
    '    pass',

    '<span class="keyword">def</span> <span class="support magic">__init__</span>(<span class="variable self">self</span>, some_var):\n' +
    '    <span class="keyword">pass</span>'
);

RainbowTester.run(
    'function',

    'def openFile(path):\n' +
    '   file = open(path, "r")\n' +
    '   content = file.read()\n' +
    '   file.close()\n' +
    '   return content',

    '<span class="keyword">def</span> <span class="meta function">openFile</span>(path):\n' +
    '   file <span class="keyword operator">=</span> <span class="function call">open</span>(path, <span class="string">"r"</span>)\n' +
    '   content <span class="keyword operator">=</span> file.<span class="function call">read</span>()\n' +
    '   file.<span class="function call">close</span>()\n' +
    '   <span class="keyword">return</span> content'
);

RainbowTester.run(
    'decorator',

    '@makebold\n' +
    '@makeitalic\n' +
    'def hello():\n' +
    '    return "hello world"',

    '<span class="meta decorator">@makebold</span>\n' +
    '<span class="meta decorator">@makeitalic</span>\n' +
    '<span class="keyword">def</span> <span class="meta function">hello</span>():\n' +
    '    <span class="keyword">return</span> <span class="string">"hello world"</span>'
);

RainbowTester.run(
    'docstring single line double quotes',

    '"""docstring test"""',

    '<span class="comment docstring">"""docstring test"""</span>'
);

RainbowTester.run(
    'docstring single line single quotes',

    "'''docstring test'''",

    '<span class="comment docstring">\'\'\'docstring test\'\'\'</span>'
);

RainbowTester.run(
    'docstring multiline',

    '"""test\n' +
    'multiline\n' +
    'yes"""',

    '<span class="comment docstring">"""test\n' +
    'multiline\n' +
    'yes"""</span>'
);

RainbowTester.endTest('python');
