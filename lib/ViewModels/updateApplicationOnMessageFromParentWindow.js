"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var raiseErrorToUser = require("../Models/raiseErrorToUser");

var updateApplicationOnMessageFromParentWindow = function(terria, window) {
  var allowOrigin;

  window.addEventListener(
    "message",
    function(event) {
      var origin = event.origin;
      if (!defined(origin) && defined(event.originalEvent)) {
        // For Chrome, the origin property is in the event.originalEvent object.
        origin = event.originalEvent.origin;
      }

      if (
        (!defined(allowOrigin) || origin !== allowOrigin) && // allowed origin in url hash parameter
        event.source !== window.parent && // iframe parent
        event.source !== window.opener
      ) {
        // caller of window.open
        return;
      }

      // receive allowOrigin
      if (
        (event.source === window.opener || event.source === window.parent) &&
        event.data.allowOrigin
      ) {
        allowOrigin = event.data.allowOrigin;
        delete event.data.allowOrigin;
      }

      // Ignore react devtools
      if (/^react-devtools/gi.test(event.data.source)) {
        return;
      }

      terria.updateFromStartData(event.data).otherwise(function(e) {
        raiseErrorToUser(terria, e);
      });
    },
    false
  );

  if (window.parent !== window) {
    window.parent.postMessage("ready", "*");
  }

  if (window.opener) {
    window.opener.postMessage("ready", "*");
  }
};

module.exports = updateApplicationOnMessageFromParentWindow;
