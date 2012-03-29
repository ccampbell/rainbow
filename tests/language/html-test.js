RainbowTester.startTest('html');

RainbowTester.run('comment', '<!-- this is a comment -->', '<span class="comment html">&lt;!-- this is a comment --&gt;</span>');
RainbowTester.run('multiline-comment', '<!-- this is a comment\non two lines -->', '<span class="comment html">&lt;!-- this is a comment\non two lines --&gt;</span>');
RainbowTester.run('paragraph', '<p class="test">this is a paragraph</p>', '<span class="support tag"><span class="support tag">&lt;</span><span class="support tag-name">p</span></span> <span class="support attribute">class</span><span class="support operator">=</span><span class="string quote">"</span><span class="string value">test</span><span class="string quote">"</span><span class="support tag close">&gt;</span>this is a paragraph<span class="support tag"><span class="support tag">&lt;</span><span class="support tag special">/</span><span class="support tag-name">p</span></span><span class="support tag close">&gt;</span>');

RainbowTester.endTest('html');
