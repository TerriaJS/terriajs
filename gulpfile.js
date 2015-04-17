"use strict";

/*global require*/

var fs = require('fs');
var glob = require('glob-all');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var jshint = require('gulp-jshint');
var jsdoc = require('gulp-jsdoc');
var uglify = require('gulp-uglify');
var exec = require('child_process').exec;
var sourcemaps = require('gulp-sourcemaps');
var exorcist = require('exorcist');
var buffer = require('vinyl-buffer');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var watchify = require('watchify');


var specJSName = 'TerriaJS-specs.js';
var workerGlob = [
    './third_party/cesium/Source/Workers/*.js',
    '!./third_party/cesium/Source/Workers/*.profile.js',
    '!./third_party/cesium/Source/Workers/cesiumWorkerBootstrapper.js',
    '!./third_party/cesium/Source/Workers/transferTypedArrayTest.js',
    '!./third_party/cesium/Source/Workers/createTaskProcessorWorker.js'
];
var sourceGlob = './lib/**/*.js';
var testGlob = './test/**/*.js';


// Create the build directory, because browserify flips out if the directory that might
// contain an existing source map doesn't exist.
if (!fs.existsSync('public/build')) {
    fs.mkdirSync('public/build');
}

gulp.task('build-specs', ['prepare-cesium'], function() {
    return build(specJSName, glob.sync(testGlob), false);
});

gulp.task('build', ['build-specs']);

gulp.task('release-specs', ['prepare-cesium'], function() {
    return build(specJSName, glob.sync(testGlob), true);
});

gulp.task('release', ['release-specs']);

gulp.task('watch-specs', ['prepare-cesium'], function() {
    return watch(specJSName, glob.sync(testGlob), false);
});

gulp.task('watch', ['watch-specs']);

gulp.task('lint', function(){
    var sources = glob.sync([sourceGlob, testGlob]);
    return gulp.src(sources)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('docs', function(){
    return gulp.src([sourceGlob])
        .pipe(jsdoc('./public/doc', undefined, {
            plugins : ['plugins/markdown']
        }));
});

gulp.task('prepare-cesium', ['build-cesium', 'copy-cesium-assets', 'copy-cesiumWorkerBootstrapper']);

gulp.task('build-cesium', function(cb) {
    return exec('"Tools/apache-ant-1.8.2/bin/ant" build', {
        cwd : 'Cesium'
    }, function(err, stdout, stderr) {
        if (stderr) {
            console.log('Error while building Cesium: ');
            console.log(stderr);
        }
        cb(err);
    });
});

gulp.task('copy-cesium-assets', function() {
    return gulp.src([
            'Cesium/Source/Workers/transferTypedArrayTest.js',
            'Cesium/Source/ThirdParty/Workers/**',
            'Cesium/Source/Assets/**',
            'Cesium/Source/Widgets/**/*.css',
            'Cesium/Source/Widgets/Images/**'
        ], { base: 'Cesium/Source' })
        .pipe(gulp.dest('public/build/Cesium/'));
});

gulp.task('copy-cesiumWorkerBootstrapper', function() {
    return gulp.src('cesiumWorkerBootstrapper.js')
        .pipe(gulp.dest('public/build/Cesium/Workers'));
});

gulp.task('default', ['lint', 'build']);

function bundle(name, bundler, minify, catchErrors) {
    requireWebWorkers(bundler);

    // Combine main.js and its dependencies into a single file.
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
        .pipe(transform(function () { return exorcist('public/build/' + name + '.map'); }))

        // Write the finished product.
        .pipe(gulp.dest('public/build'));

    return result;
}

function build(name, files, minify) {
    // The poorly-named "debug: true" causes Browserify to generate a source map.
    return bundle(name, browserify({
        entries: files,
        debug: true
    }).transform('brfs'), minify, false);
}

function watch(name, files, minify) {
    var bundler = watchify(browserify({
        entries: files,
        debug: true,
        cache: {},
        packageCache: {}
    })).transform('brfs');

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

        bundler.require(workerFilename, { expose : exposeName });
    }
}
