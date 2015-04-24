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
        'default' : 3002,
        'description' : 'Port to listen on.'
    },
    'public' : {
        'type' : 'boolean',
        'default' : true,
        'description' : 'Run a public server that listens on all interfaces.'
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
app.use(express.static(path.join(__dirname, 'wwwroot')));

console.log('Listening on port ' + argv.port);
app.listen(argv.port, argv.public ? undefined : 'localhost');

