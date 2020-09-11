const rainbow = require('./src/rainbow-node.js');

const genericPatterns = [{
    name: 'test',
    pattern: /test/gi
}];

const patternA = [{
    name: 'a',
    pattern: /here/gi
}];

const patternB = [{
    name: 'b',
    pattern: /is/gi
}];

const patternDollar = [{
    name: 'dollar',
    pattern: /'\$'/g
}];

export function testFunctionsExist(t) {
    t.assert(typeof rainbow.extend === 'function', 'Extend is a function');
    t.assert(typeof rainbow.remove === 'function');
    t.assert(typeof rainbow.onHighlight === 'function');
    t.assert(typeof rainbow.addAlias === 'function');
    t.assert(typeof rainbow.color === 'function');
    t.assert(typeof rainbow.colorSync === 'function');
}

export async function testGlobalClass(t) {
    rainbow.extend('generic', [{
        name: 'name',
        pattern: /Craig/gm
    }]);

    rainbow.color('My name is Craig', { language: 'generic', globalClass: 'global' }, (result) => {
        t.assert(result === 'My name is <span class="name global">Craig</span>');
        return Promise.resolve();
    });
}

export async function testPatterns(t) {
    rainbow.extend('generic', genericPatterns);

    rainbow.color('here is a test', 'generic', (result) => {
        t.assert(result === 'here is a <span class="test">test</span>');
        return Promise.resolve();
    });
}

export async function testExtendPatterns(t) {
    rainbow.extend('newLanguage', patternA, 'generic');

    rainbow.color('here is a test', 'newLanguage', (result) => {
        t.assert(result === '<span class="a">here</span> is a <span class="test">test</span>');
        return Promise.resolve();
    });
}

export async function testExtendPatternsThatExtendPatterns(t) {
    rainbow.extend('newLanguage', patternB);

    rainbow.color('here is a test', 'newLanguage', (result) => {
        t.assert(result === '<span class="a">here</span> <span class="b">is</span> a <span class="test">test</span>');
        return Promise.resolve();
    });
}

export async function testAliases(t) {
    rainbow.addAlias('new', 'newLanguage');
    rainbow.color('here is a test', 'new', (result) => {
        t.assert(result === '<span class="a">here</span> <span class="b">is</span> a <span class="test">test</span>');
        return Promise.resolve();
    });
}

export async function testRemoveLanguage(t) {
    rainbow.extend('foo', genericPatterns);

    rainbow.color('just a test', 'foo', (result) => {
        t.assert(result === 'just a <span class="test">test</span>');
        rainbow.remove('foo');

        rainbow.color('just a test', 'foo', (result2) => {
            t.assert(result2 === 'just a test');
            return Promise.resolve();
        });
    });
}

// Not sure why anyone would want this behavior, but since we are faking
// global regex matches we should make sure this works too.
export async function testNonGlobalRegex(t) {
    rainbow.remove('foo');
    rainbow.extend('foo', [
        {
            name: 'number',
            pattern: /\b\d+\b/
        }
    ]);

    rainbow.color('123 456 789', 'foo', (result) => {
        t.assert(result === '<span class="number">123</span> 456 789');
        return Promise.resolve();
    });
}

export async function testDollarSigns(t) {
    rainbow.extend('dollarLanguage', patternDollar);

    rainbow.color('here is a test with a \'$\' sign in it', 'dollarLanguage', (result) => {
        t.assert(result === 'here is a test with a <span class="dollar">\'$\'</span> sign in it');
        return Promise.resolve();
    });
}
