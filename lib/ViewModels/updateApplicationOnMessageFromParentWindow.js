'use strict';

/*global require*/
var raiseErrorToUser = require('../Models/raiseErrorToUser');

var updateApplicationOnMessageFromParentWindow = function(terria, window) {
    var allowOrigin = '';

    window.addEventListener('message', function(event) {
        var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

        if (origin !== window.location.origin && // same origin
            origin !== allowOrigin && // allowed origin in url hash parameter
            event.source !== window.parent && // iframe parent
            event.source !== window.opener) { // window opener
            return;
        }
        
        // receive allowOrigin
        if ((event.source === window.opener || event.source === window.parent) && event.data.allowOrigin) {
            allowOrigin = event.data.allowOrigin;
            delete event.data.allowOrigin;
        }
  
        terria.updateFromStartData(event.data).otherwise(function(e) {
            raiseErrorToUser(terria, e);
        });
    }, false);

    if (window.parent !== window) {
        window.parent.postMessage('ready', '*');
    }
    
    if (window.opener) {
        window.opener.postMessage('ready', '*');
    }
};

module.exports = updateApplicationOnMessageFromParentWindow;
