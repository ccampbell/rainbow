const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'html';

export function testHTML(t) {
    run(
        t,

        language,

        'comment',

        '<!-- this is a comment -->',

        '<span class="comment html">&lt;!-- this is a comment --&gt;</span>'
    );


    run(
        t,

        language,

        'multi-line comment',

        `<!-- this is a comment
        on two lines -->`,

        `<span class="comment html">&lt;!-- this is a comment
        on two lines --&gt;</span>`
    );


    run(
        t,

        language,

        'paragraph',

        '<p class="test">this is a paragraph</p>',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">p</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">test</span><span class="string quote">"</span><span class="support tag close">&gt;</span>this is a paragraph<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span>'
    );


    run(
        t,

        language,

        'inline php',

        `<ul class="articles">
            <?php foreach ($articles as $article): ?>
                <li><?php echo $article->title; ?></li>
            <?php endforeach; ?>
        </ul>`,

        `<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">ul</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">articles</span><span class="string quote">"</span><span class="support tag close">&gt;</span>
            <span class="source php embedded"><span class="variable language php-tag">&lt;?php</span> <span class="keyword">foreach</span> (<span class="variable dollar-sign">$</span><span class="variable">articles</span> <span class="keyword">as</span> <span class="variable dollar-sign">$</span><span class="variable">article</span>): <span class="variable language php-tag">?&gt;</span></span>
                <span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">li</span></span><span class="support tag close">&gt;</span><span class="source php embedded"><span class="variable language php-tag">&lt;?php</span> <span class="support">echo</span> <span class="variable dollar-sign">$</span><span class="variable">article</span><span class="keyword operator">-</span><span class="keyword operator">&gt;</span>title; <span class="variable language php-tag">?&gt;</span></span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">li</span></span><span class="support tag close">&gt;</span>
            <span class="source php embedded"><span class="variable language php-tag">&lt;?php</span> <span class="keyword">endforeach</span>; <span class="variable language php-tag">?&gt;</span></span>
        <span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">ul</span></span><span class="support tag close">&gt;</span>`
    );

    run(
        t,

        language,

        'php short tag',

        `&lt;? foreach ($users as $key => $user): ?&gt;
           <p>&lt;?= $user->getBio() ?&gt;</p>
        &lt;? endforeach ?&gt;`,

        `<span class="source php embedded"><span class="variable language php-tag">&lt;?</span> <span class="keyword">foreach</span> (<span class="variable dollar-sign">$</span><span class="variable">users</span> <span class="keyword">as</span> <span class="variable dollar-sign">$</span><span class="variable">key</span> <span class="keyword operator">=</span><span class="keyword operator">&gt;</span> <span class="variable dollar-sign">$</span><span class="variable">user</span>): <span class="variable language php-tag">?&gt;</span></span>
           <span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span><span class="source php embedded"><span class="variable language php-tag">&lt;?=</span> <span class="variable dollar-sign">$</span><span class="variable">user</span><span class="keyword operator">-</span><span class="keyword operator">&gt;</span><span class="function call">getBio</span>() <span class="variable language php-tag">?&gt;</span></span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span>
        <span class="source php embedded"><span class="variable language php-tag">&lt;?</span> <span class="keyword">endforeach</span> <span class="variable language php-tag">?&gt;</span></span>`
    );

    run(
        t,

        language,

        'xml declaration',

        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',

        '<span class="support tag"><span class="support tag">&lt;?</span><span class="support tag-name">xml</span></span> <span class="support attribute">version</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">1.0</span><span class="string quote">"</span> <span class="support attribute">encoding</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">UTF-8</span><span class="string quote">"</span> <span class="support attribute">standalone</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">no</span><span class="string quote">"</span> <span class="support tag close">?&gt;</span>'
    );


    run(
        t,

        language,

        'inline css 1',

        `<style type="text/css">
            body span.blah {
                background: #000;
                color: #fff;
            }
        </style>`,

        `<span class="source css embedded"><span class="support tag style">&lt;</span><span class="entity tag style">style</span> <span class="entity tag style attribute">type</span>=<span class="string">"text/css"</span><span class="support tag style">&gt;</span>
            <span class="entity name tag">body</span> <span class="entity name tag">span</span><span class="entity name class">.blah</span> {
                <span class="support css-property">background</span>: <span class="constant hex-color">#000</span>;
                <span class="support css-property">color</span>: <span class="constant hex-color">#fff</span>;
            }
        <span class="support tag style">&lt;/</span><span class="entity tag style">style</span><span class="support tag style">&gt;</span></span>`
    );


    run(
        t,

        language,

        'inline css 2',

        `<style>
            body span.blah {
                background: #000;
                color: #fff;
            }
        </style>`,

        `<span class="source css embedded"><span class="support tag style">&lt;</span><span class="entity tag style">style</span><span class="support tag style">&gt;</span>
            <span class="entity name tag">body</span> <span class="entity name tag">span</span><span class="entity name class">.blah</span> {
                <span class="support css-property">background</span>: <span class="constant hex-color">#000</span>;
                <span class="support css-property">color</span>: <span class="constant hex-color">#fff</span>;
            }
        <span class="support tag style">&lt;/</span><span class="entity tag style">style</span><span class="support tag style">&gt;</span></span>`
    );


    run(
        t,

        language,

        'inline js 1',

        `<script type="text/javascript">
            function prettyCool() {
                doSomeJQueryOrWhatever();
            }
        </script>`,

        `<span class="source js embedded"><span class="support tag script">&lt;</span><span class="entity tag script">script</span> <span class="entity tag script attribute">type</span>=<span class="string">"text/javascript"</span><span class="support tag script">&gt;</span>
            <span class="storage function">function</span> <span class="entity name function">prettyCool</span>() {
                <span class="function call">doSomeJQueryOrWhatever</span>();
            }
        <span class="support tag script">&lt;/</span><span class="entity tag script">script</span><span class="support tag script">&gt;</span></span>`
    );


    run(
        t,

        language,

        'inline js 2',

        `<script>
            function prettyCool() {
                doSomeJQueryOrWhatever();
            }
        </script>`,

        `<span class="source js embedded"><span class="support tag script">&lt;</span><span class="entity tag script">script</span><span class="support tag script">&gt;</span>
            <span class="storage function">function</span> <span class="entity name function">prettyCool</span>() {
                <span class="function call">doSomeJQueryOrWhatever</span>();
            }
        <span class="support tag script">&lt;/</span><span class="entity tag script">script</span><span class="support tag script">&gt;</span></span>`
    );


    run(
        t,

        language,

        'js include',

        '<script src="http://somewebsite.com/some-script.js" type="text/javascript"></script>',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">script</span></span> <span class="support attribute">src</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">http://somewebsite.com/some-script.js</span><span class="string quote">"</span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">text/javascript</span><span class="string quote">"</span><span class="support tag close">&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">script</span></span><span class="support tag close">&gt;</span>'
    );

    run(
        t,

        language,

        'attribute no quotes',

        '<p class=test>test</p>',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">p</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="support value">test</span><span class="support tag close">&gt;</span>test<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span>'
    );

    run(
        t,

        language,

        'attribute alone',

        '<input type="checkbox" name="whatever" checked>',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">checkbox</span><span class="string quote">"</span> <span class="support attribute">name</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">whatever</span><span class="string quote">"</span> <span class="support attribute">checked</span><span class="support tag close">&gt;</span>'
    );

    run(
        t,

        language,

        'attribute middle',

        '<input checked type="checkbox">',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">checked</span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">checkbox</span><span class="string quote">"</span><span class="support tag close">&gt;</span>'
    );

    run(
        t,

        language,

        'attribute alone self close',

        '<input type="checkbox" name="whatever" checked />',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">checkbox</span><span class="string quote">"</span> <span class="support attribute">name</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">whatever</span><span class="string quote">"</span> <span class="support attribute">checked</span> <span class="support tag close">/&gt;</span>'
    );

    run(
        t,

        language,

        'attribute camel case',

        '<button onClick="test()">Click me</button>',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">button</span></span> <span class="support attribute">onClick</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">test()</span><span class="string quote">"</span><span class="support tag close">&gt;</span>Click me<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">button</span></span><span class="support tag close">&gt;</span>'
    );

    run(
        t,

        language,

        'string inside tags',

        `<pre><code data-language="python">def openFile(path):
        file = open(path, "r")
        content = file.read()
        file.close()
        return content</code></pre>`,

        `<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">pre</span></span><span class="support tag close">&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">code</span></span> <span class="support attribute">data-language</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">python</span><span class="string quote">"</span><span class="support tag close">&gt;</span>def openFile(path):
        file = open(path, "r")
        content = file.read()
        file.close()
        return content<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">code</span></span><span class="support tag close">&gt;</span><span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">pre</span></span><span class="support tag close">&gt;</span>`
    );

    run(
        t,

        language,

        'boolean attributes containing dashes',

        '<input type="text" read-only>',

        '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">input</span></span> <span class="support attribute">type</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">text</span><span class="string quote">"</span> <span class="support attribute">read-only</span><span class="support tag close">&gt;</span>'
    );
}
