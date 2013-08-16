/* global describe, run */
var language = 'ruby';

describe(language, function() {

    run(
        language,

        'multiple strings',

        '"me" && "you"\n',

        '<span class="string"><span class="string open">"</span>me<span class="string close">"</span></span>' +
        ' <span class="keyword operator">&amp;</span><span class="keyword operator">&amp;</span> ' +
        '<span class="string"><span class="string open">"</span>you<span class="string close">"</span></span>\n'
    );

    run(
        language,

        'string in brackets',

        'foo = ["one", "two", "three"];',

        'foo <span class="keyword operator">=</span> ['+
        '<span class="string"><span class="string open">"</span>one<span class="string close">"</span></span>, '+
        '<span class="string"><span class="string open">"</span>two<span class="string close">"</span></span>, ' +
        '<span class="string"><span class="string open">"</span>three<span class="string close">"</span></span>];'
    );
});
