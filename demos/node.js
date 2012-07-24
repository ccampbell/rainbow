var Rainbow = require('..'),
    code    = 'console.log("Rainbow is a great highlighting tool to use with NodeJS");';

// Output synchronous :
console.log(Rainbow.color(code, 'javascript'));

// Result will be :
// console.<span class="function call">log</span>(<span class="string">"Rainbow is a great highlighting tool to use with NodeJS"</span>);