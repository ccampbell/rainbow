const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'r';

export function testR(t) {
    run(
        t,

        language,

        'comments',

        `# A comment
        a <- "b" # Another comment`,

        `<span class="comment"># A comment</span>
        a <span class="keyword operator">&lt;-</span> <span class="string">"b"</span> <span class="comment"># Another comment</span>`
    );

    run(
        t,

        language,

        'assignment',

        `foo.bar <- "foo"
        baz1 = 1.62e-4`,

        `foo.bar <span class="keyword operator">&lt;-</span> <span class="string">"foo"</span>
        baz1 <span class="keyword operator">=</span> <span class="constant numeric">1.62e-4</span>`
    );

    run(
        t,

        language,

        'constants',

        `baz <- NA
        my.pi <- pi
        all.letters <- c(LETTERS, letters)
        xrange <- c(-Inf, TRUE)`,

        `baz <span class="keyword operator">&lt;-</span> <span class="constant language">NA</span>
        my.pi <span class="keyword operator">&lt;-</span> <span class="constant symbol">pi</span>
        all.letters <span class="keyword operator">&lt;-</span> <span class="function call">c</span>(<span class="constant symbol">LETTERS</span>, <span class="constant symbol">letters</span>)
        xrange <span class="keyword operator">&lt;-</span> <span class="function call">c</span>(<span class="keyword operator">-</span><span class="constant language">Inf</span>, <span class="constant language">TRUE</span>)`
    );

    run(
        t,

        language,

        'operators',

        `beta.hat <- solve(t(X) %*% X) %*% t(X) %*% y
        bound.rect <- grid::rectGrob()
        my_seq <- 1:10
        is_in_seq <- c(2, 7, 23) %in% my_seq
        plot(y ~ x, type = "l")`,

        `beta.hat <span class="keyword operator">&lt;-</span> <span class="function call">solve</span>(<span class="function call">t</span>(X) <span class="keyword operator">%*%</span> X) <span class="keyword operator">%*%</span> <span class="function call">t</span>(X) <span class="keyword operator">%*%</span> y
        bound.rect <span class="keyword operator">&lt;-</span> <span class="namespace">grid</span><span class="keyword operator">::</span><span class="function call">rectGrob</span>()
        my_seq <span class="keyword operator">&lt;-</span> <span class="constant numeric">1</span><span class="keyword operator">:</span><span class="constant numeric">10</span>
        is_in_seq <span class="keyword operator">&lt;-</span> <span class="function call">c</span>(<span class="constant numeric">2</span>, <span class="constant numeric">7</span>, <span class="constant numeric">23</span>) <span class="keyword operator">%in%</span> my_seq
        <span class="function call">plot</span>(y <span class="keyword operator">~</span> x, type <span class="keyword operator">=</span> <span class="string">"l"</span>)`
    );

    /**
     * Note that the second function is intentionally not a function call,
     * just testing that the regex is matching only 'function' and not .+function
     */
    run(
        t,

        language,

        'function creation',

        `square <- function(x) x * x
        square2 <- testfunction(x) x * x
        area <- function (r) {
            pi * r^2
        }`,

        `square <span class="keyword operator">&lt;-</span> <span class="storage function">function</span>(x) x <span class="keyword operator">*</span> x
        square2 <span class="keyword operator">&lt;-</span> <span class="function call">testfunction</span>(x) x <span class="keyword operator">*</span> x
        area <span class="keyword operator">&lt;-</span> <span class="storage function">function</span> (r) {
            <span class="constant symbol">pi</span> <span class="keyword operator">*</span> r<span class="keyword operator">^</span><span class="constant numeric">2</span>
        }`
    );

    skip(
        language,

        'variable',

        `tmp <- 1
        another.tmp <- 2
        this.is.a.var <- 3`,

        `tmp <span class="keyword operator">&lt;-</span> <span class="constant numeric">1</span>
        another.tmp <span class="keyword operator">&lt;-</span> <span class="constant numeric">2</span>
        this.is.a.var <span class="keyword operator">&lt;-</span> <span class="constant numeric">3</span>`
    );

    skip(
        language,

        'subsetting',

        `tmp[1]
        tmp[["test"]]`,

        `tmp<span class="keyword operator">[</span><span class="constant numeric">1</span><span class="keyword operator">]</span>
        tmp<span class="keyword operator">[[</span><span class="string">"test"</span><span class="keyword operator">]]</span>`
    );

    skip(
        language,

        'support functions',

        `logical(10)
        test.logical(10)
        data.frame(a = 1:10, b = 15:24)
        complex(real = 1, imaginary = 0.5)`,

        `<span class="support function">logical</span>(<span class="constant numeric">10</span>)
        <span class="function call">test.logical</span>(<span class="constant numeric">10</span>)
        <span class="support function">data.frame</span>(a <span class="keyword operator">=</span> <span class="constant numeric">1</span><span class="keyword operator">:</span><span class="constant numeric">10</span>, b <span class="keyword operator">=</span> <span class="constant numeric">15</span><span class="keyword operator">:</span><span class="constant numeric">24</span>)
        <span class="support function">complex</span>(real <span class="keyword operator">=</span> <span class="constant numeric">1</span>, imaginary <span class="keyword operator">=</span> <span class="constant numeric">0.5</span>)`
    );
}
