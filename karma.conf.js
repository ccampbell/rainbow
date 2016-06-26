/* eslint-env node */
/* eslint no-var: false */

module.exports = function(config) {
    config.set({
        basePath: './',

        plugins: [
            'karma-rollup-preprocessor',
            'karma-mocha-reporter',
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-sourcemap-loader',
            'karma-mocha',
            'karma-chai',
            'karma-chai-sinon',
            'karma-chai-as-promised'
        ],

        frameworks: ['mocha', 'chai-sinon', 'chai-as-promised', 'chai'],

        files: [
            'node_modules/babel-polyfill/dist/polyfill.js',
            'dist/rainbow.js',
            {pattern: 'test/**/*-test.js'}
        ],

        logLevel: config.LOG_INFO,

        preprocessors: {
            'test/**/*-test.js': ['rollup', 'sourcemap']
        },

        rollupPreprocessor: {
            rollup: {
                plugins: [
                    require('rollup-plugin-buble')({
                        transforms: {
                            dangerousForOf: true
                        }
                    })
                ]
            },
            bundle: {
                sourceMap: 'inline'
            }
        },

        reporters: ['mocha'],
        colors: true
    });
};
