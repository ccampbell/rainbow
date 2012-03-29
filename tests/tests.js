window.RainbowTester = (function() {
    function _addScript(url) {

        var script = document.createElement('script');
        script.src = url + '?' + new Date().getTime();
        document.getElementsByTagName('body')[0].appendChild(script);
    }

    function _runTest(languages, i) {
        if (i < languages.length) {

        }
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

        _runTest(languages, 0);
        for (i = 0; i < languages.length; ++i) {
            _addScript('language/' + languages[i] + '-test.js');
        }

        // load in the actual tests
    }

    return {
        init: function() {
            $("#run_tests").click(_runTests);
        },

        startTest: function(name) {
            console.log('starting', name);
        },

        endTest: function(name) {
            console.log('ending', name);
        }
    };
}) ();

$(document).ready(RainbowTester.init);
