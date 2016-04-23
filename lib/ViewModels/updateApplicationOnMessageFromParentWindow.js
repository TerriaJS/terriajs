'use strict';

/*global require*/
var raiseErrorToUser = require('../Models/raiseErrorToUser');

var updateApplicationOnMessageFromParentWindow = function(terria, window) {
    if (!window.parent || window.parent === window) {
        return;
    }

    window.addEventListener('message', function(event) {
        // Only accept a message from the parent window (e.g. the page embedding us in an iframe).
        if (event.source !== window.parent) {
            return;
        }
        terria.updateFromStartData(event.data).otherwise(function(e) {
            raiseErrorToUser(terria, e);
        });
    }, false);

    window.parent.postMessage('ready', '*');
};

module.exports = updateApplicationOnMessageFromParentWindow;
