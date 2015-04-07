/* global describe, run */
var language = 'swift';

describe(language, function() {

    run(
        language,

        'function definition',

        'func functionName(){}',

        '<span class="storage function">func</span> ' +
        '<span class="entity name function">functionName</span>(){}'
    );
});
