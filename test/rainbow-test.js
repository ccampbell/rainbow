/* global Rainbow */

/////////////////////////
// Helpers and globals //
/////////////////////////

const expect = chai.expect;

////////////////
// Test suite //
////////////////

describe('Rainbow', () => {
    it('Basic things are defined', () => {
        expect(Rainbow).to.exist;
        expect(Rainbow.color).to.be.a('function');
        expect(Rainbow.extend).to.be.a('function');
        expect(Rainbow.onHighlight).to.be.a('function');
        expect(Rainbow.addAlias).to.be.a('function');
    });

    it('Should apply global class', (done) => {
        Rainbow.extend([{
            name: 'name',
            pattern: /Craig/gm
        }]);

        Rainbow.color('My name is Craig', { language: 'generic', globalClass: 'global' }, (result) => {
            expect(result).to.equal('My name is <span class="name global">Craig</span>');
            done();
        });
    });
});
