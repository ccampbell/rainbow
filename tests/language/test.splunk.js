/* global describe, run */
var language = 'splunk';

describe(language, function() {
  run(
    language,
    'commands',
    'eval | eventstats | associate | xyseries',
    '<span class="keyword">eval</span> <span class="keyword operator">|</span> <span class="keyword">eventstats</span> <span class="keyword operator">|</span> <span class="keyword">associate</span> <span class="keyword operator">|</span> <span class="keyword">xyseries</span>'
    );

  run(
    language,
    'stats function',
    'stats max(field) | stats list(categoryId) | stats values(clientip)',
    '<span class="keyword">stats</span> <span class="support function">max</span>(field) <span class="keyword operator">|</span> <span class="keyword">stats</span> <span class="function call">list</span>(categoryId) <span class="keyword operator">|</span> <span class="keyword">stats</span> <span class="function call">values</span>(clientip)'
    );

  run(
    language,
    'eval function',
    'eval field = if(isnotnull(field), "X", "Y") | where cidrmatch("10.0.0.0/8", src_ip)',
    '<span class="keyword">eval</span> field <span class="keyword operator">=</span> <span class="support function">if</span>(<span class="support function">isnotnull</span>(field), <span class="string">"X"</span>, <span class="string">"Y"</span>) <span class="keyword operator">|</span> <span class="keyword">where</span> <span class="support function">cidrmatch</span>(<span class="string">"10.0.0.0/8"</span>, src_ip)'
    );

  run(
    language,
    'constant.language',
    'stats count as counted by host',
    '<span class="keyword">stats</span> count <span class="constant language">as</span> counted <span class="constant language">by</span> host'
    );
  
  run(
    language,
    'variable.gloabl',
    'host=web source=/opt/log* sourcetype=access_combined index=abtest',
    '<span class="variable global">host</span><span class="keyword operator">=</span>web <span class="variable global">source</span><span class="keyword operator">=</span>/opt/log<span class="keyword operator">*</span> <span class="variable global">sourcetype</span><span class="keyword operator">=</span>access_combined <span class="variable global">index</span><span class="keyword operator">=</span>abtest'
    );
});
