window.RainbowTester = (function() {
    var _language,
        results = {};

    function _addScript(url) {

        var script = document.createElement('script');
        script.src = url + '?' + new Date().getTime();
        document.getElementsByTagName('body')[0].appendChild(script);
    }

    function _runTests(e) {
        var languages = $("select[name=languages]").val() || [],
            min = $("input[name=min]").attr("checked"),
            i;

        // add rainbow
        _addScript(RAINBOW_PATH + '/rainbow.' + (min ? 'min.' : '') + 'js');

        // add all the languages
        $("select[name=languages] option").each(function() {
            _addScript(RAINBOW_PATH + '/language/' + this.value + '.js');
        });

        for (i = 0; i < languages.length; ++i) {
            _addScript('language/' + languages[i] + '-test.js');
        }

        // load in the actual tests
    }

    function _initResults() {
        if (!results[_language]) {
            results[_language] = {};
        }
    }

    function _pass(test_name) {
        _initResults();
        results[_language][test_name] = {
            success: true
        };
        console.log(test_name, 'PASS');
    }

    function _fail(test_name, expected, actual) {
        _initResults();
        results[_language][test_name] = {
            success: false,
            expected: expected,
            actual: actual
        };
        console.warn(test_name, 'FAIL', 'EXPECTED', expected, 'ACTUAL', actual);
    }

    return {
        init: function() {
            $("#run_tests").click(_runTests);
        },

        startTest: function(name) {
            console.log('starting', name);
            _language = name;
        },

        endTest: function(name) {
            console.log('ending', name);
            _language = null;
        },

        run: function(test_name, code, expected) {
            Rainbow.color(code, _language, function(actual) {
                if (expected == actual) {
                    return _pass(test_name);
                }
                return _fail(test_name, expected, actual);
            });
        }
    };
}) ();

$(document).ready(RainbowTester.init);
