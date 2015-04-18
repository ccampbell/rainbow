var language = 'splunk';

describe(language, function() {
  run(
    language,

    'commands',

    'eval | eventstats | associate | xyseries'
    );
