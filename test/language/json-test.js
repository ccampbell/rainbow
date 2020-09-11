const rainbow = require('./src/rainbow-node.js');
import { run, skip } from '../helper';

////////////////
// Test suite //
////////////////
const language = 'json';

export function testJSON(t) {
    run(
        t,

        language,

        'json string',

        `{
            "id": 23,
            "name": "Something",
            "description": "He said, \"Double quotes inside of other double quotes.\"",
            "tags": [
                "one",
                "two",
                "three"
            ],
            "image": {
                "url": "http://example.com/image.jpg",
                "width": 100,
                "height": 100
            }
        }`,

        `{
            <span class="string">"id"</span>: <span class="constant numeric">23</span>,
            <span class="string">"name"</span>: <span class="string">"Something"</span>,
            <span class="string">"description"</span>: <span class="string">"He said, "</span>Double quotes inside of other double quotes.<span class="string">""</span>,
            <span class="string">"tags"</span>: [
                <span class="string">"one"</span>,
                <span class="string">"two"</span>,
                <span class="string">"three"</span>
            ],
            <span class="string">"image"</span>: {
                <span class="string">"url"</span>: <span class="string">"http://example.com/image.jpg"</span>,
                <span class="string">"width"</span>: <span class="constant numeric">100</span>,
                <span class="string">"height"</span>: <span class="constant numeric">100</span>
            }
        }`
    );
}
