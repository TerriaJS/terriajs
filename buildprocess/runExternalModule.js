var spawnSync = require('child_process').spawnSync;
var gutil = require('gulp-util');

function runExternalModule(module, args) {
    var modulePath = require.resolve(module);

    var result = spawnSync('node', [modulePath].concat(args), {
        stdio: 'inherit',
        shell: false
    });
    if (result.status !== 0) {
        throw new gutil.PluginError(module, 'External module exited with an error.', { showStack: false });
    }
}

module.exports = runExternalModule;
