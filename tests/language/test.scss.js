/* global describe, run */
var language = 'scss';

describe(language, function() {

    /********************
     * FORMER CSS VALIDATION (moved in from test.css.js)
     ********************/

    run(
        language,

        'scss',

        'article {\n' +
        '   &.cool {\n' +
        '       p {\n' +
        '           margin-top: 20px;\n' +
        '       }\n' +
        '   }\n' +
        '}',

        '<span class="selector"><span class="entity name tag">article</span> </span>{\n' +
        '<span class="selector">   <span class="entity scss parent">&amp;</span><span class="entity name class">.cool</span> </span>{\n' +
        '<span class="selector">       <span class="entity name tag">p</span> </span>{\n' +
        '           <span class="css-property">margin-top</span>: <span class="constant numeric">20<span class="keyword unit absolute">px</span></span>;\n' +
        '       }\n' +
        '   }\n' +
        '}'
    );

    /********************
     * CSS ENHANCED
     ********************/

    // attribute selector
    run(
        language,
        
        'attribute selector',
        
        'input[type="text"] { cursor: pointer; }\n'+
        'input[type=text] { cursor: pointer; }',
        
        '<span class="selector"><span class="entity name tag">input</span><span class="entity name attribute">[<span class="support attribute-name">type</span>=<span class="string">"text"</span>]</span> </span>{ <span class="css-property">cursor</span>: <span class="support text-value">pointer</span>; }\n'+
        '<span class="selector"><span class="entity name tag">input</span><span class="entity name attribute">[<span class="support attribute-name">type</span>=<span class="support text-value">text</span>]</span> </span>{ <span class="css-property">cursor</span>: <span class="support text-value">pointer</span>; }'
    );
    
    // siblings
    run(
        language,
        
        'child/sibling selectors',
        
        'div > p,\n'+
        'p + p,\n'+
        'p ~ span {',
        
        '<span class="selector">'+
        '<span class="entity name tag">div</span><span class="direct-child"> &gt; </span><span class="entity name tag">p</span>,\n'+
        '<span class="entity name tag">p</span><span class="adjacent-sibling"> + </span><span class="entity name tag">p</span>,\n'+
        '<span class="entity name tag">p</span><span class="general-sibling"> ~ </span><span class="entity name tag">span</span> '+
        '</span>{'
    );
    
    // exception (!important keyword)
    run(
        language,
        
        'keyword exception',
        
        'border: none !important;',
        
        '<span class="css-property">border</span>: <span class="support text-value">none</span> <span class="keyword exception">!important</span>;'
    );
    
    // css method
    run(
        language,
        
        'css-method',
        
        'rgba(100, 200, 175, .6);',
        
        '<span class="css-method">'+
        '<span class="method-name">rgba</span>'+
        '<span class="method-params">('+
        '<span class="constant numeric">100</span>, '+
        '<span class="constant numeric">200</span>, '+
        '<span class="constant numeric">175</span>, '+
        '<span class="constant numeric">.6</span>)'+
        '</span></span>;'
    );
    
    // asset path
    run(
        language,
        
        'asset path',
        
        'url(/path/to/image.jpg);',
        
        '<span class="css-method">'+
        '<span class="method-name">url</span>'+
        '<span class="method-params">('+
        '<span class="constant path">/path/to/image.jpg</span>)'+
        '</span></span>;'
    );
    
    // media queries
    run(
        language,
        
        'media query',
        
        '@media not print and (max-width: 1160px), screen and (orientation: landscape) {',
        
        '<span class="media-query">'+
        '<span class="at-directive">@media</span> '+
        '<span class="mediaquery query">'+
        '<span class="mediaquery reserved">not</span> '+
        '<span class="mediaquery type">print</span> '+
        '<span class="mediaquery reserved">and</span> '+
        '<span class="mediaquery expression">('+
        '<span class="mediaquery feature">max-width</span>: '+
        '<span class="constant numeric">1160<span class="keyword unit absolute">px</span></span>)'+
        '</span></span>, '+
        '<span class="mediaquery query">'+
        '<span class="mediaquery type">screen</span> '+
        '<span class="mediaquery reserved">and</span> '+
        '<span class="mediaquery expression">('+
        '<span class="mediaquery feature">orientation</span>: '+
        '<span class="support text-value">landscape</span>)'+
        '</span> </span>'+
        '</span>{'
    );

    /********************
     * SCSS RESERVED
     ********************/

    // variable
    run(
        language,
        
        'variable',
        
        '$variable',
        
        '<span class="scss variable">$variable</span>'
    );

    /********************
     * PLACEHOLDERS
     ********************/
    
    // placeholder selector
    run(
        language,
        
        'placeholder selector',
        
        '%placeholder {',
        
        '<span class="selector">'+
        '<span class="entity scss placeholder">%placeholder</span> '+
        '</span>{'
    );

    // extend placeholder (@extend directive)
    run(
        language,
        
        'extend placeholder',
        
        '@extend %placeholder;',
        
        '<span class="scss extend">'+
        '<span class="at-directive">@extend</span> '+
        '<span class="entity scss placeholder">%placeholder</span>'+
        '</span>;'
    );

    /********************
     * MIXINS
     ********************/
    
    // mixin declaration (@mixin directive)
    run(
        language,

        'mixin declaration',

        '@mixin rem($property, $size: 1) {',

        '<span class="scss mixin">'+
        '<span class="at-directive">@mixin</span> '+
        '<span class="scss mixin-name">rem</span>'+
        '<span class="scss mixin-params">('+
        '<span class="scss variable">$property</span>, '+
        '<span class="scss variable">$size</span>: '+
        '<span class="constant numeric">1</span>)'+
        '</span></span> {'
    );

    // mixin usage (@include directive)
    run(
        language,
        
        'mixin usage',
        
        '@include rem(\'margin-bottom\', 16);',
        
        '<span class="scss include">'+
        '<span class="at-directive">@include</span> '+
        '<span class="scss mixin-name">rem</span>'+
        '<span class="scss mixin-params">('+
        '<span class="string">\'margin-bottom\'</span>, '+
        '<span class="constant numeric">16</span>)'+
        '</span></span>;'
    );

    /********************
     * LOOPS
     ********************/
    
    // for loop (@for directive)
    run(
        language,
        
        'for loop',
        
        '@for $i from 1 through 3 {',
        
        '<span class="scss loop for">'+
        '<span class="at-directive">@for</span> '+
        '<span class="scss loop-condition">'+
        '<span class="scss variable">$i</span> '+
        '<span class="reserved">from</span> '+
        '<span class="constant numeric">1</span> '+
        '<span class="reserved">through</span> '+
        '<span class="constant numeric">3</span> '+
        '</span></span>{'
    );

    // each loop (@each directive)
    run(
        language,
        
        'each loop',
        
        '@each $animal in puma, sea-slug, egret, salamander {',
        
        '<span class="scss loop each">'+
        '<span class="at-directive">@each</span> '+
        '<span class="scss loop-condition">'+
        '<span class="scss variable">$animal</span> '+
        '<span class="reserved">in</span> '+
        '<span class="support text-value">puma</span>, '+
        '<span class="support text-value">sea-slug</span>, '+
        '<span class="support text-value">egret</span>, '+
        '<span class="support text-value">salamander</span> '+
        '</span></span>{'
    );

    // while loop (@while directive)
    run(
        language,
        
        'while loop',
        
        '@while $i > 0 {',
        
        '<span class="scss loop while">'+
        '<span class="at-directive">@while</span> '+
        '<span class="scss loop-condition">'+
        '<span class="scss variable">$i</span> '+
        '<span class="constant operator">&gt;</span> '+
        '<span class="constant numeric">0</span>'+
        '</span></span> {'
    );

    /********************
     * FUNCTIONS
     ********************/
    
    // function declaration (@function directive)
    run(
        language,
        
        'function declaration',
        
        '@function grid-width($n) {',
        
        '<span class="scss method">'+
        '<span class="at-directive">@function</span> '+
        '<span class="scss method-name">grid-width</span>'+
        '<span class="method-params">('+
        '<span class="scss variable">$n</span>)'+
        '</span></span> {'
    );

    /********************
     * CONDITIONS
     ********************/
    
    // if/else condition (@if/@else directive)
    run(
        language,
        
        'if/else condition',
        
        '@if $var==true {\n'+
        '  // result if true\n'+
        '} @else if $var==false {\n'+
        '  // result if false\n'+
        '} @else {\n'+
        '  // result if null\n'+
        '}',

        '<span class="scss condition"><span class="at-directive">@if</span> <span class="scss condition-expression"><span class="scss variable">$var</span><span class="constant operator">==</span><span class="scss constant">true</span></span></span> {\n'+
        '  <span class="scss comment">// result if true</span>\n'+
        '} <span class="scss condition"><span class="at-directive">@else if</span> <span class="scss condition-expression"><span class="scss variable">$var</span><span class="constant operator">==</span><span class="scss constant">false</span></span></span> {\n'+
        '  <span class="scss comment">// result if false</span>\n'+
        '} <span class="at-directive">@else</span> {\n'+
        '  <span class="scss comment">// result if null</span>\n'+
        '}'
    );
    
    // ternary condition
    run(
        language,
        
        'ternary condition',
        
        'if($bigger==true,28px,24px);',
        
        '<span class="scss condition ternary">'+
        '<span class="scss ternary-method">if</span>'+
        '<span class="scss ternary-params">('+
        '<span class="ternary-condition">'+
        '<span class="scss variable">$bigger</span>'+
        '<span class="constant operator">==</span>'+
        '<span class="scss constant">true</span>'+
        '</span>,'+
        '<span class="ternary-true">'+
        '<span class="constant numeric">28<span class="keyword unit absolute">px</span></span>'+
        '</span>,'+
        '<span class="ternary-false">'+
        '<span class="constant numeric">24<span class="keyword unit absolute">px</span></span>'+
        '</span>)'+
        '</span></span>;'
    );

    /********************
     * INTERPOLATIONS
     ********************/
    
    // simple interpolation
    run(
        language,
        
        'simple interpolation',
        
        '#{$variable}',
        
        '<span class="scss interpolation">'+
        '#{<span class="scss variable">$variable</span>}'+
        '</span>'
    );

    // interpolation as part of selector
    run(
        language,
        
        'interpolation as part of selector',
        
        '.#{$animal}-icon {',
        
        '<span class="selector">'+
        '<span class="entity name class">.'+
        '<span class="scss interpolation">'+
        '#{<span class="scss variable">$animal</span>}'+
        '</span>'+
        '-icon</span> '+
        '</span>{'
    );

    // interpolation inside a string
    run(
        language,
        
        'interpolation inside a string',
        
        '"/images/#{$animal}.png"',
        
        '<span class="string">'+
        '"/images/'+
        '<span class="scss interpolation">'+
        '#{<span class="scss variable">$animal</span>}'+
        '</span>.png"'+
        '</span>'
    );

});
