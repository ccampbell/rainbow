
/////////////////////////
// Helpers and globals //
/////////////////////////

const expect = chai.expect;

export function run(lang, description, code, result, only = false) {
    let toCall = it;
    if (only) {
        toCall = it.only;
    }

    toCall(description, (done) => {
        Rainbow.color(code, lang, (html) => {
            expect(result).to.equal(html);
            done();
        });
    });
}

export function skip(lang, description, code, result) {
    it.skip(description);
}

