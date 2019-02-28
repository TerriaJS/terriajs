var PluginError = require("plugin-error");

function runWebpack(webpack, config, doneCallback) {
    // webpack is passed as a parameter instead of require-in because otherwise, when TerriaJS is npm link'd,
    // node will end up loading two copies of webpack.  That causes problems with some plugins (e.g. dedupe).
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
                // uncomment this line to write stats about the
                // build that can be visualized at http://webpack.github.io/analyse/
                //require('fs').writeFileSync('./stats.json', JSON.stringify(jsonStats));

                if (jsonStats.errors && jsonStats.errors.length > 0) {
                    err = new PluginError('build-specs', 'Build has errors (see above).');
                }
            }
        }

        doneCallback(err);
    });
}

module.exports = runWebpack;
