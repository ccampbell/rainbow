<!DOCTYPE html>
<meta charset=utf-8>
<title>Syntax Highlighting</title>
<link href="../themes/css/blackboard.css" rel="stylesheet" type="text/css" media="screen">
<body>
    <h1>API Test Page</h1>
    <div id="stuff">
        <p>code on page to begin with</p>
        <pre data-language="javascript"><code>var foo = false;</code></pre>
    </div>

    <script src="../dist/rainbow.js"></script>
    <script src="../src/language/generic.js"></script>
    <script src="../src/language/javascript.js"></script>
    <script src="../src/language/html.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
    <script>
        setTimeout(function() {
            $('#stuff').append('<p>code added to page then highlighted:</p><pre data-language="javascript"><code>function hello(name) {\n    alert(\'Hello \' + name);\n}</code></pre>');

            Rainbow.color();
        }, 250);

        // test highlighting a string directly then inserting into DOM
        setTimeout(function() {
            var html = "<html><h2>Hi World! &amp;amp; test</h2></html>";

            Rainbow.color(html, 'html', function(highlighted_code) {
                $("#stuff").append('<p>code from string:</p><pre class="rainbow">' + highlighted_code + '</pre>');
            });
        }, 500);

        // test highlighting a div then inserting into DOM
        setTimeout(function() {
            var div = document.createElement('div');
            div.innerHTML = '<p>code from div:</p><pre><code data-language="javascript">var whatever = function() {};</code></pre>';

            Rainbow.color(div, function() {
                document.getElementById('stuff').appendChild(div);
            });
        }, 750);

        // add content to the dom and call rainbow.color again without callback
        setTimeout(function() {
            $("#stuff").append('<p>code inserted dynamically no callback:</p><pre><code data-language="javascript">var html = document.getElementById("stuff").innerHTML;</code></pre>');

            Rainbow.color();
        }, 1000);

        // add content to the dom and call rainbow.color again with callback
        setTimeout(function() {
            $("#stuff").append('<p>code inserted dynamically with callback:</p><pre><code data-language="javascript">var html = $("#stuff").html();</code></pre>');

            Rainbow.color(function() {
                $("#stuff").append('<p>got callback<p>');
            });
        }, 1250);
    </script>
</body>
