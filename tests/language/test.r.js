/* global describe, run */
var language = 'r';

describe(language, function() {
    run(
        language,

        'comments',

        '# A comment\n' +
        'a <- "b" # Another comment',

        '<span class="comment"># A comment</span>\n' +
        'a <span class="keyword operator">&lt;-</span> <span class="string">"b"</span> <span class="comment"># Another comment</span>'
    );

    run(
        language,

        'assignment',

        'foo.bar <- "foo"\n' +
        'baz1 = 1.62e-4',

        'foo.bar <span class="keyword operator">&lt;-</span> <span class="string">"foo"</span>\n' +
        'baz1 <span class="keyword operator">=</span> <span class="constant numeric">1.62e-4</span>'
    );

    run(
        language,

        'constants',

        'baz <- NA\n' +
        'my.pi <- pi\n' +
        'all.letters <- c(LETTERS, letters)\n' +
        'xrange <- c(-Inf, TRUE)',

        'baz <span class="keyword operator">&lt;-</span> <span class="constant language">NA</span>\n' +
        'my.pi <span class="keyword operator">&lt;-</span> <span class="constant symbol">pi</span>\n' +
        'all.letters <span class="keyword operator">&lt;-</span> <span class="function call">c</span>(<span class="constant symbol">LETTERS</span>, <span class="constant symbol">letters</span>)\n' +
        'xrange <span class="keyword operator">&lt;-</span> <span class="function call">c</span>(<span class="keyword operator">-</span><span class="constant language">Inf</span>, <span class="constant language">TRUE</span>)'
    );

    run(
        language,

        'operators',

        'beta.hat <- solve(t(X) %*% X) %*% t(X) %*% y\n' +
        'bound.rect <- grid::rectGrob()\n' +
        'my_seq <- 1:10\n' +
        'is_in_seq <- c(2, 7, 23) %in% my_seq\n' +
        'plot(y ~ x, type = "l")',

        'beta.hat <span class="keyword operator">&lt;-</span> <span class="function call">solve</span>(<span class="function call">t</span>(X) <span class="keyword operator">%*%</span> X) <span class="keyword operator">%*%</span> <span class="function call">t</span>(X) <span class="keyword operator">%*%</span> y\n' +
        'bound.rect <span class="keyword operator">&lt;-</span> <span class="namespace">grid</span><span class="keyword operator">::</span><span class="function call">rectGrob</span>()\n' +
        'my_seq <span class="keyword operator">&lt;-</span> <span class="constant numeric">1</span><span class="keyword operator">:</span><span class="constant numeric">10</span>\n' +
        'is_in_seq <span class="keyword operator">&lt;-</span> <span class="function call">c</span>(<span class="constant numeric">2</span>, <span class="constant numeric">7</span>, <span class="constant numeric">23</span>) <span class="keyword operator">%in%</span> my_seq\n' +
        '<span class="function call">plot</span>(y <span class="keyword operator">~</span> x, type <span class="keyword operator">=</span> <span class="string">"l"</span>)'
    );

    /**
     * Note that the second function is intentionally not a function call,
     * just testing that the regex is matching only 'function' and not .+function
     */
    run(
        language,

        'function creation',

        'square <- function(x) x * x\n' +
        'square2 <- testfunction(x) x * x\n' +
        'area <- function (r) {\n' +
        '    pi * r^2\n' +
        '}',

        'square <span class="keyword operator">&lt;-</span> <span class="storage function">function</span>(x) x <span class="keyword operator">*</span> x\n' +
        'square2 <span class="keyword operator">&lt;-</span> <span class="function call">testfunction</span>(x) x <span class="keyword operator">*</span> x\n' +
        'area <span class="keyword operator">&lt;-</span> <span class="storage function">function</span> (r) {\n' +
        '    <span class="constant symbol">pi</span> <span class="keyword operator">*</span> r<span class="keyword operator">^</span><span class="constant numeric">2</span>\n' +
        '}'
    );

    skip(
        language,

        'variable',

        'tmp <- 1\n' +
        'another.tmp <- 2\n' +
        'this.is.a.var <- 3',

        'tmp <span class="keyword operator">&lt;-</span> <span class="constant numeric">1</span>\n' +
        'another.tmp <span class="keyword operator">&lt;-</span> <span class="constant numeric">2</span>\n' +
        'this.is.a.var <span class="keyword operator">&lt;-</span> <span class="constant numeric">3</span>'
    );

    skip(
        language,

        'subsetting',

        'tmp[1]\n' +
        'tmp[["test"]]',

        'tmp<span class="keyword operator">[</span><span class="constant numeric">1</span><span class="keyword operator">]</span>\n' +
        'tmp<span class="keyword operator">[[</span><span class="string">"test"</span><span class="keyword operator">]]</span>'
    );

    skip(
        language,

        'support functions',

        'logical(10)\n' +
        'test.logical(10)\n' +
        'data.frame(a = 1:10, b = 15:24)\n' +
        'complex(real = 1, imaginary = 0.5)',

        '<span class="support function">logical</span>(<span class="constant numeric">10</span>)\n' +
        '<span class="function call">test.logical</span>(<span class="constant numeric">10</span>)\n' +
        '<span class="support function">data.frame</span>(a <span class="keyword operator">=</span> <span class="constant numeric">1</span><span class="keyword operator">:</span><span class="constant numeric">10</span>, b <span class="keyword operator">=</span> <span class="constant numeric">15</span><span class="keyword operator">:</span><span class="constant numeric">24</span>)\n' +
        '<span class="support function">complex</span>(real <span class="keyword operator">=</span> <span class="constant numeric">1</span>, imaginary <span class="keyword operator">=</span> <span class="constant numeric">0.5</span>)'
    );
});
