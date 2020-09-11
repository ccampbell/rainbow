const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'haskell';

export function testHaskell(t) {
    run(
        t,

        language,

        '-- comments',

        '-- fn2 :: String -> [String]',

        '<span class="comment">-- fn2 :: String -&gt; [String]</span>'
    );

    run(
        t,

        language,

        '{-- comments --}',

        '{-- this is a comment --}',

        '<span class="comment">{-- this is a comment --}</span>'
    );

    run(
        t,

        language,
        '{-- comments with multiple lines --}',

        `{--
          this is a comment
        --}`,

        `<span class="comment">{--
          this is a comment
        --}</span>`
    );

    run(
        t,

        language,

        'module declaration',

        'module A where',

        '<span class="keyword">module</span> <span class="entity class">A</span> <span class="keyword">where</span>'
    );

    run(
        t,

        language,

        'module with exported functions and comments',

        `module A (
          B,
          C(..),
          fn1,
          fn2, -- fn2 :: String -&gt; [String]
          fn3
        ) where`,

        `<span class="keyword">module</span> <span class="entity class">A</span> (
          <span class="entity class">B</span>,
          <span class="entity class">C</span>(<span class="keyword operator">.</span><span class="keyword operator">.</span>),
          fn1,
          fn2, <span class="comment">-- fn2 :: String -&gt; [String]</span>
          fn3
        ) <span class="keyword">where</span>`
    );

    run(
        t,

        language,

        'import',

        `import Data.List qualified DL
        import Prelude hiding ((*))`,

        `<span class="keyword">import</span> <span class="entity class">Data</span><span class="keyword operator">.</span><span class="entity class">List</span> <span class="keyword">qualified</span> <span class="entity class">DL</span>
        <span class="keyword">import</span> <span class="entity class">Prelude</span> <span class="keyword">hiding</span> ((<span class="keyword operator">*</span>))`
    );

    run(
        t,

        language,

        'function declaration',

        'fn :: String -> [(String,Int)]',

        'fn <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">String</span> <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> [(<span class="entity class">String</span>,<span class="entity class">Int</span>)]'
    );

    run(
        t,

        language,

        'IO function declaration',

        `getLine :: IO String
        getLine = do c <- getChar
                     if c == '\\n' then return ""
                                  else do s <- getLine
                                          return (c:s)`,

        `getLine <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">IO</span> <span class="entity class">String</span>
        getLine <span class="keyword operator">=</span> <span class="keyword">do</span> c <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> getChar
                     <span class="keyword">if</span> c <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="string">'\\n'</span> <span class="keyword">then</span> <span class="keyword">return</span> <span class="string">""</span>
                                  <span class="keyword">else</span> <span class="keyword">do</span> s <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> getLine
                                          <span class="keyword">return</span> (c<span class="keyword operator">:</span>s)`
    );

    run(
        t,

        language,

        'infix declaration',

        'infix 4 >*',

        '<span class="keyword">infix</span> 4 <span class="keyword operator">&gt;</span><span class="keyword operator">*</span>'
    );

    run(
        t,

        language,

        'let declaration',

        `let a' = s :: String
        in a' \"some string\"`,

        `<span class="keyword">let</span> a' <span class="keyword operator">=</span> s <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">String</span>
        <span class="keyword">in</span> a' <span class="string">"some string"</span>`
    );

    run(
        t,

        language,

        'if declaration',

        `if a == 0
        then A
        else B`,

        `<span class="keyword">if</span> a <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="constant numeric">0</span>
        <span class="keyword">then</span> <span class="entity class">A</span>
        <span class="keyword">else</span> <span class="entity class">B</span>`
    );

    run(
        t,

        language,

        'data types decaration',

        `data S = S1 { x :: Int }
               | S2 { x :: Int }
               deriving (Show, Eq)

        newtype NString = [String]

        type String = [Char]`,

        `<span class="keyword">data</span> <span class="entity class">S</span> <span class="keyword operator">=</span> <span class="entity class">S1</span> { x <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">Int</span> }
               <span class="keyword operator">|</span> <span class="entity class">S2</span> { x <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">Int</span> }
               <span class="keyword">deriving</span> (<span class="entity class">Show</span>, <span class="entity class">Eq</span>)

        <span class="keyword">newtype</span> <span class="entity class">NString</span> <span class="keyword operator">=</span> [<span class="entity class">String</span>]

        <span class="keyword">type</span> <span class="entity class">String</span> <span class="keyword operator">=</span> [<span class="entity class">Char</span>]`
    );

    run(
        t,

        language,

        'classes',

        `class Eq a where
              (==), (/=) :: a -&gt; a -&gt; Bool

              x /= y  = not (x == y)
              x == y  = not (x /= y)`,

        `<span class="keyword">class</span> <span class="entity class">Eq</span> a <span class="keyword">where</span>
              (<span class="keyword operator">=</span><span class="keyword operator">=</span>), (<span class="keyword operator">/=</span>) <span class="keyword operator">:</span><span class="keyword operator">:</span> a <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> a <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">Bool</span>

              x <span class="keyword operator">/=</span> y  <span class="keyword operator">=</span> not (x <span class="keyword operator">=</span><span class="keyword operator">=</span> y)
              x <span class="keyword operator">=</span><span class="keyword operator">=</span> y  <span class="keyword operator">=</span> not (x <span class="keyword operator">/=</span> y)`
    );

    run(
        t,

        language,

        'instances',

        `instance Monad IO where
          fail s = ioError (userError s)`,

        `<span class="keyword">instance</span> <span class="entity class">Monad</span> <span class="entity class">IO</span> <span class="keyword">where</span>
          fail s <span class="keyword operator">=</span> ioError (userError s)`
    );

    run(
        t,

        language,

        'list comprehensions',

        '[ x | x &lt;- x, x &lt;- x ]',

        '[ x <span class="keyword operator">|</span> x <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> x, x <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> x ]'
    );

    run(
        t,

        language,

        'case statement',

        `case e of
          A -&gt; Just a
          _ -&gt; Nothing`,

        `<span class="keyword">case</span> e <span class="keyword">of</span>
          <span class="entity class">A</span> <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">Just</span> a
          _ <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">Nothing</span>`
    );

    run(
        t,

        language,

        'C Preprocessors',

`#ifndef __NHC__
exitWith :: ExitCode -> IO a
exitWith ExitSuccess = throwIO ExitSuccess
exitWith code@(ExitFailure n)
  | n /= 0 = throwIO code
#ifdef __GLASGOW_HASKELL__
  | otherwise = ioError (IOError Nothing InvalidArgument "exitWith" "ExitFailure 0" Nothing Nothing)
#endif
#endif  /* ! __NHC__ */`,

`<span class="meta preprocessor">#<span class="keyword define">ifndef</span> <span class="entity name">__NHC__</span></span>
exitWith <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">ExitCode</span> <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">IO</span> a
exitWith <span class="entity class">ExitSuccess</span> <span class="keyword operator">=</span> throwIO <span class="entity class">ExitSuccess</span>
exitWith code<span class="keyword operator">@</span>(<span class="entity class">ExitFailure</span> n)
  <span class="keyword operator">|</span> n <span class="keyword operator">/=</span> <span class="constant numeric">0</span> <span class="keyword operator">=</span> throwIO code
<span class="meta preprocessor">#<span class="keyword define">ifdef</span> <span class="entity name">__GLASGOW_HASKELL__</span></span>
  <span class="keyword operator">|</span> <span class="keyword">otherwise</span> <span class="keyword operator">=</span> ioError (<span class="entity class">IOError</span> <span class="entity class">Nothing</span> <span class="entity class">InvalidArgument</span> <span class="string">"exitWith"</span> <span class="string">"ExitFailure 0"</span> <span class="entity class">Nothing</span> <span class="entity class">Nothing</span>)
<span class="meta preprocessor">#<span class="keyword define">endif</span></span>
<span class="meta preprocessor">#<span class="keyword define">endif</span>  /* ! __NHC__ */</span>`
    );
}
