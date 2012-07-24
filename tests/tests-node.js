/*!
 * Test suite for Rainbow under nodejs
 *
 * Usage :
 *
 *      # Run tests for all languages :
 *      node tests-node.js
 *
 *      # Run tests for one language :
 *      node tests-node.js php
 *
 *      # Run tests for many languages :
 *      node tests-node.js html generic javascript
 */


var Rainbow = require('..');

// List all available test :
var ALLTEST = [
    'coffeescript',
    'csharp',
    'css',
    'generic',
    'html',
    'java',
    'javascript',
    'php',
    'python',
    'r',
    'smalltalk']


// Expose RainbowTester to global to keep original test files
global.RainbowTester = (function() {
    var _language,
        queue = [],
        results = {};

    function _initResults(language) {
        if (!results[language]) {
            results[language] = {};
        }
    }

    function _getTableRow(language, fail, pass) {
        return '  ' + language + '\n      - failure : ' + fail + '\n      - success : ' + pass + '\n';
    }

    function _showResults() {
        if (queue.length) {
            return _processQueue();
        }

        var table = '# SUMMARY : \n',
            total_pass = 0,
            total_fail = 0;

        for (var lang in results) {
            var pass = 0,
                fail = 0;

            for (var key in results[lang]) {
                if (results[lang][key]['success']) {
                    ++pass;
                    continue;
                }
                ++fail;
            }

            total_pass += pass;
            total_fail += fail;

            table += _getTableRow(lang, fail, pass);
        }

        console.log(table);
        console.log('  ---');
        console.log('  TOTAL\n      - failure : %s\n      - success : %s\n', total_fail, total_pass);
    }



    function _processQueue() {
        if (queue.length === 0) {
            return;
        }

        var test = queue.shift();
        var actual = Rainbow.color(test['code'], test['language']);
        if (test['expected'] == actual) {
            _pass(test['language'], test['name'], actual);
            return _processQueue();
        }
        _fail(test['language'], test['name'], test['expected'], actual);
        _processQueue();
    }

    function _pass(language, test_name, actual) {
        _initResults(language);
        results[language][test_name] = {
            success: true,
            actual: actual
        };

        console.log('  SUCCESS language: %s   testname: %s', language, test_name);

    }

    function _fail(language, test_name, expected, actual) {
        _initResults(language);
        results[language][test_name] = {
            success: false,
            expected: expected,
            actual: actual
        };


        console.log('  FAILURE language: %s   testname: %s', language, test_name);
        console.log('  - - - - - - - - - - - expected  - - - - - - - - - - -');
        console.log('    ' + expected.replace(/\n/g, '\n    '));
        console.log('  - - - - - - - - - - - actual  - - - - - - - - - - - -');
        console.log('    ' + actual.replace(/\n/g, '\n    '));
        console.log();

    }

    function _loadTestAndProcess(testName) {
        var module = './language/'+testName+'-test.js';
        try {
            require.resolve(module);
        } catch(e) {
            console.log('WARNING : No test available "%s"', testName);
            return;
        }

        require('./language/'+testName+'-test.js');
    }


    return {

        init: function(languages) {
            var language;
            while(language = languages.shift()) {
                _loadTestAndProcess(language);
            }
            _showResults();
        },

        startTest: function(name) {
            _language = name;
            console.log('');
            console.log('# START TEST ' + _language);
            console.log('----------------------------------------------------------------------------------');
        },

        endTest: function(name) {
            console.log('----------------------------------------------------------------------------------');
            console.log('# END TEST ' + _language);
            console.log('');
            _language = null;
        },

        run: function(test_name, code, expected) {
            var language = _language;

            queue.push({
                'language': _language,
                'name': test_name,
                'code': code,
                'expected': expected
            });
            _processQueue();
        }
    };
}) ();


// Init tests :
var languages = process.argv.slice(2);
if(!languages || !languages.length) {
    languages = ALLTEST;
}
RainbowTester.init(languages);
