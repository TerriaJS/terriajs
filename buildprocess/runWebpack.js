var gutil = require("gulp-util");
var webpack = require('webpack');

function runWebpack(config, doneCallback) {
    var wp = webpack(config);
    wp.run(function(err, stats) {
        if (stats) {
            // Fairly verbose output. See https://webpack.github.io/docs/node.js-api.html#stats-tojson for options.
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

module.exports = runWebpack;
