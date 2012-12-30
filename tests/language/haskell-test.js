/**
 * Haskell tests
 *
 * @author Bruno Dias
 */
RainbowTester.startTest('haskell');

// RainbowTester.run(
// 	'label',
// 	'test',
// 	'should be'
// );

RainbowTester.run(
	'-- comments',
	'-- fn2 :: String -> [String]',
	'<span class="comment">-- fn2 :: String -&gt; [String]</span>'
);

RainbowTester.run(
	'{-- comments --}',
	'{-- this is a comment --}',
	'<span class="comment">{-- this is a comment --}</span>'
);

RainbowTester.run(
	'{-- comments with multiple lines --}',
	'{--\n' +
	'  this is a comment\n' +
	'--}',
	'<span class="comment">{--\n  this is a comment\n--}</span>'
);

RainbowTester.run(
	'module declaration',
	'module A where',
	'<span class="keyword">module</span> <span class="entity class">A</span> <span class="keyword">where</span>'
);

RainbowTester.run(
	'module with exported functions and comments',
	'module A (\n' +
	'  B,\n' +
	'  C(..),\n' +
	'  fn1,\n' +
	'  fn2, -- fn2 :: String -&gt; [String]\n' +
	'  fn3\n' +
	') where',
	'<span class="keyword">module</span> <span class="entity class">A</span> (\n  <span class="entity class">B</span>,\n  <span class="entity class">C</span>(<span class="keyword operator">.</span><span class="keyword operator">.</span>),\n  fn1,\n  fn2, <span class="comment">-- fn2 :: String -&gt; [String]</span>\n  fn3\n) <span class="keyword">where</span>'
);

RainbowTester.run(
	'import',
	'import Data.List qualified DL\n' +
	'import Prelude hiding ((*))',
	'<span class="keyword">import</span> <span class="entity class">Data</span><span class="keyword operator">.</span><span class="entity class">List</span> <span class="keyword">qualified</span> <span class="entity class">DL</span>\n<span class="keyword">import</span> <span class="entity class">Prelude</span> <span class="keyword">hiding</span> ((<span class="keyword operator">*</span>))'
);

RainbowTester.run(
	'function declaration',
	'fn :: String -> [(String,Int)]',
	'fn <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">String</span> <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> [(<span class="entity class">String</span>,<span class="entity class">Int</span>)]'
);

RainbowTester.run(
	'IO function declaration',
	'getLine :: IO String\n' +
	'getLine = do c <- getChar\n' +
	'             if c == \'\\n\' then return ""\n' +
	'                          else do s <- getLine\n' +
	'                                  return (c:s)',
	'getLine <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">IO</span> <span class="entity class">String</span>\ngetLine <span class="keyword operator">=</span> <span class="keyword">do</span> c <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> getChar\n             <span class="keyword">if</span> c <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="string">\'\\n\'</span> <span class="keyword">then</span> <span class="keyword">return</span> <span class="string">""</span>\n                          <span class="keyword">else</span> <span class="keyword">do</span> s <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> getLine\n                                  <span class="keyword">return</span> (c<span class="keyword operator">:</span>s)'
);

RainbowTester.run(
	'infix declaration',
	'infix 4 >*',
	'<span class="keyword">infix</span> 4 <span class="keyword operator">&gt;</span><span class="keyword operator">*</span>'
);

RainbowTester.run(
	'let declaration',
	'let a\' = s :: String\n' +
	'in a\' \"some string\"',
	'<span class="keyword">let</span> a\' <span class="keyword operator">=</span> s <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">String</span>\n<span class="keyword">in</span> a\' <span class="string">"some string"</span>'
);

RainbowTester.run(
	'if declaration',
	'if a == 0\n' +
	'then A\n' +
	'else B',
	'<span class="keyword">if</span> a <span class="keyword operator">=</span><span class="keyword operator">=</span> <span class="constant numeric">0</span>\n<span class="keyword">then</span> <span class="entity class">A</span>\n<span class="keyword">else</span> <span class="entity class">B</span>'
);

RainbowTester.run(
	'data types decaration',
	'data S = S1 { x :: Int }\n' +
	'       | S2 { x :: Int }\n' +
	'       deriving (Show, Eq)\n\n' +
	'newtype NString = [String]\n\n' +
	'type String = [Char]',
	'<span class="keyword">data</span> <span class="entity class">S</span> <span class="keyword operator">=</span> <span class="entity class">S1</span> { x <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">Int</span> }\n       <span class="keyword operator">|</span> <span class="entity class">S2</span> { x <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">Int</span> }\n       <span class="keyword">deriving</span> (<span class="entity class">Show</span>, <span class="entity class">Eq</span>)\n\n<span class="keyword">newtype</span> <span class="entity class">NString</span> <span class="keyword operator">=</span> [<span class="entity class">String</span>]\n\n<span class="keyword">type</span> <span class="entity class">String</span> <span class="keyword operator">=</span> [<span class="entity class">Char</span>]'
);

RainbowTester.run(
	'classes',
	'class Eq a where\n' +
	'      (==), (/=) :: a -&gt; a -&gt; Bool\n\n' +
	'      x /= y  = not (x == y)\n' +
	'      x == y  = not (x /= y)',
	'<span class="keyword">class</span> <span class="entity class">Eq</span> a <span class="keyword">where</span>\n      (<span class="keyword operator">=</span><span class="keyword operator">=</span>), (<span class="keyword operator">/=</span>) <span class="keyword operator">:</span><span class="keyword operator">:</span> a <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> a <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">Bool</span>\n\n      x <span class="keyword operator">/=</span> y  <span class="keyword operator">=</span> not (x <span class="keyword operator">=</span><span class="keyword operator">=</span> y)\n      x <span class="keyword operator">=</span><span class="keyword operator">=</span> y  <span class="keyword operator">=</span> not (x <span class="keyword operator">/=</span> y)'
);

RainbowTester.run(
	'instances',
	'instance Monad IO where\n' +
	'  fail s = ioError (userError s)',
	'<span class="keyword">instance</span> <span class="entity class">Monad</span> <span class="entity class">IO</span> <span class="keyword">where</span>\n  fail s <span class="keyword operator">=</span> ioError (userError s)'
);

RainbowTester.run(
	'list comprehensions',
	'[ x | x &lt;- x, x &lt;- x ]',
	'[ x <span class="keyword operator">|</span> x <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> x, x <span class="keyword operator">&lt;</span><span class="keyword operator">-</span> x ]'  
);

RainbowTester.run(
	'case statement',
	'case e of\n' + 
	'  A -&gt; Just a\n' +
	'  _ -&gt; Nothing',
	'<span class="keyword">case</span> e <span class="keyword">of</span>\n  <span class="entity class">A</span> <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">Just</span> a\n  _ <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">Nothing</span>'
);

RainbowTester.run(
	'C Preprocessors',
	'#ifndef __NHC__\n' +
	'exitWith :: ExitCode -> IO a\n' +
	'exitWith ExitSuccess = throwIO ExitSuccess\n' +
	'exitWith code@(ExitFailure n)\n' +
	'  | n /= 0 = throwIO code\n' +
	'#ifdef __GLASGOW_HASKELL__\n' +
	'  | otherwise = ioError (IOError Nothing InvalidArgument "exitWith" "ExitFailure 0" Nothing Nothing)\n' +
	'#endif\n' +
	'#endif  /* ! __NHC__ */',
	'<span class="meta preprocessor">#<span class="keyword define">ifndef</span> <span class="entity name">__NHC__</span></span>\nexitWith <span class="keyword operator">:</span><span class="keyword operator">:</span> <span class="entity class">ExitCode</span> <span class="keyword operator">-</span><span class="keyword operator">&gt;</span> <span class="entity class">IO</span> a\nexitWith <span class="entity class">ExitSuccess</span> <span class="keyword operator">=</span> throwIO <span class="entity class">ExitSuccess</span>\nexitWith code<span class="keyword operator">@</span>(<span class="entity class">ExitFailure</span> n)\n  <span class="keyword operator">|</span> n <span class="keyword operator">/=</span> <span class="constant numeric">0</span> <span class="keyword operator">=</span> throwIO code\n<span class="meta preprocessor">#<span class="keyword define">ifdef</span> <span class="entity name">__GLASGOW_HASKELL__</span></span>\n  <span class="keyword operator">|</span> <span class="keyword">otherwise</span> <span class="keyword operator">=</span> ioError (<span class="entity class">IOError</span> <span class="entity class">Nothing</span> <span class="entity class">InvalidArgument</span> <span class="string">"exitWith"</span> <span class="string">"ExitFailure 0"</span> <span class="entity class">Nothing</span> <span class="entity class">Nothing</span>)\n<span class="meta preprocessor">#<span class="keyword define">endif</span></span>\n<span class="meta preprocessor">#<span class="keyword define">endif</span>  /* ! __NHC__ */</span>'
);
