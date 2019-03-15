var notifier = require('node-notifier');

function watchWebpack(webpack, config, doneCallback) {
    // webpack is passed as a parameter instead of require-in because otherwise, when TerriaJS is npm link'd,
    // node will end up loading two copies of webpack.  That causes problems with some plugins (e.g. dedupe).
    var wp = webpack(config);
    wp.hooks.watchRun.tap('NoteStart', function() {
        console.log('STARTING INCREMENTAL WEBPACK');
    });
    wp.watch({}, function(err, stats) {
        if (stats) {
            // Fairly minimal output for 'gulp watch'.
            console.log(stats.toString({
                colors: true,
                modules: false,
                chunkModules: false,
                version: false,
                hash: false,
                chunks: true,
                assets: false
            }));
            console.log('DONE INCREMENTAL WEBPACK');

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
}

module.exports = watchWebpack;
