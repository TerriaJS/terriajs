"use strict";

/*global require*/

var fs = require('fs');
var glob = require('glob-all');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var jshint = require('gulp-jshint');
var jsdoc = require('gulp-jsdoc');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var exorcist = require('exorcist');
var buffer = require('vinyl-buffer');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var NpmImportPlugin = require('less-plugin-npm-import');


var appJSName = 'nationalmap.js';
var appCssName = 'nationalmap.css';
var specJSName = 'nationalmap-tests.js';
var appEntryJSName = './index.js';
var testGlob = './test/**/*.js';

// Create the build directory, because browserify flips out if the directory that might
// contain an existing source map doesn't exist.
if (!fs.existsSync('wwwroot/build')) {
    fs.mkdirSync('wwwroot/build');
}

gulp.task('build-app', ['prepare-terriajs'], function() {
    return build(appJSName, appEntryJSName, false);
});

gulp.task('build-specs', ['prepare-terriajs'], function() {
    return build(specJSName, glob.sync(testGlob), false);
});

gulp.task('build-css', function() {
    return gulp.src('./index.less')
        .pipe(less({
            plugins: [
                new NpmImportPlugin()
            ]
        }))
        .pipe(rename(appCssName))
        .pipe(gulp.dest('./wwwroot/build/'));
});

gulp.task('build', ['build-css', 'build-app', 'build-specs']);

gulp.task('release-app', ['prepare'], function() {
    return build(appJSName, appEntryJSName, true);
});

gulp.task('release-specs', ['prepare'], function() {
    return build(specJSName, glob.sync(testGlob), true);
});

gulp.task('release', ['build-css', 'release-app', 'release-specs']);

gulp.task('watch-app', ['prepare'], function() {
    return watch(appJSName, appEntryJSName, false);
});

gulp.task('watch-specs', ['prepare'], function() {
    return watch(specJSName, glob.sync(testGlob), false);
});

gulp.task('watch-css', ['build-css'], function() {
    return gulp.watch(['./index.less', './node_modules/terriajs/lib/Styles/*.less'], ['build-css']);
});

gulp.task('watch', ['watch-app', 'watch-specs', 'watch-css']);

gulp.task('lint', function(){
    return gulp.src(['lib/**/*.js', 'test/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('docs', function(){
    return gulp.src('lib/**/*.js')
        .pipe(jsdoc('./wwwroot/doc', undefined, {
            plugins : ['plugins/markdown']
        }));
});

gulp.task('prepare', ['prepare-terriajs']);

gulp.task('prepare-terriajs', function() {
    return gulp.src([
            'node_modules/terriajs/wwwroot/build/**'
        ], { base: 'node_modules/terriajs/wwwroot/build' })
    .pipe(gulp.dest('wwwroot/build/'));
});

gulp.task('default', ['lint', 'build']);

function bundle(name, bundler, minify, catchErrors) {
    // Combine main.js and its dependencies into a single file.
    // The poorly-named "debug: true" causes Browserify to generate a source map.
    var result = bundler.bundle();

    if (catchErrors) {
        // Display errors to the user, and don't let them propagate.
        result = result.on('error', function(e) {
            gutil.log('Browserify Error', e);
        });
    }

    result = result
        .pipe(source(name))
        .pipe(buffer());

    if (minify) {
        // Minify the combined source.
        // sourcemaps.init/write maintains a working source map after minification.
        // "preserveComments: 'some'" preserves JSDoc-style comments tagged with @license or @preserve.
        result = result
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify({preserveComments: 'some', mangle: true, compress: true}))
            .pipe(sourcemaps.write());
    }

    result = result
        // Extract the embedded source map to a separate file.
        .pipe(transform(function () { return exorcist('wwwroot/build/' + name + '.map'); }))

        // Write the finished product.
        .pipe(gulp.dest('wwwroot/build'));

    return result;
}

function build(name, files, minify) {
    return bundle(name, browserify({
        entries: files,
        debug: true
    }), minify, false);
}

function watch(name, files, minify) {
    var bundler = watchify(browserify({
        entries: files,
        debug: true,
        cache: {},
        packageCache: {}
    }));

    function rebundle() {
        var start = new Date();

        var result = bundle(name, bundler, minify, true);

        result.on('end', function() {
            console.log('Rebuilt ' + name + ' in ' + (new Date() - start) + ' milliseconds.');
        });

        return result;
    }

    bundler.on('update', rebundle);

    return rebundle();
}
