/* global describe, run */
var language = 'groovy';

describe(language, function () {
    run(
        language,
        "package declaration",
        'package com.example.rainbow',
        '<span class="keyword">package</span> <span class="support namespace">com.example.rainbow</span>'
    );

    run(
        language,
        "import statement",
        'import com.example.rainbow.util.RainbowUtil',
        '<span class="keyword">import</span> <span class="support namespace">com.example.rainbow.util.RainbowUtil</span>'
    );

    run(
        language,
        "multi-line comment",
        '/**\n  * This is a Javadoc style comment. It is pretty awesome.\n  */',
        '<span class="comment">/**\n  * This is a Javadoc style comment. It is pretty awesome.\n  */</span>'
    );

    run(
        language,
        "single-line comment",
        '// This is a good comment.',
        '<span class="comment">// This is a good comment.</span>'
    );

    run(
        language,
        "complicated class declaration",
        'public class Rainbow<T, List<? extends T>> extends Spectrum implements HasColors, IsPretty {',
        '<span class="keyword">public</span> <span class="keyword">class</span> <span class="entity class">Rainbow</span><span class="operator">&lt;</span><span class="constant">T</span>, <span class="entity class">List</span><span class="operator">&lt;</span><span class="operator">?</span> <span class="keyword">extends</span> <span class="constant">T</span><span class="operator">&gt;&gt;</span> <span class="keyword">extends</span> <span class="entity class">Spectrum</span> <span class="keyword">implements</span> <span class="entity class">HasColors</span>, <span class="entity class">IsPretty</span> {'
    );

    run(
        language,
        "simple class declaration",
        'public class Rainbow {',
        '<span class="keyword">public</span> <span class="keyword">class</span> <span class="entity class">Rainbow</span> {'
    );

    run(
        language,
        "constant declaration",
        'private static final int RESOLUTION = 7;',
        '<span class="keyword">private</span> <span class="keyword">static</span> <span class="keyword">final</span> <span class="keyword">int</span> <span class="constant">RESOLUTION</span> <span class="operator">=</span> <span class="integer">7</span>;'
    );

    run(
        language,
        "constant declaration 2",
        'static final RESOLUTION = 7',
        '<span class="keyword">static</span> <span class="keyword">final</span> <span class="constant">RESOLUTION</span> <span class="operator">=</span> <span class="integer">7</span>'
    );

    run(
        language,
        "field declaration",
        'private final String name;',
        '<span class="keyword">private</span> <span class="keyword">final</span> <span class="entity class">String</span> name;'
    );

    run(
        language,
        "method declaration",
        'public void shine() {',
        '<span class="keyword">public</span> <span class="keyword">void</span> <span class="entity function">shine</span>() {'
    );

    run(
        language,
        "method declaration 2",
        'def shine() {',
        '<span class="keyword">def</span> <span class="entity function">shine</span>() {'
    );

    run(
        language,
        "simple annotation",
        '@Override',
        '<span class="support annotation">@Override</span>'
    );

    run(
        language,
        "complex annotation",
        '@RequestMapping( value = "/rainbow", method = Method.POST )',
        '<span class="support annotation">@RequestMapping</span>( value <span class="operator">=</span> <span class="string">"/rainbow"</span>, method <span class="operator">=</span> <span class="entity class">Method</span>.<span class="constant">POST</span> )'
    );

    run(
        language,
        "string concatenation",
        '"I found " + numberOfTurtles + " turtles."',
        '<span class="string">"I found "</span> <span class="operator">+</span> numberOfTurtles <span class="operator">+</span> <span class="string">" turtles."</span>'
    );

    run(
        language,
        "single quote string",
        "println 'Hello'",
        'println <span class="string">\'Hello\'</span>'
    );

    run(
        language,
        "double quote string",
        'println "Hello"',
        'println <span class="string">"Hello"</span>'
    );

    run(
        language,
        "slashy string",
        'println /Hello/',
        'println <span class="string">/Hello/</span>'
    );

    run(
        language,
        'multiline string',
        '"""groovy\nis\ngreat"""',

        '<span class="comment docstring">"""groovy\nis\ngreat"""</span>'
    );

    run(
        language,
        "local method invocation",
        'wait(1000L)',
        '<span class="entity function">wait</span>(<span class="integer">1000L</span>)'
    );

    run(
        language,
        "static method invocation",
        'System.out.println("Hello, world!");',
        '<span class="entity class">System</span>.out.<span class="entity function">println</span>(<span class="string">"Hello, world!"</span>);'
    );

    run(
        language,
        "variable assignment",
        'int numberOfColors = (int) Math.ceil( Math.random() * 256 );',
        '<span class="keyword">int</span> numberOfColors <span class="operator">=</span> (<span class="keyword">int</span>) <span class="entity class">Math</span>.<span class="entity function">ceil</span>( <span class="entity class">Math</span>.<span class="entity function">random</span>() <span class="operator">*</span> <span class="integer">256</span> );'
    );

    run(
        language,
        "elvis operator",
        "def displayName = user.name ?: 'Anonymous'",
        '<span class="keyword">def</span> displayName <span class="operator">=</span> user.name <span class="operator">?:</span> <span class="string">\'Anonymous\'</span>'
    );

    run(
        language,
        "spread operator",
        "parent*.action",
        'parent<span class="operator">*.</span>action'
    );

    run(
        language,
        "field operator",
        "println x.@field",
        'println x<span class="operator">.@</span>field'
    );

    run(
        language,
        "spread field operator",
        "println parent*.@field",
        'println parent<span class="operator">*.@</span>field'
    );

    run(
        language,
        "method reference operator",
        "def factorial = this.&amp;factorial",
        '<span class="keyword">def</span> factorial <span class="operator">=</span> <span class="keyword">this</span><span class="operator">.&amp;</span>factorial'
    );

    run(
        language,
        "spaceship operator",
        "a &lt;=&gt; b",
        'a <span class="operator">&lt;=&gt;</span> b'
    );

    run(
        language,
        "regex operators",
        "a =~ b; a ==~ b;",
        'a <span class="operator">=~</span> b; a <span class="operator">==~</span> b;'
    );

    run(
        language,
        "lbl",
        "given: 'A preconditon'",
        '<span class="support languagelabel">given:</span> <span class="string">\'A preconditon\'</span>'
    );

});
