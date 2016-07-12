/*global require,importScripts,self*/
"use strict";

const DIR = '/Workers';

self.onmessage = function(event) {
    var data = event.data;
    var worker = require('terriajs-cesium/Source/Workers' + data.workerModule.substring(data.workerModule.lastIndexOf(DIR) + DIR.length));
    self.onmessage = worker;
};
