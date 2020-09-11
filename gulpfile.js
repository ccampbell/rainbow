/* eslint-env node */
/* eslint no-var: false */

var gulp = require('gulp');
var del = require('del');
var argv = require('yargs').argv;
var eslint = require('gulp-eslint');
var fs = require('fs');
var rollup = require("rollup").rollup;
var buble = require('rollup-plugin-buble');
var uglify = require('rollup-plugin-uglify');
var inject = require('gulp-inject-string');
var git = require('gulp-git');
var bump = require('gulp-bump');
var semver = require('semver');
var sass = require('gulp-sass');
var through = require('through');
var autoprefixer = require('gulp-autoprefixer');
var run = require('gulp-run-command').default;
var version = require('./package.json').version;

var appName = 'Rainbow';
var lowercaseAppName = 'rainbow';

function _getDestinationPath() {
    if (argv.release) {
        destination = 'dist/' + lowercaseAppName + '.min.js';
        return destination;
    }

    var destination = 'dist/' + lowercaseAppName + '.js';
    if (argv.custom) {
        destination = 'dist/' + lowercaseAppName + '-custom.min.js';
    }

    return destination;
}

gulp.task('pack', function() {
    var plugins = [
        buble({
            transforms: {
                dangerousForOf: true
            }
        })
    ];

    if (argv.ugly || argv.release) {
        plugins.push(uglify({
            mangle: {
                except: ['Prism']
            }
        }));
    }

    var includeSourceMaps = true;
    if (argv.sourcemaps == '0' || argv.release || argv.custom) {
        includeSourceMaps = false;
    }

    var entry = 'src/' + lowercaseAppName + '.js';
    var dest = _getDestinationPath();
    var format = 'umd';

    return rollup({
        entry: entry,
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

function _needsGeneric(languages) {
    var needsGeneric = ['php', 'python', 'javascript', 'go', 'c', 'r', 'coffeescript', 'haskell'];

    for (var i = 0; i < languages.length; i++) {
        if (needsGeneric.indexOf(languages[i]) !== -1) {
            return true;
        }
    }

    return false;
}

function _getLanguageList() {
    if (argv.languages.toLowerCase() === 'all') {
        var files = fs.readdirSync('./src/language');
        var languages = ['generic'];
        for (var i = 0; i < files.length; i++) {
            var lang = files[i].replace('.js', '');
            if (lang !== 'generic') {
                languages.push(lang);
            }
        }

        return languages;
    }

    if (!argv.languages) {
        return [];
    }

    var languages = argv.languages.toLowerCase().split(',');
    if (_needsGeneric(languages) && languages.indexOf('generic') === -1) {
        languages.unshift('generic');
    }

    return languages;
}

function _getComment() {
    var comment = '/* ' + appName + ' v' + (argv.version || version) + ' rainbowco.de'

    if (argv.languages !== 'all') {
        var languages = _getLanguageList();
        comment += ' | included languages: ' + languages.sort().join(', ');
    }

    comment += ' */';
    return comment;
}

gulp.task('update-package-version', function() {
    return gulp.src(['./package.json', './package-lock.json'])
        .pipe(bump({version: argv.version}))
        .pipe(gulp.dest('./'));
});

gulp.task('update-version', function() {
    var message = 'Update version to ' + argv.version;
    return gulp.src(['./package.json', './package-lock.json', 'dist/' + lowercaseAppName + '.min.js'])
        .pipe(git.add())
        .pipe(git.commit(message))
        .on('data', function(err) {
            git.tag(argv.version, message);
        });
});

gulp.task('test', run('npm run test'));

gulp.task('lint', function() {
    return gulp.src('src/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('clean', function() {
    return del(['dist/']);
});

gulp.task('release', async function() {
    var type = argv.type || 'fix';
    var map = {
        breaking: 'major',
        feature: 'minor',
        fix: 'patch'
    };

    var newVersion = semver.inc(version, map[type]);
    argv.release = true;
    argv.version = newVersion;

    const todo = gulp.series(['lint', 'test', 'update-package-version', 'build', 'update-version']);
    return todo();
});

function _appendCode(code) {
    var dest = _getDestinationPath();
    var stream = gulp.src(dest)
        .pipe(inject.prepend(_getComment()))
        .pipe(inject.append(code));

    if (argv.output) {
        stream.pipe(through(function(data) { this.queue(data.contents); })).pipe(process.stdout);
        return;
    }

    stream.pipe(gulp.dest('dist'));
}

gulp.task('append-languages', function() {
    var languageCode = [];

    var languages = _getLanguageList();
    for (var i = 0; i < languages.length; i++) {
        languageCode.push('import \'./language/' + languages[i] + '\';');
    }

    if (languageCode.length === 0) {
        argv.languages = 'none';
        _appendCode('');
        return;
    }

    fs.writeFileSync('src/build.js', languageCode.join('\n') + '\n');

    return rollup({
        entry: 'src/build.js',
        plugins: [uglify()]
    }).then(function (bundle) {
        _appendCode("\n" + bundle.generate().code);
    });
});

gulp.task('build', async function() {
    if (!argv.languages) {
        argv.languages = 'java,javascript,csharp,python,c,php,ruby,html,css,json';
    }

    argv.ugly = true;
    argv.custom = true;

    if (argv.languages === 'none') {
        argv.languages = '';
    }

    const todo = gulp.series(['pack', 'append-languages']);
    return todo();
});

gulp.task('sass', function() {
    return gulp.src('./themes/sass/*.sass')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(gulp.dest('./themes/css'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.js', gulp.series(['pack']));
    gulp.watch('themes/sass/*.sass', gulp.series(['sass']));
});

gulp.task('default', gulp.series(['lint', 'test', 'pack']));
