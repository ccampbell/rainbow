const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'python';

export function testPython(t) {
    run(
        t,

        language,

        'no self',

        'print self.something',

        '<span class="keyword">print</span> <span class="variable self">self</span>.something'
    );

    run(
        t,

        language,

        'comment',

        '# this is a comment',

        '<span class="comment"># this is a comment</span>'
    );

    run(
        t,

        language,

        'language constants',

        `var1 = None
        var2 = True
        someFunction(var3=False)`,

        `var1 <span class="keyword operator">=</span> <span class="constant language">None</span>
        var2 <span class="keyword operator">=</span> <span class="constant language">True</span>
        <span class="function call">someFunction</span>(var3<span class="keyword operator">=</span><span class="constant language">False</span>)`
    );

    run(
        t,

        language,

        'object',

        'object',

        '<span class="support object">object</span>'
    );

    run(
        t,

        language,

        'import',

        'from SomePackage import SomeThing',

        '<span class="keyword">from</span> SomePackage <span class="keyword">import</span> SomeThing'
    );

    run(
        t,

        language,

        'class',

        `class Something(object):
            pass`,

        `<span class="storage class">class</span> <span class="entity name class">Something</span>(<span class="entity other inherited-class">object</span>):
            <span class="keyword">pass</span>`
    );

    run(
        t,

        language,

        'special method',

        `def __init__(self, some_var):
            pass`,

        `<span class="storage function">def</span> <span class="support magic">__init__</span>(<span class="variable self">self</span>, some_var):
            <span class="keyword">pass</span>`
    );

    run(
        t,

        language,

        'function',

        `def openFile(path):
           file = open(path, "r")
           content = file.read()
           file.close()
           return content`,

        `<span class="storage function">def</span> <span class="entity name function">openFile</span>(path):
           file <span class="keyword operator">=</span> <span class="support function python">open</span>(path, <span class="string">"r"</span>)
           content <span class="keyword operator">=</span> file.<span class="function call">read</span>()
           file.<span class="function call">close</span>()
           <span class="keyword">return</span> content`
    );

    run(
        t,

        language,

        'decorator',

        `@makebold
        @makeitalic
        def hello():
            return "hello world"`,

        `<span class="entity name function decorator">@makebold</span>
        <span class="entity name function decorator">@makeitalic</span>
        <span class="storage function">def</span> <span class="entity name function">hello</span>():
            <span class="keyword">return</span> <span class="string">"hello world"</span>`
    );

    run(
        t,

        language,

        '__main__',

        `if __name__ == '__main__':
           pass`,

        `<span class="keyword">if</span> <span class="support magic">__name__</span> <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="string">'__main__'</span>:
           <span class="keyword">pass</span>`
    );

    run(
        t,

        language,

        'try catch',

        `try:
           import cPickle as pickle
        except ImportError:
           import pickle`,

        `<span class="keyword">try</span>:
           <span class="keyword">import</span> cPickle <span class="keyword">as</span> pickle
        <span class="keyword control">except</span> <span class="support exception type">ImportError</span>:
           <span class="keyword">import</span> pickle`
    );

    run(
        t,

        language,

        'docstring single line double quotes',

        '"""docstring test"""',

        '<span class="comment docstring">"""docstring test"""</span>'
    );

    run(
        t,

        language,

        'docstring single line single quotes',

        "'''docstring test'''",

        '<span class="comment docstring">\'\'\'docstring test\'\'\'</span>'
    );

    run(
        t,

        language,

        'docstring multiline',

        `"""test
        multiline
        yes"""`,

        `<span class="comment docstring">"""test
        multiline
        yes"""</span>`
    );

    run(
        t,

        language,

        'decorator with dot',

        '@tornado.web.asynchronous',

        '<span class="entity name function decorator">@tornado.web.asynchronous</span>'
    );

    run(
        t,

        language,

        'multiple docstrings',

        `"""
        x
        """
        2 + 2
        """
        y
        """`,

        `<span class="comment docstring">"""
        x
        """</span>
        <span class="constant numeric">2</span> <span class="keyword operator">+</span> <span class="constant numeric">2</span>
        <span class="comment docstring">"""
        y
        """</span>`
    );
}
