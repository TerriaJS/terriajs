'use strict';

/*global require*/

var child_exec = require('child_process').exec;  // child_process is built in to node
var fs = require('fs');
var gulp = require('gulp');
var gutil = require("gulp-util");
var karma = require('karma').Server;
var notifier = require('node-notifier');
var path = require('path');
var resolve = require('resolve');

gulp.task('default', ['lint', 'build']);
gulp.task('build', ['build-specs']);
gulp.task('release', ['release-specs', 'make-schema']);
gulp.task('watch', ['watch-specs']);

gulp.task('build-specs', ['prepare-cesium'], function(done) {
    var webpackConfig = require('./webpack.config.js');

    runWebpack(webpackConfig, done, true);
});

gulp.task('release-specs', ['prepare-cesium'], function(done) {
    var webpack = require('webpack');
    var webpackConfig = require('./webpack.config.js');

    runWebpack(Object.assign({}, webpackConfig, {
        plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin()
        ].concat(webpackConfig.plugins || [])
    }), done, true);
});

gulp.task('watch-specs', ['prepare-cesium'], function(done) {
    var webpack = require('webpack');
    var webpackConfig = require('./webpack.config.js');

    var wp = webpack(webpackConfig);
    wp.watch({}, function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));

            var jsonStats = stats.toJson();
            if (err || (jsonStats.errors && jsonStats.errors.length > 0)) {
                notifier.notify({
                    title: 'Error building TerriaJS specs',
                    message: stats.toString({
                        colors: false,
                        hash: false,
                        version: false,
                        timings: false,
                        assets: false,
                        chunks: false,
                        chunkModules: false,
                        modules: false,
                        children: false,
                        cached: false,
                        reasons: false,
                        source: false,
                        errorDetails: true,
                        chunkOrigins: false
                    })
                });
            }
        }
    });
});

gulp.task('make-schema', function() {
    var genSchema = require('generate-terriajs-schema');

    return genSchema({
        source: '.',
        dest: 'wwwroot/schema',
        noversionsubdir: true,
        quiet: true
    });
});


gulp.task('lint', function() {
    var glob = require('glob-all');
    var jshint = require('gulp-jshint');

    var sourceGlob = ['./lib/**/*.js', '!./lib/ThirdParty/**/*.js'];
    var testGlob = ['./test/**/*.js', '!./test/Utility/*.js'];

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

function runWebpack(config, doneCallback) {
    var wp = webpack(webpackConfig);
    wp.run(function(err, stats) {
        if (stats) {
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false
            }));

            if (!err) {
                var jsonStats = stats.toJson();
                if (jsonStats.errors && jsonStats.errors.length > 0) {
                    err = new gutil.PluginError('build-specs', 'Build has errors (see above).');
                }
            }
        }

        doneCallback(err);
    });
}

function runKarma(configFile, done) {
    karma.start({
        configFile: path.join(__dirname, configFile)
    }, function(e) {
        return done(e);
    });
}
