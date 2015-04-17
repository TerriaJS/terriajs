"use strict";

/*global require,__dirname*/
/*jshint es3:false*/

var express = require('express');
var compression = require('compression');
var path = require('path');
var cors = require('cors');

//TODO: check if this loads the file into each core and if so then,

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


app.listen(argv.port, argv.public ? undefined : 'localhost');

