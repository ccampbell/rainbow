/**
 * html tests
 *
 * @author Craig Campbell
 */
RainbowTester.startTest('html');


RainbowTester.run(
    'comment',

    '<!-- this is a comment -->',

    '<span class="comment html">&lt;!-- this is a comment --&gt;</span>'
);


RainbowTester.run(
    'multi-line comment',

    '<!-- this is a comment\n' +
    'on two lines -->',

    '<span class="comment html">&lt;!-- this is a comment\n' +
    'on two lines --&gt;</span>'
);


RainbowTester.run(
    'paragraph',

    '<p class="test">this is a paragraph</p>',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">p</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">test</span><span class="string quote">"</span><span class="support tag close">&gt;</span>this is a paragraph<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span>'
);


RainbowTester.run(
    'inline php',

    '<ul class="articles">\n' +
    '    <?php foreach ($articles as $article): ?>\n' +
    '        <li><?php echo $article->title; ?></li>\n' +
    '    <?php endforeach; ?>\n' +
    '</ul>',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">ul</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">articles</span><span class="string quote">"</span><span class="support tag close">&gt;</span>\n' +
    '    <span class="php">&lt;?php <span class="keyword">foreach</span> (<span class="variable dollar-sign">$</span><span class="variable">articles</span> <span class="keyword">as</span> <span class="variable dollar-sign">$</span><span class="variable">article</span>): ?&gt;</span>\n' +
    '        <span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">li</span></span><span class="support tag close">&gt;</span><span class="php">&lt;?php <span class="support">echo</span> <span class="variable dollar-sign">$</span><span class="variable">article</span><span class="keyword operator">-</span><span class="keyword operator">&gt;</span>title; ?&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">li</span></span><span class="support tag close">&gt;</span>\n' +
    '    <span class="php">&lt;?php <span class="keyword">endforeach</span>; ?&gt;</span>\n' +
    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">ul</span></span><span class="support tag close">&gt;</span>'
);


RainbowTester.run(
    'inline css 1',

    '<style type="text/css">\n' +
    '    body span.blah {\n' +
    '        background: #000;\n' +
    '        color: #fff;\n' +
    '    }\n' +
    '</style>',

    '<span class="css">&lt;<span class="meta style-tag">style</span> <span class="meta style-tag">type</span>=<span class="string">"text/css"</span>&gt;\n' +
    '    <span class="meta tag">body</span> <span class="meta tag">span</span><span class="meta class">.blah</span> {\n' +
    '        <span class="support css-property">background</span>: <span class="constant hex-color">#000</span>;\n' +
    '        <span class="support css-property">color</span>: <span class="constant hex-color">#fff</span>;\n' +
    '    }\n' +
    '&lt;/<span class="meta style-tag">style</span>&gt;</span>'
);


RainbowTester.run(
    'inline css 2',

    '<style>\n' +
    '    body span.blah {\n' +
    '        background: #000;\n' +
    '        color: #fff;\n' +
    '    }\n' +
    '</style>',

    '<span class="css">&lt;<span class="meta style-tag">style</span>&gt;\n' +
    '    <span class="meta tag">body</span> <span class="meta tag">span</span><span class="meta class">.blah</span> {\n' +
    '        <span class="support css-property">background</span>: <span class="constant hex-color">#000</span>;\n' +
    '        <span class="support css-property">color</span>: <span class="constant hex-color">#fff</span>;\n' +
    '    }\n' +
    '&lt;/<span class="meta style-tag">style</span>&gt;</span>'
);


RainbowTester.run(
    'inline js 1',

    '<script type="text/javascript">\n' +
    '    function prettyCool() {\n' +
    '        doSomeJQueryOrWhatever();\n' +
    '    }\n' +
    '</script>',

    '<span class="js">&lt;<span class="meta script-tag">script</span> <span class="meta script-tag">type</span>=<span class="string">"text/javascript"</span>&gt;\n' +
    '    <span class="keyword">function</span> <span class="meta function">prettyCool</span>() {\n' +
    '        <span class="function call">doSomeJQueryOrWhatever</span>();\n' +
    '    }\n' +
    '&lt;/<span class="meta script-tag">script</span>&gt;</span>'
);


RainbowTester.run(
    'inline js 2',

    '<script>\n' +
    '    function prettyCool() {\n' +
    '        doSomeJQueryOrWhatever();\n' +
    '    }\n' +
    '</script>',

    '<span class="js">&lt;<span class="meta script-tag">script</span>&gt;\n' +
    '    <span class="keyword">function</span> <span class="meta function">prettyCool</span>() {\n' +
    '        <span class="function call">doSomeJQueryOrWhatever</span>();\n' +
    '    }\n' +
    '&lt;/<span class="meta script-tag">script</span>&gt;</span>'
);


RainbowTester.run(
    'js include',

    '<script src="http://somewebsite.com/some-script.js" type="text/javascript"></script>',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">script</span></span> <span class="support attribute">src</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">http://somewebsite.com/some-script.js</span><span class="string quote">"</span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">text/javascript</span><span class="string quote">"</span><span class="support tag close">&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">script</span></span><span class="support tag close">&gt;</span>'
);

RainbowTester.run(
    'attribute no quotes',

    '<p class=test>test</p>',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">p</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="support value">test</span><span class="support tag close">&gt;</span>test<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span>'
);

RainbowTester.run(
    'attribute alone',

    '<input type="checkbox" name="whatever" checked>',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">checkbox</span><span class="string quote">"</span> <span class="support attribute">name</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">whatever</span><span class="string quote">"</span> <span class="support attribute">checked</span><span class="support tag close">&gt;</span>'
);

RainbowTester.run(
    'attribute middle',

    '<input checked type="checkbox">',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">checked</span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">checkbox</span><span class="string quote">"</span><span class="support tag close">&gt;</span>'
);

RainbowTester.run(
    'attribute alone self close',

    '<input type="checkbox" name="whatever" checked />',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">checkbox</span><span class="string quote">"</span> <span class="support attribute">name</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">whatever</span><span class="string quote">"</span> <span class="support attribute">checked</span> <span class="support tag close">/&gt;</span>'
);

RainbowTester.run(
    'string inside tags',

    '<pre><code data-language="python">def openFile(path):\n' +
    'file = open(path, "r")\n' +
    'content = file.read()\n' +
    'file.close()\n' +
    'return content</code></pre>',

    '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">pre</span></span><span class="support tag close">&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">code</span></span> <span class="support attribute">data-language</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">python</span><span class="string quote">"</span><span class="support tag close">&gt;</span>def openFile(path):\n' +
    'file = open(path, "r")\n' +
    'content = file.read()\n' +
    'file.close()\n' +
    'return content<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">code</span></span><span class="support tag close">&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">pre</span></span><span class="support tag close">&gt;</span>'
);


RainbowTester.endTest('html');
