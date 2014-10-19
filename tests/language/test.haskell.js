/* global describe, run */
var language = 'haskell';

describe(language, function() {
    run(
        language,
        'line comments',
        '-- fn2 :: String -> [String]',
        '<span class="comment">-- fn2 :: String -&gt; [String]</span>'
    );

    run(
        language,
        'block comments',
        '{-- this is a comment --}',
        '<span class="comment">{-- this is a comment --}</span>'
    );

    run(
        language,
        'block comments with multiple lines',
        '{--\n' +
        '  this is a comment\n' +
        '--}',
        '<span class="comment">{--\n  this is a comment\n--}</span>'
    );

    run(
        language,
        'pragmas',
        '{-# LANGUAGE ForeignFunctionInterface, CPP #-}',
        '<span class="meta preprocessor">{-# <span class="keyword define">LANGUAGE</span> <span class="entity name">ForeignFunctionInterface</span>, <span class="entity name">CPP</span> #-}</span>'
    );

    //TODO: bug? it does not parse/tokenize 'where'.
    run(
        language,
        'haskell pragma in module',
        'module Test.ModuleA {-# DEPRECATED "Use Wobble instead" #-} where',
        '<span class="keyword">module</span> <span class="entity class">Test.ModuleA</span> <span class="meta preprocessor">{-# <span class="keyword define">DEPRECATED</span> <span class="constant string">"Use Wobble instead"</span> #-}</span> where'
    );

    run(
        language,
        'module declaration',
        'module A where',
        '<span class="keyword">module</span> <span class="entity class">A</span> <span class="keyword">where</span>'
    );

    run(
        language,
        'full module declaration',
        'module A (\n' +
        '  B,\n' +
        '  C(..),\n' +
        '  fn1,\n' +
        '  fn2, -- fn2 :: String -&gt; [String]\n' +
        '  fn3\n' +
        ') where',
        '<span class="keyword">module</span> <span class="entity class">A</span> (\n  <span class="entity class">B</span>,\n  <span class="entity class">C</span>(<span class="keyword operator">.</span><span class="keyword operator">.</span>),\n  fn1,\n  fn2, <span class="comment">-- fn2 :: String -&gt; [String]</span>\n  fn3\n) <span class="keyword">where</span>'
    );

    run(
        language,
        'import',
        'import Prelude hiding ((*))',
        '<span class="keyword">import</span> <span class="entity class">Prelude</span> <span class="keyword">hiding</span> ((<span class="keyword operator">*</span>))'
    );

    run(
        language,
        'import qualified',
        'import Data.List qualified DL',
        '<span class="keyword">import</span> <span class="entity class">Data.List</span> <span class="keyword">qualified</span> <span class="entity class">DL</span>'
    );

    run(
        language,
        'function type signature',
        'fn :: String -> [(String,Int)]',
        'fn <span class="keyword operator">::</span> <span class="entity class">String</span> <span class="keyword operator">-&gt;</span> [(<span class="entity class">String</span>,<span class="entity class">Int</span>)]'
    );

    run(
        language,
        'IO function declaration',
        'getLine = do c <- getChar\n' +
        '             if c == \'\\n\' then return ""\n' +
        '                          else do s <- getLine\n' +
        '                                  return (c:s)',
        'getLine <span class="keyword operator">=</span> <span class="keyword">do</span> c <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> getChar\n             <span class="keyword">if</span> c <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="string">\'\\n\'</span> <span class="keyword">then</span> <span class="keyword">return</span> <span class="string">""</span>\n                          <span class="keyword">else</span> <span class="keyword">do</span> s <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> getLine\n                                  <span class="keyword">return</span> (c<span class="keyword operator">:</span>s)'
    );

    run(
        language,
        'infix declaration',
        'infix 4 >*',
        '<span class="keyword">infix</span> 4 <span class="keyword operator">&gt;</span><span class="keyword operator">*</span>'
    );

    run(
        language,
        'let declaration',
        'let a\' = s :: String\n' +
        'in a\' \"some string\"',
        '<span class="keyword">let</span> a\' <span class="keyword operator">=</span> s <span class="keyword operator">::</span> <span class="entity class">String</span>\n<span class="keyword">in</span> a\' <span class="string">"some string"</span>'
    );

    run(
        language,
        'if declaration',
        'if a == 0 then A else B',
        '<span class="keyword">if</span> a <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="constant numeric">0</span> <span class="keyword">then</span> <span class="entity class">A</span> <span class="keyword">else</span> <span class="entity class">B</span>'
    );

    run(
        language,
        'data types decaration',
        'data S = S1 { x :: Int }\n' +
        '       | S2 { x :: Int }\n' +
        '       deriving (Show, Eq)',
        '<span class="keyword">data</span> <span class="entity class">S</span> <span class="keyword operator">=</span> <span class="entity class">S1</span> { x <span class="keyword operator">::</span> <span class="entity class">Int</span> }\n       <span class="keyword operator">|</span> <span class="entity class">S2</span> { x <span class="keyword operator">::</span> <span class="entity class">Int</span> }\n       <span class="keyword">deriving</span> (<span class="entity class">Show</span>, <span class="entity class">Eq</span>)'
    );

    run(
        language,
        'newtypes decaration',
        'newtype NString = [String]',
        '<span class="keyword">newtype</span> <span class="entity class">NString</span> <span class="keyword operator">=</span> [<span class="entity class">String</span>]'
    );

    run(
        language,
        'types decaration',
        'type String = [Char]',
        '<span class="keyword">type</span> <span class="entity class">String</span> <span class="keyword operator">=</span> [<span class="entity class">Char</span>]'
    );

    run(
        language,
        'classes',
        'class Eq a where\n' +
        '      (==), (/=) :: a -&gt; a -&gt; Bool\n\n' +
        '      x /= y  = not (x == y)\n' +
        '      x == y  = not (x /= y)',
        '<span class="keyword">class</span> <span class="entity class">Eq</span> a <span class="keyword">where</span>\n      (<span class="keyword operator">=</span><span class="keyword operator">=</span>), (<span class="keyword operator">/=</span>) <span class="keyword operator">::</span> a <span class="keyword operator">-&gt;</span> a <span class="keyword operator">-&gt;</span> <span class="entity class">Bool</span>\n\n      x <span class="keyword operator">/=</span> y  <span class="keyword operator">=</span> not (x <span class="keyword operator">=</span><span class="keyword operator">=</span> y)\n      x <span class="keyword operator">=</span><span class="keyword operator">=</span> y  <span class="keyword operator">=</span> not (x <span class="keyword operator">/=</span> y)'
    );

    run(
        language,
        'instances',
        'instance Monad IO where\n' +
        '  fail s = ioError (userError s)',
        '<span class="keyword">instance</span> <span class="entity class">Monad</span> <span class="entity class">IO</span> <span class="keyword">where</span>\n  fail s <span class="keyword operator">=</span> ioError (userError s)'
    );

    run(
        language,
        'list comprehensions',
        '[ x | x &lt;- x, x &lt;- x ]',
        '[ x <span class="keyword operator">|</span> x <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> x, x <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> x ]'
    );

    run(
        language,
        'case statement',
        'case e of\n' +
        '  A -&gt; Just a\n' +
        '  _ -&gt; Nothing',
        '<span class="keyword">case</span> e <span class="keyword">of</span>\n  <span class="entity class">A</span> <span class="keyword operator">-&gt;</span> <span class="entity class">Just</span> a\n  _ <span class="keyword operator">-&gt;</span> <span class="entity class">Nothing</span>'
    );

    run(
        language,
        'C Preprocessor (ifdef)',
        '#ifdef __GLASGOW_HASKELL__',
        '<span class=\"meta preprocessor\">#<span class=\"keyword define\">ifdef</span> <span class=\"entity name\">__GLASGOW_HASKELL__</span></span>'
    );

    run(
        language,
        'C Preprocessors (else)',
        '#else',
        '<span class=\"meta preprocessor\">#<span class=\"keyword define\">else</span></span>'
    );

    run(
        language,
        'C Preprocessors (endif)',
        '#endif',
        '<span class=\"meta preprocessor\">#<span class=\"keyword define\">endif</span></span>'
    );
});
