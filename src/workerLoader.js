/*global require*/
"use strict";

var createTaskProcessorWorker = require('../third_party/cesium/Source/Workers/createTaskProcessorWorker');

module.exports = function(workerName) {
    return createTaskProcessorWorker.workers[workerName];
};
