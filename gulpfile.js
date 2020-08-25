/*eslint-env node*/
/*eslint no-sync: 0*/

'use strict';

/*global require*/

// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// so that our postinstall script (which runs `gulp post-npm-install`) is able to run without
// the devDependencies available.  Individual tasks, other than `post-npm-install` and any tasks it
// calls, may require in `devDependency` modules locally.
var gulp = require('gulp');

gulp.task('build-specs', function(done) {
    var runWebpack = require('./buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.make.js')(false, true);

    runWebpack(webpack, webpackConfig, done);
});

gulp.task('release-specs', function(done) {
    var runWebpack = require('./buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.make.js')(false, false);

    runWebpack(webpack, webpackConfig, done);
});

gulp.task('watch-specs', function(done) {
    var watchWebpack = require('./buildprocess/watchWebpack');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.make.js')(false, true);

    watchWebpack(webpack, webpackConfig, done);
});

gulp.task('make-schema', function() {
    var genSchema = require('generate-terriajs-schema');
    var schemaSourceGlob = require('./buildprocess/schemaSourceGlob');

    return genSchema({
        sourceGlob: schemaSourceGlob,
        dest: 'wwwroot/schema',
        noversionsubdir: true,
        quiet: true
    });
});

gulp.task('lint', function(done) {
    var runExternalModule = require('./buildprocess/runExternalModule');

    runExternalModule('eslint/bin/eslint.js', [
        'lib', 'test',
        '--ext', '.jsx',
        '--ext', '.js',
        '--ignore-pattern', 'lib/ThirdParty',
        '--max-warnings', '0'
    ]);

    done();
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

gulp.task('test-electron', function(done) {
    runKarma('./buildprocess/karma-electron.conf.js', done);
});

gulp.task('test-travis', function(done) {
    if (process.env.SAUCE_ACCESS_KEY) {
        runKarma('./buildprocess/karma-saucelabs.conf.js', done);
    } else {
        console.log('SauceLabs testing is not available for pull requests outside the main repo; using Electron instead.');
        runKarma('./buildprocess/karma-electron.conf.js', done);
    }
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

gulp.task('code-attribution', function userAttribution(done) {
    var spawnSync = require('child_process').spawnSync;
    
    var result = spawnSync('yarn', ['licenses generate-disclaimer > doc/acknowledgements/attributions.md'], {
        stdio: 'inherit',
        shell: true
    });
    if (result.status !== 0) {
        throw new Error('Generating code attribution exited with an error.\n' + result.stderr.toString(), { showStack: false });
    }
    done();

})

gulp.task('user-guide', gulp.series(gulp.parallel('make-schema', 'code-attribution'), function userGuide(done) {
    var fse = require('fs-extra');
    var klawSync = require('klaw-sync');
    var path = require('path');
    var PluginError = require('plugin-error');
    var spawnSync = require('child_process').spawnSync;

    fse.copySync('mkdocs.yml', 'build/mkdocs.yml');
    fse.copySync('doc', 'build/doc');

    var files = klawSync('build/doc').map(o => o.path);
    var markdown = files.filter(name => path.extname(name) === '.md');
    var readmes = markdown.filter(name => name.indexOf('README.md') === name.length - 'README.md'.length);

    // Rename all README.md to index.md
    readmes.forEach(readme => fse.renameSync(readme, path.join(path.dirname(readme), 'index.md')));

    // Replace links to README.md with links to index.md
    markdown.forEach(function(name) {
        name = name.replace(/README\.md/, 'index.md');
        var content = fse.readFileSync(name, 'UTF-8');
        var replaced = content.replace(/README\.md/g, 'index.md');
        if (content !== replaced) {
            fse.writeFileSync(name, replaced, 'UTF-8');
        }
    });

    // Replace README.md with index.md in mkdocs.yml.
    // Also replace swap in the actual path to mkdocs-material in node_modules.
    var mkdocsyml = fse.readFileSync('build/mkdocs.yml', 'UTF-8');
    mkdocsyml = mkdocsyml.replace(/README\.md/g, 'index.md');
    fse.writeFileSync('build/mkdocs.yml', mkdocsyml, 'UTF-8');

    var result = spawnSync('mkdocs', ['build', '--clean', '--config-file', 'mkdocs.yml'], {
        cwd: 'build',
        stdio: 'inherit',
        shell: false
    });
    if (result.status !== 0) {
        throw new PluginError('user-doc', 'External module exited with an error.', { showStack: false });
    }

    done();
}));

gulp.task('docs', gulp.series('user-guide', function docs(done) {
    var fse = require('fs-extra');
    fse.copySync('doc/index-built.html', 'wwwroot/doc/index.html');
    done();
}));

gulp.task('build', gulp.series('copy-cesium-assets', 'build-specs'));
gulp.task('release', gulp.series('copy-cesium-assets', 'release-specs'));
gulp.task('watch', gulp.series('copy-cesium-assets', 'watch-specs'));
gulp.task('post-npm-install', gulp.series('copy-cesium-assets'));
gulp.task('default', gulp.series('lint', 'build'));
