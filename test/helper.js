const rainbow = require('./src/rainbow-node.js');

export function run(t, lang, description, code, expected) {
    const result = rainbow.colorSync(code, lang);
    t.assert(result === expected, description);
}

export function skip(lang, description) {
    console.log(`Skipped ${lang}: ${description}`);
}
