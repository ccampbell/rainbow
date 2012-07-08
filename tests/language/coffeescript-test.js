/**
 * css tests
 *
 * @author Craig Campbell
 */
RainbowTester.startTest('coffeescript');

RainbowTester.run(
    'comment',

    '# this is a comment',

    '<span class="comment"># this is a comment</span>'
);

RainbowTester.run(
    'block comment',

    '###\n' +
    'CoffeeScript Compiler v1.3.3\n' +
    'Released under the MIT License\n' +
    '###',

    '<span class="comment block">###\n' +
    'CoffeeScript Compiler v1.3.3\n' +
    'Released under the MIT License\n' +
    '###</span>'
);

RainbowTester.run(
    'string',

    'test = "this is a string"',

    'test <span class="keyword operator">=</span> <span class="string">"this is a string"</span>'
);

RainbowTester.run(
    'block string',

    'html = """\n' +
    '       <strong>\n' +
    '        cup of coffeescript\n' +
    '       </strong>\n' +
    '       """',

    'html <span class="keyword operator">=</span> <span class="string block">"""\n' +
    '       &lt;strong&gt;\n' +
    '        cup of coffeescript\n' +
    '       &lt;/strong&gt;\n' +
    '       """</span>'
);

RainbowTester.run(
    'function call',

    'square = (x) -> x * x',

    '<span class="entity name function">square</span> <span class="keyword operator">=</span> (<span class="function argument coffee">x</span>) <span class="keyword function">-&gt;</span> x <span class="keyword operator">*</span> x'
);

RainbowTester.run(
    'function call inside object',

    'math =\n' +
    '   root:   Math.sqrt\n' +
    '   square: square\n' +
    '   cube:   (x) -> x * square x',

    'math <span class="keyword operator">=</span>\n' +
    '   root:   Math.sqrt\n' +
    '   square: square\n' +
    '   <span class="entity name function">cube</span><span class="keyword operator">:</span>   (<span class="function argument coffee">x</span>) <span class="keyword function">-&gt;</span> x <span class="keyword operator">*</span> square x'
);

RainbowTester.run(
    'function call multiple arguments',

    'race = (winner, runners...) ->\n' +
    '   print winner, runners',

    '<span class="entity name function">race</span> <span class="keyword operator">=</span> (<span class="function argument coffee">winner</span>, <span class="function argument coffee">runners</span>...) <span class="keyword function">-&gt;</span>\n' +
    '   <span class="reset">print</span> winner, runners'
);

RainbowTester.run(
    'switch statement',

    'switch day\n' +
    '   when "Mon" then go work\n' +
    '   when "Tue" then go relax\n' +
    '   when "Thu" then go iceFishing\n' +
    '   when "Fri", "Sat"\n' +
    '       if day is bingoDay\n' +
    '           go bingo\n' +
    '           go dancing\n' +
    '   when "Sun" then go church\n' +
    'else go work',

    '<span class="keyword">switch</span> day\n' +
    '   <span class="keyword">when</span> <span class="string">"Mon"</span> <span class="keyword">then</span> go work\n' +
    '   <span class="keyword">when</span> <span class="string">"Tue"</span> <span class="keyword">then</span> go relax\n' +
    '   <span class="keyword">when</span> <span class="string">"Thu"</span> <span class="keyword">then</span> go iceFishing\n' +
    '   <span class="keyword">when</span> <span class="string">"Fri"</span>, <span class="string">"Sat"</span>\n' +
    '       <span class="keyword">if</span> day <span class="keyword">is</span> bingoDay\n' +
    '           go bingo\n' +
    '           go dancing\n' +
    '   <span class="keyword">when</span> <span class="string">"Sun"</span> <span class="keyword">then</span> go church\n' +
    '<span class="keyword">else</span> go work'
);

RainbowTester.run(
    'multiline regex',

    'OPERATOR = /// ^ (\n' +
    '   ?: [-=]>             # function\n' +
    '   | [-+*/%<>&|^!?=]=  # compound assign / compare\n' +
    '   | >>>=?             # zero-fill right shift\n' +
    '   | ([-+:])\\1         # doubles\n' +
    '   | ([&|<>])\\2=?      # logic / shift\n' +
    '   | \\?\\.              # soak access\n' +
    '   | \\.{2,3}           # range or splat\n' +
    ') ///',

    'OPERATOR <span class="keyword operator">=</span> <span class="string regex">/// ^ (\n' +
    '   ?: [-=]&gt;             <span class="comment"># function\n' +
    '</span>   | [-+*/%&lt;&gt;&amp;|^!?=]=  <span class="comment"># compound assign / compare\n' +
    '</span>   | &gt;&gt;&gt;=?             <span class="comment"># zero-fill right shift\n' +
    '</span>   | ([-+:])\\1         <span class="comment"># doubles\n' +
    '</span>   | ([&amp;|&lt;&gt;])\\2=?      <span class="comment"># logic / shift\n' +
    '</span>   | \\?\\.              <span class="comment"># soak access\n' +
    '</span>   | \\.{2,3}           <span class="comment"># range or splat\n' +
    '</span>) ///</span>'
);

RainbowTester.run(
    'function inside function call',

    "task 'build:parser', 'rebuild the Jison parser', (options) ->\n" +
    "   require 'jison'\n" +
    "   code = require('./lib/grammar').parser.generate()\n" +
    "   dir  = options.output or 'lib'\n" +
    "   fs.writeFile \"#{dir}/parser.js\", code",

    'task <span class="string">\'build:parser\'</span>, <span class="string">\'rebuild the Jison parser\'</span>, (<span class="function argument coffee">options</span>) <span class="keyword function">-&gt;</span>\n' +
    '   require <span class="string">\'jison\'</span>\n' +
    '   code <span class="keyword operator">=</span> <span class="function call">require</span>(<span class="string">\'./lib/grammar\'</span>).parser.<span class="function call">generate</span>()\n' +
    '   dir  <span class="keyword operator">=</span> options.output <span class="keyword">or</span> <span class="string">\'lib\'</span>\n' +
    '   fs.writeFile <span class="string">"#{dir}/parser.js"</span>, code'
);

RainbowTester.run(
    'multiline function',

    'weatherReport = (location) ->\n' +
    '   # Make an Ajax request to fetch the weather...\n' +
    '   [location, 72, "Mostly Sunny"]\n' +
    '\n' +
    '   [city, temp, forecast] = weatherReport "Berkeley, CA"',

    '<span class="entity name function">weatherReport</span> <span class="keyword operator">=</span> (<span class="function argument coffee">location</span>) <span class="keyword function">-&gt;</span>\n' +
    '   <span class="comment"># Make an Ajax request to fetch the weather...</span>\n' +
    '   [location, <span class="constant numeric">72</span>, <span class="string">"Mostly Sunny"</span>]\n' +
    '\n' +
    '   [city, temp, forecast] <span class="keyword operator">=</span> weatherReport <span class="string">"Berkeley, CA"</span>'
);

RainbowTester.run(
    'function binding',

    'Account = (customer, cart) ->\n' +
    '   @customer = customer\n' +
    '   @cart = cart\n' +
    '\n' +
    '   $(\'.shopping_cart\').bind \'click\', (event) =>\n' +
    '       @customer.purchase @cart',

    '<span class="entity name function">Account</span> <span class="keyword operator">=</span> (<span class="function argument coffee">customer</span>, <span class="function argument coffee">cart</span>) <span class="keyword function">-&gt;</span>\n' +
    '   <span class="keyword variable coffee">@customer</span> <span class="keyword operator">=</span> customer\n' +
    '   <span class="keyword variable coffee">@cart</span> <span class="keyword operator">=</span> cart\n' +
    '\n' +
    '   $(<span class="string">\'.shopping_cart\'</span>).bind <span class="string">\'click\'</span>, (<span class="function argument coffee">event</span>) <span class="keyword function">=&gt;</span>\n' +
    '       <span class="keyword variable coffee">@customer</span>.purchase <span class="keyword variable coffee">@cart</span>'
);

RainbowTester.run(
    'direct function call',

    'move: ->\n' +
    '   alert "Galloping..."\n' +
    '   super 45',

    '<span class="entity name function">move</span><span class="keyword operator">:</span> <span class="keyword function">-&gt;</span>\n' +
    '   alert <span class="string">"Galloping..."</span>\n' +
    '   <span class="keyword">super</span> <span class="constant numeric">45</span>'
);

RainbowTester.run(
    '@ keyword',

    'alert @name + " moved #{meters}m."',

    'alert <span class="keyword variable coffee">@name</span> <span class="keyword operator">+</span> <span class="string">" moved #{meters}m."</span>'
);

RainbowTester.run(
    'class definition',

    'class Animal',

    '<span class="storage class">class</span> <span class="entity name class">Animal</span>'
);

RainbowTester.run(
    'child class definition',

    'class Snake extends Animal',

    '<span class="storage class">class</span> <span class="entity name class">Snake</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">Animal</span>'
);

RainbowTester.run(
    'class instantiation',

    'sam = new Snake "Sammy the Python"',

    'sam <span class="keyword operator">=</span> <span class="keyword new">new</span> <span class="support class">Snake</span> <span class="string">"Sammy the Python"</span>'
);

RainbowTester.endTest('css');
