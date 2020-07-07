"use strict";

/*global require*/
var i18next = require("i18next").default;
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
        title: i18next.t("models.raiseError.errorTitle"),
        message:
          // eslint-disable-next-line i18next/no-literal-string
          "<p>" +
          i18next.t("models.raiseError.errorMessage", {
            appName: terria.appName,
            email:
              '<a href="mailto:' +
              terria.supportEmail +
              '">' +
              terria.supportEmail +
              "</a>."
          }) +
          // eslint-disable-next-line i18next/no-literal-string
          "</p> <p><pre>" +
          error.toString() +
          // eslint-disable-next-line i18next/no-literal-string
          "</pre></p>"
      })
    );
  }
};

module.exports = raiseErrorToUser;
