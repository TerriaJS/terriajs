"use strict";

/*global require*/

var fs = require('fs');
var gulp = require('gulp');
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

fs.mkdirSync('public/build');

function build(minify) {
    // Combine main.js and its dependencies into a single file.
    // The poorly-named "debug: true" causes Browserify to generate a source map.
    var result = browserify('./src/viewer/main.js').bundle({ debug: true })
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
        .pipe(concat('ausglobe.js'))
        .pipe(gulp.dest('public/build'));

    return result;
}

//TODO: figure out if there's any value to this
//var refresh = require('gulp-livereload');  
//var lr = require('tiny-lr');  
//var server = lr();

gulp.task('build', function() {
    return build(true);
});

gulp.task('build-debug', function() {
    return build(false);
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

/*
gulp.task('lr-server', function() {  
    server.listen(35729, function(err) {
        if(err) return console.log(err);
    });
})
*/

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

gulp.task('watch', function() {
    gulp.watch(['public/cesium/Source/**', 'public/cesium/Specs/**'], ['build-cesium']);
    gulp.watch('src/**/*.js', ['default']);
});
