"use strict";

/*global require*/

var child_exec = require('child_process').exec;  // child_process is built in to node
var fs = require('fs');
var genSchema = require('generate-terriajs-schema');
var glob = require('glob-all');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var karma = require('karma').Server;
var path = require('path');
var resolve = require('resolve');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');

var sourceGlob = ['./lib/**/*.js', '!./lib/ThirdParty/**/*.js'];
var testGlob = ['./test/**/*.js', '!./test/Utility/*.js'];


// Create the build directory, because browserify flips out if the directory that might
// contain an existing source map doesn't exist.
if (!fs.existsSync('wwwroot/build')) {
    fs.mkdirSync('wwwroot/build');
}

gulp.task('build-specs', ['prepare-cesium'], function(done) {
    var wp = webpack(webpackConfig);
    wp.run(function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));
        }
        done(err);
    });
});

gulp.task('build', ['build-specs']);

gulp.task('release-specs', ['prepare-cesium'], function(done) {
    var wp = webpack(Object.assign({}, webpackConfig, {
        plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin()
        ].concat(webpackConfig.plugins || [])
    }));
    wp.run(function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));
        }
        done(err);
    });
});

gulp.task('make-schema', function() {
    return genSchema({source: '.', dest: 'wwwroot/schema', noversionsubdir: true, quiet: true});
});

gulp.task('release', ['release-specs', 'make-schema']);

gulp.task('watch-specs', ['prepare-cesium'], function(done) {
    var wp = webpack(webpackConfig);
    wp.watch({}, function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));
        }
    });
});

gulp.task('watch', ['watch-specs']);

gulp.task('lint', function(){
    var sources = glob.sync(sourceGlob.concat(testGlob));
    return gulp.src(sources)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('docs', function(done) {
    child_exec('node ./node_modules/jsdoc/jsdoc.js ./lib -c ./jsdoc.json', undefined, done);
});

gulp.task('prepare-cesium', ['copy-cesium-assets']);

gulp.task('copy-cesium-assets', function() {
    var cesium = resolve.sync('terriajs-cesium/wwwroot', {
        basedir: __dirname,
        extentions: ['.'],
        isFile: function(file) {
            try { return fs.statSync(file).isDirectory(); }
            catch (e) { return false; }
        }
    });
    return gulp.src([
            cesium + '/**'
        ], { base: cesium })
        .pipe(gulp.dest('wwwroot/build/Cesium'));
});

gulp.task('test-browserstack', function(done) {
    runKarma('karma-browserstack.conf.js', done);
});

gulp.task('test-saucelabs', function(done) {
    runKarma('karma-saucelabs.conf.js', done);
});

gulp.task('test', function(done) {
    runKarma('karma-local.conf.js', done);
});

gulp.task('default', ['lint', 'build']);

function runKarma(configFile, done) {
    karma.start({
        configFile: path.join(__dirname, configFile)
    }, function(e) {
        return done(e);
    });
}
