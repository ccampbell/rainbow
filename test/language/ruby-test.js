import '../../src/language/ruby';
import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'ruby';

describe(language, () => {
    run(
        language,

        'multiple (non-greedy) strings',

        `"me" && "you"
        `,

        `<span class="string"><span class="string open">"</span>me<span class="string close">"</span></span> <span class="keyword operator">&amp;</span><span class="keyword operator">&amp;</span> <span class="string"><span class="string open">"</span>you<span class="string close">"</span></span>
        `
    );

    run(
        language,

        'interpolated strings',

        '"chapter #{x+5}"\n',

        '<span class="string"><span class="string open">"</span>chapter ' +
        '<span class="string interpolation"><span class="string open">#{' +
        '</span>x<span class="keyword operator">+</span>' +
        '<span class="constant numeric">5</span><span class="string close">}</span></span>' +
        '<span class="string close">"</span></span>\n'
    );

    run(
        language,

        'string in brackets',

        'foo = ["one", "two", "three"];',

        'foo <span class="keyword operator">=</span> [' +
        '<span class="string"><span class="string open">"</span>one<span class="string close">"</span></span>, ' +
        '<span class="string"><span class="string open">"</span>two<span class="string close">"</span></span>, ' +
        '<span class="string"><span class="string open">"</span>three<span class="string close">"</span></span>];'
    );

    run(
        language,

        '__END__',

        `class Test;end;
__END__
this is just text
true
`,

        `<span class="storage class">class</span> <span class="entity name class">Test</span>;<span class="keyword control">end</span>;
<span class="variable language">__END__</span>
this is just text
true
`
    );

    run(
        language,

        'numbers with underscores',

        '1_000_000',

        '<span class="constant numeric">1_000_000</span>'
    );

});
