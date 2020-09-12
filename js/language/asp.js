/**
 * Classic ASP patterns
 *
 * @author Michele Pisani - www.michelepisani.it
 * @version 1.0.0
 */
Rainbow.extend('asp', [
    {
      'name': 'constant.language',
      'pattern': /true|false|null/ig
    },
    {
      'name': 'keyword.dot',
      'pattern': /\./g
    },
    {
      'name': 'keyword',
      'pattern': /\b(dim|function|end|select|case|for|next|loop|do|while|wend|to|until|exit|then|not|if|else|elseif|option|explicit|on|error|resume|codepage|language|sub|call|set|class|private|public|nothing|let|get|new|const|property|execute?)(?=\(|\b)/ig
    },
    {
      'name': 'support.function',
      'pattern': /\b(ubound|replace|len|left|right|asc|chr|instr|lcase|ltrim|rtrim|space|split|strcomp|string|strreverse|trim|ucase|mid|instrrev|cint|cdbl|clng)(?=\(|\b)/ig
    },
    {
      'name': 'support.function.suggested',
      'pattern': /\b(.binaryread|.clientcertificate|.cookies|.form|.item|.querystring|.servervariables|.totalbytes|.abandon|.codepage|.contents|.lcid|.sessionid|.staticobjects|.timeout|.value|.count|.key|.addheader|.appendtolog|.binarywrite|.buffer|.cachecontrol|.charset|.clear|.contenttype|.end|.expires|.expiresabsolute|.flush|.isclientconnected|.pics|.redirect|.status|.write)(?=\(|\b)/ig
    },
    {
      //pattern for classic ASP tags
      'name': 'variable.language.asp-tag',
      'pattern': /(&lt;\%|\%&gt;)/g
    },
    {
      //pattern for classic ASP comments
      'name': 'comment',
      'pattern': /([']).*/g
    },
    {
      //pattern for classic ASP string (find all string between each group of double quotes)
      'name': 'string',
      'pattern': /\".*?\"/g
    },
    {
      //pattern for INCLUDE (file or virtual) and for HTML comment
      'name': 'variable.language.asp-include',
      'pattern': /(&lt;!--).*(--&gt;)/g
    },
    {
      'name': 'keyword.operator',
      'pattern': /\+|\!|\-|&amp;|\||\*|\=/g
    }
]);
