/* eslint-env node */
/* eslint no-var: false */

var gulp = require('gulp');
var del = require('del');
var KarmaServer = require('karma').Server;
var argv = require('yargs').argv;
var eslint = require('gulp-eslint');
var rollup = require("rollup").rollup;
var buble = require('rollup-plugin-buble');
var uglify = require('rollup-plugin-uglify');
var runSequence = require('run-sequence');
var inject = require('gulp-inject-string');
var git = require('gulp-git');
var bump = require('gulp-bump');
var semver = require('semver');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var version = require('./package.json').version;

var appName = 'Rainbow';
var lowercaseAppName = 'rainbow';

gulp.task('pack', function() {
    var plugins = [
        buble({
            transforms: {
                dangerousForOf: true
            }
        })
    ];

    if (argv.ugly || argv.release) {
        plugins.push(uglify());
    }

    var includeSourceMaps = true;
    if (argv.sourcemaps == '0' || argv.release) {
        includeSourceMaps = false;
    }

    var dest = 'dist/' + lowercaseAppName + '.js';
    var format = 'umd';
    if (argv.release) {
        dest = 'dist/' + lowercaseAppName + '.min.js';
    }

    return rollup({
        entry: 'src/' + lowercaseAppName + '.js',
        sourceMap: includeSourceMaps,
        plugins: plugins
    }).then(function (bundle) {
        var data = {
            format: format,
            moduleName: appName,
            sourceMap: '',
            dest: dest
        };

        if (includeSourceMaps) {
            data.sourceMap = 'inline';
        }

        return bundle.write(data);
    });
});

function _getComment() {
    return '/* ' + appName + ' v' + argv.version + ' rainbowco.de */';
}

gulp.task('update-version', function() {
    gulp.src('./package.json')
        .pipe(bump({version: argv.version}))
        .pipe(gulp.dest('./'));

    gulp.src('dist/' + lowercaseAppName + '.min.js')
        .pipe(inject.prepend(_getComment()))
        .pipe(gulp.dest('dist'));

    var message = 'Update version to ' + argv.version;
    gulp.src(['./package.json', 'dist/' + lowercaseAppName + '.min.js'])
        .pipe(git.add())
        .pipe(git.commit(message))
        .on('data', function(err) {
            git.tag(argv.version, message);
        });
});

gulp.task('test', function(done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: !argv.watch ? true : false,
        browsers: argv.browsers ? argv.browsers.split(',') : ['PhantomJS']
    }, done).start();
});

gulp.task('lint', function() {
    return gulp.src('src/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('clean', function() {
    del(['dist/']);
});

gulp.task('release', function(callback) {
    var type = argv.type || 'fix';
    var map = {
        breaking: 'major',
        feature: 'minor',
        fix: 'patch'
    };

    var newVersion = semver.inc(version, map[type]);
    argv.release = true;
    argv.version = newVersion;

    runSequence('test', 'pack', 'update-version', callback);
});

gulp.task('sass', function() {
    return gulp.src('./themes/sass/*.sass')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(gulp.dest('./themes/css'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['pack']);
    gulp.watch('themes/sass/*.sass', ['sass']);
});

gulp.task('default', ['lint', 'test', 'pack']);
