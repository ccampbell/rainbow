/* global describe, run */
var language = 'css';

describe(language, function() {
    run(
        language,

        'comment',

        '/* comment */',

        '<span class="comment">/* comment */</span>'
    );

    run(
        language,

        'multi-line comment',

        '/**\n' +
        ' * comment\n' +
        ' */',

        '<span class="comment">/**\n' +
        ' * comment\n' +
        ' */</span>'
    );

    run(
        language,

        'pixels',

        'margin:10px 20px 5px 30px;',

        '<span class="css-property">margin</span>:<span class="constant numeric">10<span class="keyword unit absolute">px</span></span> <span class="constant numeric">20<span class="keyword unit absolute">px</span></span> <span class="constant numeric">5<span class="keyword unit absolute">px</span></span> <span class="constant numeric">30<span class="keyword unit absolute">px</span></span>;'
    );

    run(
        language,

        'cm',

        'margin: 1cm 2cm 1.3cm 4cm;',

        '<span class="css-property">margin</span>: <span class="constant numeric">1<span class="keyword unit absolute">cm</span></span> <span class="constant numeric">2<span class="keyword unit absolute">cm</span></span> <span class="constant numeric">1.3<span class="keyword unit absolute">cm</span></span> <span class="constant numeric">4<span class="keyword unit absolute">cm</span></span>;'
    );

    run(
        language,

        'em',

        'font-size: 1.2em;',

        '<span class="css-property">font-size</span>: <span class="constant numeric">1.2<span class="keyword unit relative">em</span></span>;'
    );

    run(
        language,

        'percentage',

        'width: 100%\n' +
        'height: 100%',

        '<span class="css-property">width</span>: <span class="constant numeric">100<span class="keyword unit percentage">%</span></span>\n' +
        '<span class="css-property">height</span>: <span class="constant numeric">100<span class="keyword unit percentage">%</span></span>'
    );

    run(
        language,

        'string single quote',

        '\'test string\'',

        '<span class="string">\'test string\'</span>'
    );

    run(
        language,

        'string double quote',

        '"test string"',

        '<span class="string">"test string"</span>'
    );

    run(
        language,

        'transition - vendor prefix',

        'code span {\n' +
            '   -moz-transition: color .8s ease-in;\n' +
            '   -o-transition: color .8s ease-in;\n' +
            '   -webkit-transition: color .8s ease-in;\n' +
            '   transition: color .8s ease-in;\n' +
        '}',

        '<span class="selector"><span class="entity name tag">code</span> <span class="entity name tag">span</span> </span>{\n' +
        '   <span class="css-property"><span class="vendor-prefix">-moz-</span>transition</span>: <span class="support text-value">color</span> <span class="constant numeric">.8<span class="keyword unit time">s</span></span> <span class="support text-value">ease-in</span>;\n' +
        '   <span class="css-property"><span class="vendor-prefix">-o-</span>transition</span>: <span class="support text-value">color</span> <span class="constant numeric">.8<span class="keyword unit time">s</span></span> <span class="support text-value">ease-in</span>;\n' +
        '   <span class="css-property"><span class="vendor-prefix">-webkit-</span>transition</span>: <span class="support text-value">color</span> <span class="constant numeric">.8<span class="keyword unit time">s</span></span> <span class="support text-value">ease-in</span>;\n' +
        '   <span class="css-property">transition</span>: <span class="support text-value">color</span> <span class="constant numeric">.8<span class="keyword unit time">s</span></span> <span class="support text-value">ease-in</span>;\n' +
        '}'
    );

    run(
        language,

        'tag',

        'p {',

        '<span class="selector"><span class="entity name tag">p</span> </span>{'
    );

    run(
        language,

        'class',

        'p.intro {',

        '<span class="selector"><span class="entity name tag">p</span><span class="entity name class">.intro</span> </span>{'
    );

    run(
        language,

        'id',

        'p#intro {',

        '<span class="selector"><span class="entity name tag">p</span><span class="entity name id">#intro</span> </span>{'
    );

    run(
        language,

        'direct descendant',

        'p > span {',

        '<span class="selector"><span class="entity name tag">p</span><span class="direct-child"> &gt; </span><span class="entity name tag">span</span> </span>{'
    );

    run(
        language,

        'one line',

        'p { color: #fff; margin-top: 10px; }',

        '<span class="selector"><span class="entity name tag">p</span> </span>{ <span class="css-property">color</span>: <span class="constant hex-color">#fff</span>; <span class="css-property">margin-top</span>: <span class="constant numeric">10<span class="keyword unit absolute">px</span></span>; }'
    );

    run(
        language,

        'linear gradients',

        '.gradient {\n' +
        '    background: -webkit-linear-gradient(#f7f7f7, #e8e8e8);\n' +
        '    background:    -moz-linear-gradient(#f7f7f7, #e8e8e8);\n' +
        '    background:      -o-linear-gradient(#f7f7f7, #e8e8e8);\n' +
        '    background:         linear-gradient(#f7f7f7, #e8e8e8);\n' +
        '}',

        '<span class="selector"><span class="entity name class">.gradient</span> </span>{\n' +
        '    <span class="css-property">background</span>: <span class="css-method"><span class="method-name"><span class="vendor-prefix">-webkit-</span>linear-gradient</span><span class="method-params">(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>)</span></span>;\n' +
        '    <span class="css-property">background</span>:    <span class="css-method"><span class="method-name"><span class="vendor-prefix">-moz-</span>linear-gradient</span><span class="method-params">(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>)</span></span>;\n' +
        '    <span class="css-property">background</span>:      <span class="css-method"><span class="method-name"><span class="vendor-prefix">-o-</span>linear-gradient</span><span class="method-params">(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>)</span></span>;\n' +
        '    <span class="css-property">background</span>:         <span class="css-method"><span class="method-name">linear-gradient</span><span class="method-params">(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>)</span></span>;\n' +
        '}'
    );

    run(
        language,

        'multi line selectors',

        '.maps-headline,\n' +
        '.maps-subline,\n' +
        '.chart-headline,\n' +
        '.chart-subline {\n' +
        '   font-weight: bold;\n' +
        '}',

        '<span class="selector"><span class="entity name class">.maps-headline</span>,\n' +
        '<span class="entity name class">.maps-subline</span>,\n' +
        '<span class="entity name class">.chart-headline</span>,\n' +
        '<span class="entity name class">.chart-subline</span> </span>{\n' +
        '   <span class="css-property">font-weight</span>: <span class="support text-value">bold</span>;\n' +
        '}'
    );

    /**
     * IE HACKS
     */
    
    run(
        language,
        
        'hack for ie6 only',
        
        '_color: blue;',
        
        '<span class="hack"><span class="ie-6">_</span></span><span class="css-property">color</span>: <span class="support text-value">blue</span>;'
    );
    
    run(
        language,
        
        'hack for ie6 and ie7 (aka lte7)',
        
        '*color: blue;\n'+
        '#color: blue;\n'+
        'color: blue !ie;',
        
        '<span class="hack"><span class="ie-lte7">*</span></span><span class="css-property">color</span>: <span class="support text-value">blue</span>;\n'+
        '<span class="hack"><span class="ie-lte7">#</span></span><span class="css-property">color</span>: <span class="support text-value">blue</span>;\n'+
        '<span class="css-property">color</span>: <span class="support text-value">blue</span> <span class="hack"><span class="ie-lte7">!ie</span></span>;'
    );
    
    run(
        language,
        
        'hack for ie7+ (aka gt6)',
        
        'color/**/: blue;',
        
        '<span class="css-property">color</span><span class="hack"><span class="ie-gt6">/**/</span></span>: <span class="support text-value">blue</span>;'
    );
    
    run(
        language,
        
        'hack for ie7 and ie8',
        
        'color/*\\**/: blue\\9;',
        
        '<span class="css-property">color</span><span class="hack"><span class="ie-gt6">/*\\**/</span></span>: <span class="support text-value">blue</span><span class="hack"><span class="ie-lte9">\\9</span></span>;'
    );
    
    run(
        language,
        
        'hack for ie6+ (aka lte9)',
        
        'color: blue\\9;',
        
        '<span class="css-property">color</span>: <span class="support text-value">blue</span><span class="hack"><span class="ie-lte9">\\9</span></span>;'
    );
    
    run(
        language,
        
        'hack for ie8 and ie9',
        
        'color: blue\\0/;',
        
        '<span class="css-property">color</span>: <span class="support text-value">blue</span><span class="hack"><span class="ie-8-9">\\0/</span></span>;'
    );

});
