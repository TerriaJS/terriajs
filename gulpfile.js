"use strict";

/*global require*/

var fs = require('fs');
var glob = require('glob-all');
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


var appJSName = 'ausglobe.js';
var specJSName = 'ausglobe-specs.js';
var appEntryJSName = './src/viewer/main.js';
var workerGlob = [
    './public/cesium/Source/Workers/*.js',
    '!./public/cesium/Source/Workers/*.profile.js',
    '!./public/cesium/Source/Workers/cesiumWorkerBootstrapper.js',
    '!./public/cesium/Source/Workers/transferTypedArrayTest.js',
    '!./public/cesium/Source/Workers/createTaskProcessorWorker.js'
];
var specGlob = './spec/*.js';


// Create the build directory, because browserify flips out if the directory that might
// contain an existing source map doesn't exist.
if (!fs.existsSync('public/build')) {
    fs.mkdirSync('public/build');
}

gulp.task('build-app', ['build-cesium'], function() {
    return build(appJSName, appEntryJSName, false);
});

gulp.task('build-specs', ['build-cesium'], function() {
    return build(specJSName, glob.sync(specGlob), false);
});

gulp.task('build', ['build-app', 'build-specs']);

gulp.task('release-app', ['build-cesium'], function() {
    return build(appJSName, appEntryJSName, true);
});

gulp.task('release-specs', ['build-cesium'], function() {
    return build(specJSName, glob.sync(specGlob), true);
});

gulp.task('release', ['release-app', 'release-specs']);

gulp.task('watch-app', ['build-cesium'], function() {
    return watch(appJSName, appEntryJSName, false);
});

gulp.task('watch-specs', ['build-cesium'], function() {
    return watch(specJSName, glob.sync(specGlob), false);
});

gulp.task('watch', ['watch-app', 'watch-specs']);

gulp.task('lint', function(){
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('docs', function(){
    return gulp.src('src/*.js')
        .pipe(jsdoc('./public/doc'));
});

gulp.task('build-cesium', function(cb) {
    return exec('"Tools/apache-ant-1.8.2/bin/ant" build', {
        cwd : 'public/cesium'
    }, function(err, stdout, stderr) {
        if (stderr) {
            console.log('Error while building Cesium: ');
            console.log(stderr);
        }
        cb(err);
    });
});

gulp.task('default', ['lint', 'build']);

function bundle(name, bundler, minify, catchErrors) {
    requireWebWorkers(bundler);

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
        .pipe(transform(function () { return exorcist('public/build/' + name + '.map'); }))

        // Write the finished product.
        .pipe(gulp.dest('public/build'));

    return result;
}

function build(name, files, minify) {
    return bundle(name, browserify(files).transform('deamdify'), minify, false);
}

function watch(name, files, minify) {
    var bundler = watchify(files).transform('deamdify');

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

function requireWebWorkers(bundler) {
    // Explicitly require the Cesium Web Workers, and expose them with the name the cesiumWorkerBootstrapper will use for them.
    var workers = glob.sync(workerGlob);
    for (var i = 0; i < workers.length; ++i) {
        var workerFilename = workers[i];

        var lastSlashIndex = workerFilename.lastIndexOf('/');
        if (lastSlashIndex < 0) {
            continue;
        }

        var exposeName = 'Workers/' + workerFilename.substring(lastSlashIndex + 1);
        var dotJSIndex = exposeName.lastIndexOf('.js');
        exposeName = exposeName.substring(0, dotJSIndex);

        console.log(exposeName);

        bundler.require(workerFilename, { expose : exposeName });
    }
}
