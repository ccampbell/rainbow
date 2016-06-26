
/////////////////////////
// Helpers and globals //
/////////////////////////

const expect = chai.expect;

export function run(lang, description, code, result) {
    it(description, (done) => {
        Rainbow.color(code, lang, (html) => {
            expect(result).to.equal(html);
            done();
        });
    });
}

export function skip(lang, description, code, result) {
    it.skip(description);
}

