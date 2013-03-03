# Rainbow

Rainbow is a code syntax highlighting library written in Javascript.

It was designed to be lightweight (1.4kb), easy to use, and extendable.

It is completely themable via CSS.

If you would like to donate to help support Rainbow development use [Gittip](https://www.gittip.com/ccampbell).

## Quick Start

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
    <script src="/assets/js/rainbow.min.js"></script>
    <script src="/assets/js/language/generic.js"></script>
    <script src="/assets/js/language/python.js"></script>
    ```

## Extending Rainbow
If you have a language specific pattern that you want highlighted, but it does not exist in the language syntax rules you can add a rule on your page.

Let's say for example you want to reference PHP's apc functions.
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
- Javascript
- Lua
- PHP
- Python
- R
- Ruby
- Scheme
- Shell
- Smalltalk

## Building

Rainbow gets minified with the closure compiler. You can install it on OS X via Homebrew:

    brew install closure-compiler

To build a minified version of your changes, you can run the compile script:

    ./util/compile.py --core

In case the compiler cannot be found (which is the case if you installed via Homebrew),
you will have to specify the path to the compiler.jar (see `brew info closure-compiler`) -
here's an example:

    CLOSURE_COMPILER=/usr/local/Cellar/closure-compiler/20120710/libexec/build/compiler.jar util/compile.py --core

If you want to build a custom version, list the languages you would like to include as
command line arguments:

    util/compile.py ruby javascript

## More Info

If you are looking for line number support you can try one of the following:
- https://github.com/Blender3D/rainbow.linenumbers.js
- https://github.com/Sjeiti/rainbow.linenumbers

You can check out additional documentation and build custom packages at [rainbowco.de](http://rainbowco.de).
