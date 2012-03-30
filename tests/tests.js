window.RainbowTester = (function() {
    var _language,
        _done = false,
        tests = [],
        results = {};

    function _addScript(url, language) {
        var script = document.createElement('script');
        script.src = url + '?' + new Date().getTime();
        document.getElementsByTagName('body')[0].appendChild(script);
    }

    function _runTests(e) {
        var languages = $("select[name=languages]").val() || [],
            min = $("input[name=min]").attr("checked"),
            i;

        results = {};
        _done = false;
        $('.global_toggle').show();
        $('#results').html('');


        // add rainbow
        _addScript(RAINBOW_PATH + '/rainbow.' + (min ? 'min.' : '') + 'js');

        // add all the languages
        $("select[name=languages] option").each(function() {
            _addScript(RAINBOW_PATH + '/language/' + this.value + '.js');
        });

        for (i = 0; i < languages.length; ++i) {
            _addScript('language/' + languages[i] + '-test.js', languages[i]);
        }
    }

    function _toggleCode(e) {
        e.preventDefault();
        $(this).parents('li').find('.code').toggle();
    }

    function _globalToggleCode(e) {
        e.preventDefault();
        if ($(this).text() == 'expand all') {
            $(".code").show();
            return $(this).text('collapse all');
        }

        $(".code").hide();
        $(this).text('expand all');
    }

    function _initResults(language) {
        if (!results[language]) {
            results[language] = {};
        }
    }

    function _getTableRow(language, fail, pass) {
        return '<tr><td>' + language + '</td><td class="failure">' + fail + '</td><td class="success">' + pass + '</td></tr>';
    }

    function _showResults() {
        var table = '<table><tr><th>Language</th><th class="failure">Failed</th><th class="success">Passed</th></tr>',
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

        table += _getTableRow('total', total_fail, total_pass);
        table += '</table>';

        $("#results").append(table);
    }

    function _removeTest(name) {
        for (var i = 0; i < tests.length; ++i) {
            if (tests[i] == name) {
                tests.splice(i, 1);
            }
        }

        setTimeout(function() {
            if (!_done && tests.length === 0) {
                _done = true;
                _showResults();
            }
        }, 1000);
    }

    function _pass(language, test_name, actual) {
        _initResults(language);
        results[language][test_name] = {
            success: true,
            actual: actual
        };

        $('#' + language).append(
            '<li class="success">' +
                '<h5><a href="#" class="toggle">' + test_name + '</a></h5>' +
                '<div class="code">' +
                    '<pre><code>' + actual + '</code></pre>' +
                '</div>' +
            '</li>'
        );

        _removeTest(language + ':' + test_name);
    }

    function _fail(language, test_name, expected, actual) {
        _initResults();
        results[language][test_name] = {
            success: false,
            expected: expected,
            actual: actual
        };


        $('#' + language).append(
            '<li class="failure">' +
                '<h5><a href="#" class="toggle">' + test_name + '</a></h5>' +
                '<div class="code">' +
                    '<h6>Expected:</h6>' +
                    '<pre><code>' + expected + '</code></pre>' +
                    '<h6>Actual:</h6>' +
                    '<pre><code>' + actual + '</code></pre>' +
                '</div>' +
            '</li>'
        );
        actual = actual.replace(/\n/g, '\\n\' + \n' + '\'');
        console.log('\'' + actual + '\'');

        _removeTest(language + ':' + test_name);
    }

    return {
        init: function() {
            $("#run_tests").click(_runTests);
            $("#results").on('click', '.toggle', _toggleCode);
            $("body").on('click', '.global_toggle', _globalToggleCode);
        },

        startTest: function(name) {
            _language = name;
            $("#results").append('<h3>' + _language + '</h3><ul id="' + _language + '"></ul>');
        },

        endTest: function(name) {
            _language = null;
        },

        run: function(test_name, code, expected) {
            var language = _language;
            tests.push(language + ':' + test_name);
            Rainbow.color(code, _language, function(actual) {
                if (expected == actual) {
                    return _pass(language, test_name, actual);
                }
                return _fail(language, test_name, expected, actual);
            });
        }
    };
}) ();

$(document).ready(RainbowTester.init);
