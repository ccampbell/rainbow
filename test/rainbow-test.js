
/////////////////////////
// Helpers and globals //
/////////////////////////

const expect = chai.expect;

////////////////
// Test suite //
////////////////

describe('Rainbow', function() {
    it('Basic things are defined', () => {
        expect(Rainbow).to.exist;
        expect(Rainbow.color).to.be.a('function');
        expect(Rainbow.extend).to.be.a('function');
        expect(Rainbow.onHighlight).to.be.a('function');
        expect(Rainbow.addClass).to.be.a('function');
        expect(Rainbow.addAlias).to.be.a('function');
    });
});
