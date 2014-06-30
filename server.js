"use strict";

// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;
    
//    cpuCount = 1;  //testing

    console.log('Cores Used:', cpuCount);

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function (worker) {

        // Replace the dead worker, we're not sentimental
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {

    /*global require,__dirname*/
    /*jshint es3:false*/
    var path = require('path');
    var express = require('express');
    var url = require('url');
    var cors = require('cors');

    var mime = express.static.mime;
    mime.define({
        'application/json' : ['czml']
    });

    var url = require('url');
    var request = require('request');

    var dir = path.join(__dirname, 'public');

    var app = express();
    app.use(cors());
    //app.use(express.compress());
    app.use(express.static(dir));

    var proxyAllowedHosts = {
        'services.arcgisonline.com' : true,
        'spatialreference.org' : true,
        'www2.landgate.wa.gov.au' : true,
        'geofabric.bom.gov.au' : true,
        'www.ga.gov.au' : true,
        'www.googleapis.com' : true,
        'data.gov.au' : true
    };

    app.get(/^\/proxy\/(.+)$/, function(req, res) {
        var remoteUrl = req.params[0];
        if (remoteUrl.indexOf('http') !== 0) {
            remoteUrl = 'http://' + remoteUrl;
        }

        var url = req.url;
        var queryStartIndex = url.indexOf('?');
        if (queryStartIndex >= 0) {
            remoteUrl += url.substring(queryStartIndex);
        }

        request.get(remoteUrl).pipe(res);
    });

    app.listen(3001);
}
