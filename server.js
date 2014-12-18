"use strict";


var url = require('url');
var configSettings = require('./public/config.json');

function getRemoteUrlFromParam(req) {
    var remoteUrl = req.params[0];
    if (remoteUrl.indexOf('_') === 0) {
        remoteUrl = remoteUrl.substring(remoteUrl.indexOf('/')+1);
    }
    if (remoteUrl) {
        // add http:// to the URL if no protocol is present
        if (!/^https?:\/\//.test(remoteUrl)) {
            remoteUrl = 'http://' + remoteUrl;
        }
        remoteUrl = url.parse(remoteUrl);
        // copy query string
        remoteUrl.search = url.parse(req.url).search;
    }
    return remoteUrl;
}

var dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;

function filterHeaders(req, headers) {
    var result = {};
    // filter out headers that are listed in the regex above
    Object.keys(headers).forEach(function(name) {
        if (!dontProxyHeaderRegex.test(name)) {
            result[name] = headers[name];
        }
    }); 

    result['Cache-Control'] = 'max-age=315360000';
    result['Expires'] = 'Thu, 31 Dec 2037 23:55:55 GMT';
    result['Access-Control-Allow-Origin'] ='*';
    delete result['pragma'];

    return result;
}

var proxyDomains = configSettings.proxyDomains;

    
//Non CORS hosts and domains we proxy to
function proxyAllowedHost(host) {
    host = host.toLowerCase();
    //check that host is from one of these domains
    for (var i = 0; i < proxyDomains.length; i++) {
        if (host.indexOf(proxyDomains[i], host.length - proxyDomains[i].length) !== -1) {
            return true;
        }
    }
    return false;
}

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

    /*global console,require,__dirname*/
    /*jshint es3:false*/

    var express = require('express');
    var fs = require('fs');
    var compression = require('compression');
    var request = require('request');
    var path = require('path');
    var cors = require('cors');
    var formidable = require('formidable');
    var ogr2ogr = require('ogr2ogr');
    var proj4 = require('proj4');

    //TODO: check if this loads the file into each core and if so then,
    require('proj4js-defs/epsg')(proj4);

    var yargs = require('yargs').options({
        'port' : {
            'default' : 3001,
            'description' : 'Port to listen on.'
        },
        'public' : {
            'type' : 'boolean',
            'default' : true,
            'description' : 'Run a public server that listens on all interfaces.'
        },
        'upstream-proxy' : {
            'description' : 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
        },
        'bypass-upstream-proxy-hosts' : {
            'description' : 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
        },
        'help' : {
            'alias' : 'h',
            'type' : 'boolean',
            'description' : 'Show this help.'
        }
    });
    var argv = yargs.argv;

    if (argv.help) {
        return yargs.showHelp();
    }

    // eventually this mime type configuration will need to change
    // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
    var mime = express.static.mime;
    mime.define({
        'application/json' : ['czml', 'json', 'geojson'],
        'text/plain' : ['glsl']
    });

    var app = express();
    app.use(compression());
    app.use(cors());
    app.disable('etag');
    app.use(express.static(path.join(__dirname, 'public')));

    var upstreamProxy = argv['upstream-proxy'];
    var bypassUpstreamProxyHosts = {};
    if (argv['bypass-upstream-proxy-hosts']) {
        argv['bypass-upstream-proxy-hosts'].split(',').forEach(function(host) {
            bypassUpstreamProxyHosts[host.toLowerCase()] = true;
        });
    }

    app.get('/ping', function(req, res){
      res.status(200).send('OK');
    });
    
    app.get('/proxy/*', function(req, res, next) {
        // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
        var remoteUrl = getRemoteUrlFromParam(req);
        if (!remoteUrl) {
            // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
            remoteUrl = Object.keys(req.query)[0];
            if (remoteUrl) {
                remoteUrl = url.parse(remoteUrl);
            }
        }

        if (!remoteUrl) {
            return res.status(400).send('No url specified.');
        }

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
            proxy = upstreamProxy;
        }

        //If you want to run a CORS proxy to data source, remove this section
        if (!proxyAllowedHost(remoteUrl.host)) {
            res.status(400).send('Host is not in list of allowed hosts: ' + remoteUrl.host);
            return;
        }
 
         // encoding : null means "body" passed to the callback will be raw bytes

        request.get({
            url : url.format(remoteUrl),
            headers : filterHeaders(req, req.headers),
            encoding : null,
            proxy : proxy
        }, function(error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }

            res.status(code).send(body);
        });
    });

    //provide REST service for proj4 definition strings
    app.get('/proj4def/:crs', function(req, res, next) {
        var crs = req.param('crs');
        var epsg = proj4.defs[crs.toUpperCase()];
        if (epsg !== undefined) {
            res.status(200).send(epsg);
        } else {
            res.status(500).send('no proj4 definition');
        }
    });

    // provide conversion to geojson service
    // reguires install of gdal on server: sudo apt-get install gdal-bin
    app.post('/convert', function(req, res, next) {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var fname, fpath, inputStream;
            var maxSize = 1000000;

            if (fields.input_url !== undefined) {
                if (fields.input_url.indexOf('http') === 0) {
                    fpath = fields.input_url;
                    fname = fpath;
                }
            } else if (files.input_file !== undefined) {
                if (files.input_file.size <= maxSize) {
                    fpath = files.input_file.path;
                    fname = files.input_file.name;
                } else {
                    console.log('Input file is too large', files.input_file.size);
                }
            }
            if (fpath === undefined) {
                res.status(500).send('Unable to convert data');
                return;
            }
            console.log('Converting', fname);

            var hint = '';
            //simple hint for now, might need to crack zip files going forward
            if (fname.toLowerCase().indexOf('.zip') === fname.length-4) {
                hint = 'shp';
            }

            if (fpath.indexOf('http') === 0) {
                 inputStream = request.get({url: fpath}).on('response', function(response) {
                    var request = this, len = 0;
                    response.on('data', function (chunk) {
                        len += chunk.length;
                        if (len > maxSize) {
                            request.abort();
                        }
                    });
                    response.on('end', function() {
                        console.log('Convert download size', len);
                    });
                });
            } else {
                inputStream = fs.createReadStream(fpath);
            }

            var ogr = ogr2ogr(inputStream, hint)
                            .skipfailures()
                            .options(['-t_srs', 'EPSG:4326']);

            ogr.exec(function (er, data) {
                if (er) { 
                    console.error(er);
                }
                if (data !== undefined) {
                    res.status(200).send(JSON.stringify(data));
                } else {
                    res.status(500).send('Unable to convert data');
                }
            })
        });
    });


    //Share record storage
    app.post('/upload', function(req, res, next) {
    });

    
    app.get('/get/:id', function(req, res, next) {
    });


    //sample simple NM service
    app.post('/nm_service_1', function(req, res, next) {
        //receive the posted object
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            //create a layer for NM to display
            var obj = {
                name: 'Bikes Available', 
                type: 'DATA', 
                proxy: false,
                url: 'http://nationalmap.nicta.com.au/test/bike_racks.geojson'
            };
            //send a response with the object and display text
            res.json({ displayHtml: 'Here are the available bike racks.', layer: obj});
        });
    });

    app.listen(argv.port, argv.public ? undefined : 'localhost');
}
