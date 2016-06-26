import '../../src/language/css';
import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'css';

describe(language, () => {
    run(
        language,

        'comment',

        '/* comment */',

        '<span class="comment">/* comment */</span>'
    );

    run(
        language,

        'multi-line comment',

        `/**
         * comment
         */`,

        `<span class="comment">/**
         * comment
         */</span>`
    );

    run(
        language,

        'pixels',

        'margin:10px 20px 5px 30px;',

        '<span class="support css-property">margin</span>:<span class="constant numeric">10</span><span class="keyword unit">px</span> <span class="constant numeric">20</span><span class="keyword unit">px</span> <span class="constant numeric">5</span><span class="keyword unit">px</span> <span class="constant numeric">30</span><span class="keyword unit">px</span>;'
    );

    run(
        language,

        'cm',

        'margin: 1cm 2cm 1.3cm 4cm;',

        '<span class="support css-property">margin</span>: <span class="constant numeric">1</span><span class="keyword unit">cm</span> <span class="constant numeric">2</span><span class="keyword unit">cm</span> <span class="constant numeric">1</span>.<span class="constant numeric">3</span><span class="keyword unit">cm</span> <span class="constant numeric">4</span><span class="keyword unit">cm</span>;'
    );

    run(
        language,

        'em',

        'font-size: 1.2em;',

        '<span class="support css-property">font-size</span>: <span class="constant numeric">1</span>.<span class="constant numeric">2</span><span class="keyword unit">em</span>;'
    );

    run(
        language,

        'percentage',

        `width: 100%
        height: 100%`,

        `<span class="support css-property">width</span>: <span class="constant numeric">100</span><span class="keyword unit">%</span>
        <span class="support css-property">height</span>: <span class="constant numeric">100</span><span class="keyword unit">%</span>`
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

        `code span {
             -moz-transition: color .8s ease-in;
             -o-transition: color .8s ease-in;
             -webkit-transition: color .8s ease-in;
             transition: color .8s ease-in;
        }`,

        `<span class="entity name tag">code</span> <span class="entity name tag">span</span> {
             <span class="support css-property"><span class="support vendor-prefix">-moz-</span>transition</span>: <span class="support css-value">color</span> .<span class="constant numeric">8</span><span class="keyword unit">s</span> ease-in;
             <span class="support css-property"><span class="support vendor-prefix">-o-</span>transition</span>: <span class="support css-value">color</span> .<span class="constant numeric">8</span><span class="keyword unit">s</span> ease-in;
             <span class="support css-property"><span class="support vendor-prefix">-webkit-</span>transition</span>: <span class="support css-value">color</span> .<span class="constant numeric">8</span><span class="keyword unit">s</span> ease-in;
             <span class="support css-property">transition</span>: <span class="support css-value">color</span> .<span class="constant numeric">8</span><span class="keyword unit">s</span> ease-in;
        }`
    );

    run(
        language,

        'tag',

        'p {',

        '<span class="entity name tag">p</span> {'
    );

    run(
        language,

        'class',

        'p.intro {',

        '<span class="entity name tag">p</span><span class="entity name class">.intro</span> {'
    );

    run(
        language,

        'id',

        'p#intro {',

        '<span class="entity name tag">p</span><span class="entity name id">#intro</span> {'
    );

    run(
        language,

        'direct descendant',

        'p > span {',

        '<span class="entity name tag">p</span> <span class="direct-descendant">&gt;</span> <span class="entity name tag">span</span> {'
    );

    run(
        language,

        'scss',

        `article {
           &amp;.cool {
               p {
                   margin-top: 20px;
               }
           }
        }`,

        `<span class="entity name tag">article</span> {
           <span class="entity name sass">&amp;</span><span class="entity name class">.cool</span> {
               <span class="entity name tag">p</span> {
                   <span class="support css-property">margin-top</span>: <span class="constant numeric">20</span><span class="keyword unit">px</span>;
               }
           }
        }`
    );

    run(
        language,

        'one line',

        'p { color: #fff; margin-top: 10px; }',

        '<span class="entity name tag">p</span> { <span class="support css-property">color</span>: <span class="constant hex-color">#fff</span>; <span class="support css-property">margin-top</span>: <span class="constant numeric">10</span><span class="keyword unit">px</span>; }'
    );

    run(
        language,

        'linear gradients',

        `.gradient {
            background: -webkit-linear-gradient(#f7f7f7, #e8e8e8);
            background:    -moz-linear-gradient(#f7f7f7, #e8e8e8);
            background:      -o-linear-gradient(#f7f7f7, #e8e8e8);
            background:         linear-gradient(#f7f7f7, #e8e8e8);
        }`,

        `<span class="entity name class">.gradient</span> {
            <span class="support css-property">background</span>: <span class="support vendor-prefix">-webkit-</span><span class="support css-value">linear-gradient</span>(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>);
            <span class="support css-property">background</span>:    <span class="support vendor-prefix">-moz-</span><span class="support css-value">linear-gradient</span>(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>);
            <span class="support css-property">background</span>:      <span class="support vendor-prefix">-o-</span><span class="support css-value">linear-gradient</span>(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>);
            <span class="support css-property">background</span>:         <span class="support css-value">linear-gradient</span>(<span class="constant hex-color">#f7f7f7</span>, <span class="constant hex-color">#e8e8e8</span>);
        }`
    );

    run(
        language,

        'multi line selectors',

        `.maps-headline,
        .maps-subline,
        .chart-headline,
        .chart-subline {
            font-weight: bold;
        }`,

        `<span class="entity name class">.maps-headline</span>,
        <span class="entity name class">.maps-subline</span>,
        <span class="entity name class">.chart-headline</span>,
        <span class="entity name class">.chart-subline</span> {
            <span class="support css-property">font-weight</span>: <span class="support css-value">bold</span>;
        }`
    );
});
