/**
 * Java tests
 *
 * @author Leo Accend
 */
RainbowTester.startTest("java");

RainbowTester.run(
	"package declaration",
	'package com.example.rainbow;',
	'<span class="keyword">package</span> <span class="support namespace">com.example.rainbow;</span>'
);

RainbowTester.run(
	"import statement",
	'import com.example.rainbow.util.RainbowUtil;',
	'<span class="keyword">import</span> <span class="support namespace">com.example.rainbow.util.RainbowUtil;</span>'
);

RainbowTester.run(
	"multi-line comment",
	'/**\n  * This is a Javadoc style comment. It is pretty awesome.\n  */',
	'<span class="comment">/**\n  * This is a Javadoc style comment. It is pretty awesome.\n  */</span>'
);

RainbowTester.run(
	"single-line comment",
	'// This is a good comment.',
	'<span class="comment">// This is a good comment.</span>'
);

RainbowTester.run(
	"complicated class declaration",
	'public class Rainbow<T, List<? extends T>> extends Spectrum implements HasColors, IsPretty {',
	'<span class="keyword">public</span> <span class="keyword">class</span> <span class="entity class">Rainbow</span><span class="operator">&lt;</span><span class="constant">T</span>, <span class="entity class">List</span><span class="operator">&lt;</span><span class="operator">?</span> <span class="keyword">extends</span> <span class="constant">T</span><span class="operator">&gt;&gt;</span> <span class="keyword">extends</span> <span class="entity class">Spectrum</span> <span class="keyword">implements</span> <span class="entity class">HasColors</span>, <span class="entity class">IsPretty</span> {'
);

RainbowTester.run(
	"simple class declaration",
	'public class Rainbow {',
	'<span class="keyword">public</span> <span class="keyword">class</span> <span class="entity class">Rainbow</span> {'
);

RainbowTester.run(
	"constant declaration",
	'private static final int RESOLUTION = 7;',
	'<span class="keyword">private</span> <span class="keyword">static</span> <span class="keyword">final</span> <span class="keyword">int</span> <span class="constant">RESOLUTION</span> <span class="operator">=</span> <span class="integer">7</span>;'
);

RainbowTester.run(
	"field declaration",
	'private final String name;',
	'<span class="keyword">private</span> <span class="keyword">final</span> <span class="entity class">String</span> name;'
);

RainbowTester.run(
	"method declaration",
	'public void shine() {',
	'<span class="keyword">public</span> <span class="keyword">void</span> <span class="entity function">shine</span>() {'
);

RainbowTester.run(
	"simple annotation",
	'@Override',
	'<span class="support annotation">@Override</span>'
);

RainbowTester.run(
	"complex annotation",
	'@RequestMapping( value = "/rainbow", method = Method.POST )',
	'<span class="support annotation">@RequestMapping</span>( value <span class="operator">=</span> <span class="string">"/rainbow"</span>, method <span class="operator">=</span> <span class="entity class">Method</span>.<span class="constant">POST</span> )'
);

RainbowTester.run(
	"string concatenation",
	'"I found " + numberOfTurtles + " turtles."',
	'<span class="string">"I found "</span> <span class="operator">+</span> numberOfTurtles <span class="operator">+</span> <span class="string">" turtles."</span>'
);

RainbowTester.run(
	"local method invocation",
	'wait(1000L)',
	'<span class="entity function">wait</span>(<span class="integer">1000L</span>)'
);

RainbowTester.run(
	"static method invocation",
	'System.out.println("Hello, world!");',
	'<span class="entity class">System</span>.out.<span class="entity function">println</span>(<span class="string">"Hello, world!"</span>);'
);

RainbowTester.run(
	"variable assignment",
	'int numberOfColors = (int) Math.ceil( Math.random() * 256 );',
	'<span class="keyword">int</span> numberOfColors <span class="operator">=</span> (<span class="keyword">int</span>) <span class="entity class">Math</span>.<span class="entity function">ceil</span>( <span class="entity class">Math</span>.<span class="entity function">random</span>() <span class="operator">*</span> <span class="integer">256</span> );'
);

RainbowTester.endTest("java");