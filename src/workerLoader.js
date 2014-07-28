/*global require*/
"use strict";

var createTaskProcessorWorker = require('../public/cesium/Source/Workers/createTaskProcessorWorker');

module.exports = function(workerName) {
    return createTaskProcessorWorker.workers[workerName];
};
