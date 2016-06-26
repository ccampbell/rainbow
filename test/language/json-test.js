import '../../src/language/json';
import { run } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'json';

describe(language, () => {
    run(
        language,

        'json string',

        '{\n' +
        '    "id": 23,\n' +
        '    "name": "Something",\n' +
        '    "description": "He said, \"Double quotes inside of other double quotes.\"",\n' +
        '    "tags": [\n' +
        '        "one",\n' +
        '        "two",\n' +
        '        "three"\n' +
        '    ],\n' +
        '    "image": {\n' +
        '        "url": "http://example.com/image.jpg",\n' +
        '        "width": 100,\n' +
        '        "height": 100\n' +
        '    }\n' +
        '}',

        '{\n    <span class="string">"id"</span>: <span class="constant numeric">23</span>,\n    <span class="string">"name"</span>: <span class="string">"Something"</span>,\n    <span class="string">"description"</span>: <span class="string">"He said, "</span>Double quotes inside of other double quotes.<span class="string">""</span>,\n    <span class="string">"tags"</span>: [\n        <span class="string">"one"</span>,\n        <span class="string">"two"</span>,\n        <span class="string">"three"</span>\n    ],\n    <span class="string">"image"</span>: {\n        <span class="string">"url"</span>: <span class="string">"http://example.com/image.jpg"</span>,\n        <span class="string">"width"</span>: <span class="constant numeric">100</span>,\n        <span class="string">"height"</span>: <span class="constant numeric">100</span>\n    }\n}'
    );
});
