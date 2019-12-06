"use strict";

/*global require*/

var TerriaError = require("../Core/TerriaError");

var raiseErrorToUser = function(terria, error) {
  if (error instanceof TerriaError) {
    if (!error.raisedToUser) {
      error.raisedToUser = true;
      terria.error.raiseEvent(error);
    }
  } else {
    terria.error.raiseEvent(
      new TerriaError({
        sender: undefined,
        title: "An error occurred",
        message:
          "\
<p>" +
          terria.appName +
          ' experienced an error.  Please report this by emailing <a href="mailto:' +
          terria.supportEmail +
          '">' +
          terria.supportEmail +
          "</a>.  \
Details of the error are below.</p>\
<p><pre>" +
          error.toString() +
          "</pre></p>"
      })
    );
  }
};

module.exports = raiseErrorToUser;
