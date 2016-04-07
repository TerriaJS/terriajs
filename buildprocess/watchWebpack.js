var notifier = require('node-notifier');
var webpack = require('webpack');

function watchWebpack(config, doneCallback) {
    var wp = webpack(config);
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
