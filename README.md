# Rainbow

Rainbow is a code syntax highlighting library written in Javascript.

It was designed to be lightweight (~2.5kb), easy to use, and extendable.

It is completely themable via CSS.

## Demo

You can see rainbow in action at [http://rainbowco.de](http://rainbowco.de).

You can also build/download custom packages from there.

## Contents

* [Quick Start](#quick-start)
    * [Browser](#browser)
    * [Node.js](#nodejs)
      * [Install rainbow](#install-rainbow)
      * [Highlight some code](#highlight-some-code)
  * [Supported Browsers](#supported-browsers)
  * [Supported Languages](#supported-languages)
  * [Specifying a language](#specifying-a-language)
  * [Themes](#themes)
    * [Rendering code blocks](#rendering-code-blocks)
    * [Adding custom rules for specific languages](#adding-custom-rules-for-specific-languages)
  * [JavaScript API Documentation](#javascript-api-documentation)
    * [Rainbow.color](#rainbowcolor)
      * [Preventing automatic highlighting on page load](#preventing-automatic-highlighting-on-page-load)
      * [Extra options for color](#extra-options-for-color)
        * [globalClass](#globalclass)
    * [Rainbow.extend](#rainbowextend)
      * [Extending existing languages](#extending-existing-languages)
      * [How code is highlighted](#how-code-is-highlighted)
        * [Match by name](#match-by-name)
        * [Match by group](#match-by-group)
        * [Match by array of sub-patterns](#match-by-array-of-sub-patterns)
        * [Match using another language](#match-using-another-language)
      * [Extending an existing language](#extending-an-existing-language)
      * [How Rainbow chooses a match](#how-rainbow-chooses-a-match)
      * [Known limitations](#known-limitations)
        * [Regular expressions lookbehind assertions](#regular-expressions-lookbehind-assertions)
        * [Regular expression subgroup matches](#regular-expression-subgroup-matches)
    * [Rainbow.addAlias](#rainbowaddalias)
    * [Rainbow.onHighlight](#rainbowonhighlight)
    * [Rainbow.remove](#rainbowremove)
  * [Building](#building)
    * [Getting a local environment set up](#getting-a-local-environment-set-up)
    * [Build commands](#build-commands)
      * [gulp build](#gulp-build)
      * [gulp lint](#gulp-lint)
      * [gulp pack](#gulp-pack)
      * [gulp sass](#gulp-sass)
      * [gulp test](#gulp-test)
      * [gulp watch](#gulp-watch)
  * [More Info](#more-info)

## Quick Start

### Browser

1. Include some markup for code you want to be highlighted:

    ```html
    <pre><code data-language="python">def openFile(path):
        file = open(path, "r")
        content = file.read()
        file.close()
        return content</code></pre>
    ```

2. Include a CSS theme file in the ``<head>``:

    ```html
    <link href="/assets/css/theme.css" rel="stylesheet" type="text/css">
    ```

3. Include rainbow.js and whatever languages you want before the closing ``</body>``:

    ```html
    <script src="/assets/js/rainbow.js"></script>
    <script src="/assets/js/language/generic.js"></script>
    <script src="/assets/js/language/python.js"></script>
    ```

By default `dist/rainbow.min.js` comes with some popular languages bundled together with it.

### Node.js

Rainbow 2.0 introduced support for node.js. All of the existing API methods should work, but there is also a new `Rainbow.colorSync` method for synchronous highlighting.

#### Install rainbow

```
npm install --save rainbow-code
```

#### Highlight some code

```javascript
var rainbow = require('rainbow-code');
var highlighted = rainbow.colorSync('// So meta\nrainbow.colorSync(\'var helloWorld = true;\');', 'javascript');
console.log(highlighted);
```

## Supported Browsers

Rainbow 2.0 should work in the following browsers:

| Chrome | Firefox | IE | Safari |
| ------ | ------- | --- | ------ |
| 20+ | 13+ | 10+ | 6+ |

For older browsers you can download the legacy [1.2.0](https://github.com/ccampbell/rainbow/archive/1.2.0.zip) release.

## Supported Languages

Currently supported languages are:
- C
- C#
- Coffeescript
- CSS
- D
- Go
- Haskell
- HTML
- Java
- JavaScript
- JSON
- Lua
- PHP
- Python
- R
- Ruby
- Scheme
- Shell
- Smalltalk

## Specifying a language

In your markup the `data-language` attribute is used to specify what language to use for highlighting. For example:

```html
<pre><code data-language="javascript">var testing = true;</code></pre>
```

Rainbow also supports the HTML5 style for specifying languages:

```html
<pre><code class="language-javascript">var testing = true;</code></pre>
```

And the Google prettify style:

```html
<pre class="lang-javascript"><code>var testing = true;</code></pre>
```

## Themes

Themes are located in the `themes/sass` directory. They are written using sass so that common logic can be shared among all themes without having to duplicate it in each theme file. You should not edit the css files directly.

`_base.sass` includes some default styles shared by almost every theme. `_init.sass` contains mixins and initialization logic that is shared by every theme.

### Rendering code blocks

As of version 2.0 the themes use a clever trick to display the highlighted code. All code blocks default to `opacity: 0`, but an animation is triggered on page load to happen after a 2 second delay.

This means for users who do not have JavaScript enabled the code will fade in after 2 seconds. If JavaScript is enabled, the animation is stopped on load and the delay is reset to `0s`. That ensures that as soon as the code is done being highlighted it will be able to show up instantly. This is used to prevent a flash of unstyled text on page load and ensure that the code blocks only show up after they have been highlighted.

There is also a preload animation that will show up for any code block that takes longer than 300ms to load.

### Adding custom rules for specific languages

A SASS mixin was added to simplify defining styles that should only apply for a specific language. Using it looks like this:

```sass
@include language("html")
    .support.operator
        color: #fff

@include language(("javascript", "js"))
    .variable.super
        color: #66D9EF
```

You can pass a single language or a list of languages.

## JavaScript API Documentation

Rainbow has four public methods:

- [Rainbow.color](#rainbowcolor)
- [Rainbow.extend](#rainbowextend)
- [Rainbow.addAlias](#rainbowaddalias)
- [Rainbow.onHighlight](#rainbowonhighlight)
- [Rainbow.remove](#rainbowremove)

### Rainbow.color

Rainbow.color is used to highlight blocks of code.

For convenience, this method is called automatically to highlight all code blocks on the page when `DOMContentLoaded` fires.  If you would like to highlight stuff that is not in the DOM you can use it on its own.  There are three ways to use it.

1. The first option is calling the color method on its own:

    ```javascript
    Rainbow.color();
    ```

    Each time this is called, Rainbow will look for matching `pre` blocks on the page that have not yet been highlighted and highlight them.

    You can optionally pass a callback function that will fire when all the blocks have been highlighted.

    ```javascript
    Rainbow.color(function() {
        console.log('The new blocks are now highlighted!');
    });
    ```

2. The second option is passing a specific element to the color method.

    In this example we are creating a code block, highlighting it, then inserting it into the DOM:

    ```javascript
    var div = document.createElement('div');
    div.innerHTML = '<pre><code data-language="javascript">var foo = true;</code></pre>';
    Rainbow.color(div, function() {
        document.getElementById('something-else').appendChild(div;)
    });
    ```

3. The final option is passing in your code as a string to `Rainbow.color`.

    ```javascript
    Rainbow.color('var foo = true;', 'javascript', function(highlightedCode) {
        console.log(highlightedCode);
    });
    ```

#### Preventing automatic highlighting on page load

If you want to prevent code on the page from being highlighted when the page loads you can set the `defer` property to `true`.

```javascript
Rainbow.defer = true;
```

Note that you have to set this before `DOMContentLoaded` fires or else it will not do anything.

#### Extra options for color

As of right now there is one extra option for color.

##### globalClass

This option allows you to have an extra class added to every span that Rainbow renders. This can be useful if you want to remove the classes in order to trigger a special effect of some sort.

To apply a global class you can add it in your markup:

```html
<pre><code data-language="javascript" data-global-class="animate">var hello = true;</code></pre>
```

Or you can pass it into a `Rainbow.color` call like this:

```javascript
Rainbow.color('var hello = true;', {
    language: 'javascript',
    globalClass: 'animate'
});
```

### Rainbow.extend

Rainbow.extend is used to define language grammars which are used to highlight the code you pass in. It can be used to define new languages or to extend existing languages.

A very simple language grammer looks something like this:

```javascript
Rainbow.extend('example', [
    {
        name: 'keyword',
        pattern: /function|return|continue|break/g
    }
]);
```

Any pattern used with extend will take precedence over an existing pattern that matches the same block.  It will also take precedence over any pattern that is included as part of the generic patterns.

For example if you were to call

```javascript
Rainbow.extend('example', [
    {
        name: 'keyword.magic',
        pattern: /function/g
    }
]);
```

This would mean that function will be highlighted as `<span class="keyword magic">function</span>`, but `return`, `continue`, and `break` will still be highlighted as just `<span class="keyword">return</span>`, etc.

#### Extending existing languages

By default languages are considered to be standalone, but if you specify an optional third parameter you can have your language inherit from another one.

For example the python language grammars inherit from the generic ones:

```javascript
Rainbow.extend('python', [
    {
        name: 'constant.language',
        pattern: /True|False|None/g
    }
], 'generic');
```

If you wanted to remove the default boolean values you should be able to do something like this:

```javascript
Rainbow.extend('python', [
    {
        name: '',
        pattern: /true|false/g
    }
]);
```

#### How code is highlighted

The `name` value determines what classes will be added to a span that matches the pattern you specify. For example, if you name a pattern `constant.hex-color` the code that matches that pattern will be wrapped in `<span class="constant hex-color></span>`. This allows you to share common base styles but add more customization in your themes for more specific matches.

#### How grammars are defined

##### Match by name

The simplest way to define a grammar is to define a regular expression and a name to go along with that.

```javascript
Rainbow.extend([
    {
        name: 'constant.boolean',
        pattern: /true|false/g
    }
]);
```

##### Match by group

This allows you to take a more complicated regular expression and map certain parts of it to specific scopes.

```javascript
Rainbow.extend([
    {
        matches: {
            1: 'constant.boolean.true',
            2: 'constant.boolean.false'
        },
        pattern: /(true)|(false)/g
    }
]);
```

##### Match by array of sub-patterns

For more complicated matches you may want to process code within another match group.

```javascript
Rainbow.extend([
    {
        matches: [
            {
                name: 'constant.boolean.true',
                pattern: /true/
            },
            {
                name: 'constant.boolean.false',
                pattern: /false/
            }
        ],
        pattern: /true|false/g
    }
]);
```

##### Match using another language

Sometimes a language supports other languages being embedded inside of it such as JavaScript inside HTML. Rainbow supports that out of the box. Here is an example of how you would highlight PHP tags inside of HTML code.

```javascript
Rainbow.extend('html', [
    {
        name: 'source.php.embedded',
        matches: {
            2: {
                language: 'php'
            }
        },
        pattern: /&lt;\?(php)?([\s\S]*?)(\?&gt;)/gm
    }
]);
```

You should be able to nest sub-patterns as many levels deep as you would like.

#### Extending an existing language

If you have a language specific pattern that you want highlighted, but it does not exist in the language syntax rules, you can add a rule in your own javascript.

Let's say for example you want to highlight PHP's apc functions.
You can include the php language then in the markup on your page add:

```html
<script>
    Rainbow.extend('php', [
        {
            'matches': {
                1: 'support.function'
            },
            'pattern': /\b(apc_(store|fetch|add|inc))(?=\()/g
        }
    ]);
</script>
```

#### How Rainbow chooses a match

In general the best practice is to make your patterns as specific as possible (for example targetting specific keywords).

When you create a new language it gets pushed to the front of whatever language it is inheriting from.  This means whatever rules are added last will be checked against first.

Rainbow chooses the first match it finds for a block.  If another pattern overlaps with a pattern that has already been chosen then it is ignored.

There is one exception to this.  If a match that comes later is more specific (the start AND end points stretch beyond another pattern already matched) then the new match will take precedence and the old one will be discarded.

That means if you have a pattern that matches `function test()` and you add a pattern that matches `public function test()` the new one will be used instead.

#### Known limitations

##### Regular expressions lookbehind assertions

Javascript does not allow positive or negative lookbehind assertions so this means it is possible to have conflicts with the starting and end positions of matches. If you want to match a pattern that ends with a specific character it is recommended that you use a positive lookahead for that character instead of including it in the regex. That allows the same character to be used at the start of another match group without overlapping.

##### Regular expression subgroup matches

You cannot match part of a subgroup directly to a scope. For example if you have:

```javascript
{
    matches: {
        1: 'name.attribute',
        2: 'value'
    },
    pattern: /(name=\"(.*?)\")/g
}
```

This will result in code `name="value"` being highlighted as:

```html
<span class="name attribute">name="value"</span>
```

You see the value class never gets applied.

To achieve what you really want you would have to use a subpattern like this:

```javascript
{
    name: 'name.attribute',
    matches: [{
        matches: {
            1: 'value'
        },
        pattern: /\"(.*?)\"/g
    }],
    pattern: /(name=\"(.*?)\")/g
}
```

This means the entire block is wrapped with `name.attribute` scope and then within that any part in double quotes will be wrapped as `value`.

That means the entire block will behighlighted as

```html
<span class="name attribute">name="<span class="value">value</span>"</span>
```

In this example you could avoid subpatterns completely by using a regex like this to begin with:

```javascript
/(name=)\"(.*?)\"/g
```

### Rainbow.addAlias

The addAlias function allows you to map a different name to a language. For example:

```javascript
Rainbow.addAlias('js', 'javascript');
```

This allows you to highlight javascript code by using the language `js` instead of `javascript`.

### Rainbow.onHighlight

This method notifies you as soon as a block of code has been highlighted.

```javascript
Rainbow.onHighlight(function(block, language) {
    console.log(block, 'for language', language, 'was highlighted');
});
```

The first parameter returns a reference to that code block in the DOM. The second parameter returns a string of the language being highlighted.

### Rainbow.remove

This method allows you to remove syntax rules for a specific language. It is only really useful for development if you want to be able to reload language grammars on the fly without having to refresh the page.

```javascript
// Remove all the javascript patterns
Rainbow.remove('javascript');
```

## Building

Rainbow is compiled using [rollup](https://github.com/rollup/rollup) and [buble](https://gitlab.com/Rich-Harris/buble).

[Gulp](https://github.com/gulpjs/gulp) is used for all build related tasks.

### Getting a local environment set up

```shell
git clone git@github.com:ccampbell/rainbow.git
cd rainbow
npm install
```

### Build commands

#### gulp build

The build command is used to build a custom version of rainbow.js. If you run

```shell
gulp build
```

A file will be created at `dist/rainbow-custom.min.js` containing rainbow.js as well as popular languages. If you want to specify specific languages you can use:

```shell
gulp build --languages=html,css,php,javascript
```

If you want a minimized version of rainbow without any languages you can pass

```shell
gulp build --languages=none
```

If you want a minimized version with all languages you can pass

```shell
gulp build --languages=all
```

#### gulp lint

The lint command will check all the javascript files for things that do not match the styleguide from the `.eslintrc` file.

#### gulp pack

The pack command will run a buble + rollup build and save the resulting file to `dist/rainbow.js`

#### gulp sass

The sass command will compile all the rainbow themes

#### gulp test

The test command will run the unit tests. You can pass the `--watch` flag to keep the tests running and have them rerun when you make changes. That is a little buggy though which has something to do with karma + rollup.

You can also use the `--browsers` flag to specify a browser to run the tests in. Currently only `PhantomJS` and `Chrome` are supported.

#### gulp watch

The watch command will look at sass files and src js files and build the css or js (using `gulp sass` and `gulp pack`) every time you make a change.

## More Info

If you are looking for line number support you can try one of the following:
- https://github.com/Blender3D/rainbow.linenumbers.js
- https://github.com/Sjeiti/rainbow.linenumbers

You can check out demos and build custom packages at [rainbowco.de](http://rainbowco.de).
