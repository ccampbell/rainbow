import '../../src/language/generic';
import '../../src/language/coffeescript';
import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'coffeescript';

describe(language, () => {
    run(
        language,

        'comment',

        '# this is a comment',

        '<span class="comment"># this is a comment</span>'
    );

    run(
        language,

        'block comment',

        `###
        CoffeeScript Compiler v1.3.3
        Released under the MIT License
        ###`,

        `<span class="comment block">###
        CoffeeScript Compiler v1.3.3
        Released under the MIT License
        ###</span>`
    );

    run(
        language,

        'string',

        'test = "this is a string"',

        'test <span class="keyword operator">=</span> <span class="string">"this is a string"</span>'
    );

    run(
        language,

        'block string',

        `html = """
               <strong>
                cup of coffeescript
               </strong>
               """`,

        `html <span class="keyword operator">=</span> <span class="string block">"""
               &lt;strong&gt;
                cup of coffeescript
               &lt;/strong&gt;
               """</span>`
    );

    run(
        language,

        'function call',

        'square = (x) -> x * x',

        '<span class="entity name function">square</span> <span class="keyword operator">=</span> (<span class="function argument coffee">x</span>) <span class="keyword function">-&gt;</span> x <span class="keyword operator">*</span> x'
    );

    run(
        language,

        'function call inside object',

        `math =
           root:   Math.sqrt
           square: square
           cube:   (x) -> x * square x`,

        `math <span class="keyword operator">=</span>
           root:   Math.sqrt
           square: square
           <span class="entity name function">cube</span><span class="keyword operator">:</span>   (<span class="function argument coffee">x</span>) <span class="keyword function">-&gt;</span> x <span class="keyword operator">*</span> square x`
    );

    run(
        language,

        'function call multiple arguments',

        `race = (winner, runners...) ->
           print winner, runners`,

        `<span class="entity name function">race</span> <span class="keyword operator">=</span> (<span class="function argument coffee">winner</span>, <span class="function argument coffee">runners</span>...) <span class="keyword function">-&gt;</span>
           <span class="reset">print</span> winner, runners`
    );

    run(
        language,

        'switch statement',

        `switch day
           when "Mon" then go work
           when "Tue" then go relax
           when "Thu" then go iceFishing
           when "Fri", "Sat"
               if day is bingoDay
                   go bingo
                   go dancing
           when "Sun" then go church
        else go work`,

        `<span class="keyword">switch</span> day
           <span class="keyword">when</span> <span class="string">"Mon"</span> <span class="keyword">then</span> go work
           <span class="keyword">when</span> <span class="string">"Tue"</span> <span class="keyword">then</span> go relax
           <span class="keyword">when</span> <span class="string">"Thu"</span> <span class="keyword">then</span> go iceFishing
           <span class="keyword">when</span> <span class="string">"Fri"</span>, <span class="string">"Sat"</span>
               <span class="keyword">if</span> day <span class="keyword">is</span> bingoDay
                   go bingo
                   go dancing
           <span class="keyword">when</span> <span class="string">"Sun"</span> <span class="keyword">then</span> go church
        <span class="keyword">else</span> go work`
    );

    run(
        language,

        'multiline regex',

        `OPERATOR = /// ^ (
           ?: [-=]>            # function
           | [-+*/%<>&|^!?=]=  # compound assign / compare
           | >>>=?             # zero-fill right shift
           | ([-+:])\\1        # doubles
           | ([&|<>])\\2=?     # logic / shift
           | \\?\\.            # soak access
           | \\.{2,3}          # range or splat
        ) ///`,

        `OPERATOR <span class="keyword operator">=</span> <span class="string regex">/// ^ (
           ?: [-=]&gt;            <span class="comment"># function</span>
           | [-+*/%&lt;&gt;&amp;|^!?=]=  <span class="comment"># compound assign / compare</span>
           | &gt;&gt;&gt;=?             <span class="comment"># zero-fill right shift</span>
           | ([-+:])\\1        <span class="comment"># doubles</span>
           | ([&amp;|&lt;&gt;])\\2=?     <span class="comment"># logic / shift</span>
           | \\?\\.            <span class="comment"># soak access</span>
           | \\.{2,3}          <span class="comment"># range or splat</span>
        ) ///</span>`
    );

    run(
        language,

        'function inside function call',

        `task 'build:parser', 'rebuild the Jison parser', (options) ->
           require 'jison'
           code = require('./lib/grammar').parser.generate()
           dir  = options.output or 'lib'
           fs.writeFile "#{dir}/parser.js", code`,

        `task <span class="string">'build:parser'</span>, <span class="string">'rebuild the Jison parser'</span>, (<span class="function argument coffee">options</span>) <span class="keyword function">-&gt;</span>
           require <span class="string">'jison'</span>
           code <span class="keyword operator">=</span> <span class="function call">require</span>(<span class="string">'./lib/grammar'</span>).parser.<span class="function call">generate</span>()
           dir  <span class="keyword operator">=</span> options.output <span class="keyword">or</span> <span class="string">'lib'</span>
           fs.writeFile <span class="string">"#{dir}/parser.js"</span>, code`
    );

    run(
        language,

        'multiline function',

        `weatherReport = (location) ->
           # Make an Ajax request to fetch the weather...
           [location, 72, "Mostly Sunny"]

           [city, temp, forecast] = weatherReport "Berkeley, CA"`,

        `<span class="entity name function">weatherReport</span> <span class="keyword operator">=</span> (<span class="function argument coffee">location</span>) <span class="keyword function">-&gt;</span>
           <span class="comment"># Make an Ajax request to fetch the weather...</span>
           [location, <span class="constant numeric">72</span>, <span class="string">"Mostly Sunny"</span>]

           [city, temp, forecast] <span class="keyword operator">=</span> weatherReport <span class="string">"Berkeley, CA"</span>`
    );

    run(
        language,

        'function binding',

        `Account = (customer, cart) ->
           @customer = customer
           @cart = cart

           $('.shopping_cart').bind 'click', (event) =>
               @customer.purchase @cart`,

        `<span class="entity name function">Account</span> <span class="keyword operator">=</span> (<span class="function argument coffee">customer</span>, <span class="function argument coffee">cart</span>) <span class="keyword function">-&gt;</span>
           <span class="keyword variable coffee">@customer</span> <span class="keyword operator">=</span> customer
           <span class="keyword variable coffee">@cart</span> <span class="keyword operator">=</span> cart

           $(<span class="string">'.shopping_cart'</span>).bind <span class="string">'click'</span>, (<span class="function argument coffee">event</span>) <span class="keyword function">=&gt;</span>
               <span class="keyword variable coffee">@customer</span>.purchase <span class="keyword variable coffee">@cart</span>`
    );

    run(
        language,

        'direct function call',

        `move: ->
           alert "Galloping..."
           super 45`,

        `<span class="entity name function">move</span><span class="keyword operator">:</span> <span class="keyword function">-&gt;</span>
           alert <span class="string">"Galloping..."</span>
           <span class="keyword">super</span> <span class="constant numeric">45</span>`
    );

    run(
        language,

        '@ keyword',

        'alert @name + " moved #{meters}m."',

        'alert <span class="keyword variable coffee">@name</span> <span class="keyword operator">+</span> <span class="string">" moved #{meters}m."</span>'
    );

    run(
        language,

        'class definition',

        'class Animal',

        '<span class="storage class">class</span> <span class="entity name class">Animal</span>'
    );

    run(
        language,

        'child class definition',

        'class Snake extends Animal',

        '<span class="storage class">class</span> <span class="entity name class">Snake</span><span class="storage modifier extends"> extends </span><span class="entity other inherited-class">Animal</span>'
    );

    run(
        language,

        'class instantiation',

        'sam = new Snake "Sammy the Python"',

        'sam <span class="keyword operator">=</span> <span class="keyword new">new</span> <span class="support class">Snake</span> <span class="string">"Sammy the Python"</span>'
    );
});
