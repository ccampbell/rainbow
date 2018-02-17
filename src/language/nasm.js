/**
 * NASM patterns, adapted from Prism's NASM definition and extended to include FASM keywords
 * 
 * Prism is available under the MIT license:
 *
 * Copyright (c) 2012 Lea Verou
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * @author Zebulon McCorkle
 */
Rainbow.extend('nasm', [
    {
        name: 'keyword',
        pattern: /(\[?BITS (?:16|32|64)\]?)|((^\s*)(section|segment|entry|format)\s*[a-zA-Z.]+:?)|((?:extern|global)[^;\r\n]*)|((?:CPU|FLOAT|DEFAULT).*$)|extrn|PLT/gim
    },
    {
        name: 'variable.register',
        pattern: /\b(?:st\d|[xyz]mm\d\d?|[cdt]r\d|r\d\d?[bwd]?|[er]?[abcd]x|[abcd][hl]|[er]?(?:bp|sp|si|di)|[cdefgs]s)\b/gi
    },
    {
        name: 'number',
        pattern: /(?:\b|-|(?=\$))(?:0[hx][\da-f]*\.?[\da-f]+(?:p[+-]?\d+)?|\d[\da-f]+[hx]|\$\d[\da-f]*|0[oq][0-7]+|[0-7]+[oq]|0[by][01]+|[01]+[by]|0[dt]\d+|\d*\.?\d+(?:\.?e[+-]?\d+)?[dt]?)\b/gi
    },
    {
        name: 'keyword.operator',
        pattern: /[\[\]*+\-\/%<>=&|$!]/g
    },
    {
        name: 'comment',
        pattern: /;.*$/gm
    },
    {
        name: 'string',
        pattern: /(["'`])(?:\\.|(?!\1)[^\\\r\n])*\1/g
    },
    {
        name: 'storage.function.label',
        pattern: /(^\s*)[A-Za-z._?$][\w.?$@~#]*:/gm
    }
]);
