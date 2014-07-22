"use strict";

/*global require*/

var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var jsdoc = require('gulp-jsdoc');
var uglify = require('gulp-uglify');
var jasmine = require('gulp-jasmine');
var exec = require('child_process').exec;
var sourcemaps = require('gulp-sourcemaps');
var exorcist = require('exorcist');
var buffer = require('vinyl-buffer');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

// Create the build directory, because browserify flips out if the directory that might
// contain an existing source map doesn't exist.
if (!fs.existsSync('public/build')) {
    fs.mkdirSync('public/build');
}

gulp.task('build', function() {
    return build(true);
});

gulp.task('build-debug', function() {
    return build(false);
});

gulp.task('watch', function() {
    return watch(true);
});

gulp.task('watch-debug', function() {
    return watch(false);
});

gulp.task('lint', function(){
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('docs', function(){
    return gulp.src('src/*.js')
        .pipe(jsdoc('./public/doc'));
});

gulp.task('test', function () {
    return gulp.src('public/specs/*.js')
        .pipe(jasmine());
});

gulp.task('build-cesium', function(cb) {
    return exec('"Tools/apache-ant-1.8.2/bin/ant" build combine', {
        cwd : 'public/cesium'
    }, function(err, stdout, stderr) {
        if (stderr) {
            console.log('Error while building Cesium: ');
            console.log(stderr);
        }
        cb(err);
    });
});

gulp.task('release-cesium', function(cb) {
    return exec('"Tools/apache-ant-1.8.2/bin/ant" minifyRelease', {
        cwd : 'public/cesium',
        maxBuffer: 1024 * 500
    }, function(err, stdout, stderr) {
        if (stderr) {
            console.log('Error while building Cesium: ');
            console.log(stderr);
        }
        cb(err);
    });
});

gulp.task('default', ['build', 'lint']);

gulp.task('release', ['build', 'lint', 'docs']);

function bundle(bundler, minify, catchErrors) {
    // Combine main.js and its dependencies into a single file.
    // The poorly-named "debug: true" causes Browserify to generate a source map.
    var result = bundler.bundle({
            debug: true
        });

    if (catchErrors) {
        // Display errors to the user, and don't let them propagate.
        result = result.on('error', function(e) {
            gutil.log('Browserify Error', e);
        });
    }

    result = result
        .pipe(source('ausglobe.js'))
        .pipe(buffer());

    if (minify) {
        // Minify the combined source.
        // sourcemaps.init/write maintains a working source map after minification.
        // "preserveComments: 'some'" preserves JSDoc-style comments tagged with @license or @preserve.
        result = result
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify({preserveComments: 'some', mangle: false, compress: false}))
            .pipe(sourcemaps.write());
    }

    result = result
        // Extract the embedded source map to a separate file.
        .pipe(transform(function () { return exorcist('public/build/ausglobe.js.map'); }))

        // Write the finished product.
        .pipe(gulp.dest('public/build'));

    return result;
}

function build(minify) {
    bundle(browserify('./src/viewer/main.js'), minify, false);
}

function watch(minify) {
    var bundler = watchify('./src/viewer/main.js');

    var timeSeconds = 'unknown';

    bundler.on('bytes', function(bytes) {
        console.log('Wrote ' + bytes + ' bytes in ' + timeSeconds + ' seconds.');
    })
    bundler.on('time', function(time) {
        timeSeconds = time / 1000.0;
    });

    function rebundle() {
        return bundle(bundler, minify, true);
    }

    bundler.on('update', rebundle);

    return rebundle();
}
