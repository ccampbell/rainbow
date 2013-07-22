/* global describe, run */
var language = 'python';

describe(language, function() {
    run(
        language,

        'no self',

        'print self.something',

        '<span class="keyword">print</span> <span class="variable self">self</span>.something'
    );

    run(
        language,

        'comment',

        '# this is a comment',

        '<span class="comment"># this is a comment</span>'
    );

    run(
        language,

        'language constants',

        'var1 = None\n' +
        'var2 = True\n' +
        'someFunction(var3=False)',

        'var1 <span class="keyword operator">=</span> <span class="constant language">None</span>\n' +
        'var2 <span class="keyword operator">=</span> <span class="constant language">True</span>\n' +
        '<span class="function call">someFunction</span>(var3<span class="keyword operator">=</span><span class="constant language">False</span>)'
    );

    run(
        language,

        'object',

        'object',

        '<span class="support object">object</span>'
    );

    run(
        language,

        'import',

        'from SomePackage import SomeThing',

        '<span class="keyword">from</span> SomePackage <span class="keyword">import</span> SomeThing'
    );

    run(
        language,

        'class',

        'class Something(object):\n' +
        '    pass',

        '<span class="storage class">class</span> <span class="entity name class">Something</span>(<span class="entity other inherited-class">object</span>):\n' +
        '    <span class="keyword">pass</span>'
    );

    run(
        language,

        'special method',

        'def __init__(self, some_var):\n' +
        '    pass',

        '<span class="storage function">def</span> <span class="support magic">__init__</span>(<span class="variable self">self</span>, some_var):\n' +
        '    <span class="keyword">pass</span>'
    );

    run(
        language,

        'function',

        'def openFile(path):\n' +
        '   file = open(path, "r")\n' +
        '   content = file.read()\n' +
        '   file.close()\n' +
        '   return content',

        '<span class="storage function">def</span> <span class="entity name function">openFile</span>(path):\n' +
        '   file <span class="keyword operator">=</span> <span class="support function python">open</span>(path, <span class="string">"r"</span>)\n' +
        '   content <span class="keyword operator">=</span> file.<span class="function call">read</span>()\n' +
        '   file.<span class="function call">close</span>()\n' +
        '   <span class="keyword">return</span> content'
    );

    run(
        language,

        'decorator',

        '@makebold\n' +
        '@makeitalic\n' +
        'def hello():\n' +
        '    return "hello world"',

        '<span class="entity name function decorator">@makebold</span>\n' +
        '<span class="entity name function decorator">@makeitalic</span>\n' +
        '<span class="storage function">def</span> <span class="entity name function">hello</span>():\n' +
        '    <span class="keyword">return</span> <span class="string">"hello world"</span>'
    );

    run(
        language,

        '__main__',

        'if __name__ == \'__main__\':\n' +
        '   pass',

        '<span class="keyword">if</span> <span class="support magic">__name__</span> <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="string">\'__main__\'</span>:\n' +
        '   <span class="keyword">pass</span>'
    );

    run(
        language,

        'try catch',

        'try:\n' +
        '   import cPickle as pickle\n' +
        'except ImportError:\n' +
        '   import pickle',

        '<span class="keyword">try</span>:\n' +
        '   <span class="keyword">import</span> cPickle <span class="keyword">as</span> pickle\n' +
        '<span class="keyword control">except</span> <span class="support exception type">ImportError</span>:\n' +
        '   <span class="keyword">import</span> pickle'
    );

    run(
        language,

        'docstring single line double quotes',

        '"""docstring test"""',

        '<span class="comment docstring">"""docstring test"""</span>'
    );

    run(
        language,

        'docstring single line single quotes',

        "'''docstring test'''",

        '<span class="comment docstring">\'\'\'docstring test\'\'\'</span>'
    );

    run(
        language,

        'docstring multiline',

        '"""test\n' +
        'multiline\n' +
        'yes"""',

        '<span class="comment docstring">"""test\n' +
        'multiline\n' +
        'yes"""</span>'
    );

    run(
        language,

        'decorator with dot',

        '@tornado.web.asynchronous',

        '<span class="entity name function decorator">@tornado.web.asynchronous</span>'
    );

    run(
        language,

        'multiple docstrings',

        '"""\n' +
        'x\n' +
        '"""\n' +
        '2 + 2\n' +
        '"""\n' +
        'y\n' +
        '"""',

        '<span class="comment docstring">"""\n' +
        'x\n' +
        '"""</span>\n' +
        '<span class="constant numeric">2</span> <span class="keyword operator">+</span> <span class="constant numeric">2</span>\n' +
        '<span class="comment docstring">"""\n' +
        'y\n' +
        '"""</span>'
    );
});
