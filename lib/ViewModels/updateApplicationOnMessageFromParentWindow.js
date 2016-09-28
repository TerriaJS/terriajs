'use strict';

/*global require*/
var raiseErrorToUser = require('../Models/raiseErrorToUser');
var queryToObject = require('terriajs-cesium/Source/Core/queryToObject');
var URI = require('urijs');

var updateApplicationOnMessageFromParentWindow = function(terria, window) {
    /* Commenting this out. Window.parent === window is true if window.open is used to create the Terria window.
    if (!window.parent || window.parent === window) {
        return;
    }
    */

    var uri = new URI(window.location);
    var hashProperties = queryToObject(uri.fragment());
    console.log(hashProperties);

    window.addEventListener('message', function(event) {
        var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
  
        if (origin !== window.location.origin && // same origin
            origin !== getURIAllowedOrigin(window) && // allowed origin in url hash parameter
            event.source !== window.parent) { // iframe parent
            return;
        }
  
        terria.updateFromStartData(event.data).otherwise(function(e) {
            raiseErrorToUser(terria, e);
        });
    }, false);

    window.parent.postMessage('ready', '*');
};

function getURIAllowedOrigin(window) {
    var uri = new URI(window.location);
    var hashProperties = queryToObject(uri.fragment());
    return hashProperties.allowOrigin || window.location.origin;
}

module.exports = updateApplicationOnMessageFromParentWindow;
