"use strict";

/*global require,__dirname*/
/*jshint es3:false*/
var path = require('path');
var express = require('express');
var url = require('url');

var mime = express.static.mime;
mime.define({
    'application/json' : ['czml']
});

var url = require('url');
var request = require('request');

var dir = path.join(__dirname, 'public');

var app = express();
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

<<<<<<< HEAD
app.get('/proxy', function(req, res) {
    //handle proxy via leaflet
    if (Object.keys(req.query).length === 1) {
        var remoteUrl = Object.keys(req.query)[0];
    }
    else {
        var remoteUrl = decodeURIComponent(req.url.substring(8));
    }
    if (!proxyAllowedHosts[url.parse(remoteUrl).hostname.toLowerCase()]) {
        res.send(400, 'Host it not in list of allowed hosts.');
        return;
=======
app.get(/^\/proxy\/(.+)$/, function(req, res) {
    var remoteUrl = req.params[0];
    if (remoteUrl.indexOf('http') !== 0) {
        remoteUrl = 'http://' + remoteUrl;
    }

    var url = req.url;
    var queryStartIndex = url.indexOf('?');
    if (queryStartIndex >= 0) {
        remoteUrl += url.substring(queryStartIndex);
>>>>>>> 9fc18a22de4ed081c807ed793b644d92403f08d8
    }

    request.get(remoteUrl).pipe(res);
});

app.listen(3001);
