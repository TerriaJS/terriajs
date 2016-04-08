/*eslint-env node*/
/*eslint no-sync: 0*/

'use strict';

/*global require*/

// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// so that our postinstall script (which runs `gulp post-npm-install`) is able to run without
// the devDependencies available.  Individual tasks, other than `post-npm-install` and any tasks it
// calls, may require in `devDependency` modules locally.
var gulp = require('gulp');

gulp.task('default', ['lint', 'build']);
gulp.task('build', ['build-specs', 'copy-cesium-assets']);
gulp.task('release', ['release-specs', 'copy-cesium-assets', 'make-schema']);
gulp.task('watch', ['watch-specs', 'copy-cesium-assets']);
gulp.task('post-npm-install', ['copy-cesium-assets']);

gulp.task('build-specs', function(done) {
    var runWebpack = require('./buildprocess/runWebpack.js');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    runWebpack(webpackConfig, done);
});

gulp.task('release-specs', function(done) {
    var runWebpack = require('./buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    runWebpack(Object.assign({}, webpackConfig, {
        devtool: 'source-map',
        plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin()
        ].concat(webpackConfig.plugins || [])
    }), done);
});

gulp.task('watch-specs', function(done) {
    var watchWebpack = require('./buildprocess/watchWebpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    watchWebpack(webpackConfig, done);
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
    var runExternalModule = require('./buildprocess/runExternalModule');

    runExternalModule('eslint/bin/eslint.js', [
        'lib', 'test',
        '--ext', '.jsx',
        '--ext', '.js',
        '--ignore-pattern', 'lib/ThirdParty',
        '--max-warnings', '0'
    ]);
});

// Create a single .js file with all of TerriaJS + Cesium!
gulp.task('build-libs', function(done) {
    var fs = require('fs');
    var glob = require('glob-all');
    var path = require('path');
    var runWebpack = require('./buildprocess/runWebpack.js');
    var webpackConfig = require('./buildprocess/webpack.lib.config.js');

    // Build an index.js to export all of the modules.
    var index = '';

    index += '\'use strict\'\n';
    index += '\n';
    index += '/*global require*/\n';
    index += '\n';
    index += 'module.exports = {};\n';
    index += 'module.exports.Cesium = require(\'terriajs-cesium/Source/Cesium\');\n';

    var modules = glob.sync([
            './lib/**/*.js',
            './lib/**/*.ts',
            '!./lib/CopyrightModule.js',
            '!./lib/cesiumWorkerBootstrapper.js',
            '!./lib/ThirdParty/**',
            '!./lib/SvgPaths/**'
    ]);

    var directories = {};

    modules.forEach(function(filename) {
        var module = filename.substring(0, filename.length - path.extname(filename).length);
        var moduleName = path.relative('./lib', module);
        moduleName = moduleName.replace(path.sep, '/');
        var moduleParts = moduleName.split('/');

        for (var i = 0; i < moduleParts.length - 1; ++i) {
            var propertyName = moduleParts.slice(0, i + 1).join('.');
            if (!directories[propertyName]) {
                directories[propertyName] = true;
                index += 'module.exports.' + propertyName + ' = {};\n';
            }
        }

        index += 'module.exports.' + moduleParts.join('.') + ' = require(\'' + module + '\');\n';
    });

    fs.writeFileSync('terria.lib.js', index);

    runWebpack(webpackConfig, done);
});

gulp.task('docs', function() {
    var runExternalModule = require('./buildprocess/runExternalModule');

    runExternalModule('jsdoc/jsdoc.js', [
        './lib',
        '-c', './buildprocess/jsdoc.json'
    ]);
});


gulp.task('copy-cesium-assets', function() {
    var path = require('path');

    var cesiumPackage = require.resolve('terriajs-cesium/package.json');
    var cesiumRoot = path.dirname(cesiumPackage);
    var cesiumWebRoot = path.join(cesiumRoot, 'wwwroot');

    return gulp.src([
        path.join(cesiumWebRoot, '**')
    ], {
        base: cesiumWebRoot
    }).pipe(gulp.dest('wwwroot/build/Cesium'));
});

gulp.task('test-browserstack', function(done) {
    runKarma('./buildprocess/karma-browserstack.conf.js', done);
});

gulp.task('test-saucelabs', function(done) {
    runKarma('./buildprocess/karma-saucelabs.conf.js', done);
});

gulp.task('test', function(done) {
    runKarma('./buildprocess/karma-local.conf.js', done);
});

function runKarma(configFile, done) {
    var karma = require('karma').Server;
    var path = require('path');

    karma.start({
        configFile: path.join(__dirname, configFile)
    }, function(e) {
        return done(e);
    });
}
