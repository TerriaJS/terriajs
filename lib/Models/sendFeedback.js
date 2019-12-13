"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var loadWithXhr = require("../Core/loadWithXhr");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var BuildShareLink = require("../ReactViews/Map/Panels/SharePanel/BuildShareLink");
var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

function sendFeedback(options) {
  if (!defined(options) || !defined(options.terria)) {
    throw new DeveloperError("options.terria is required.");
  }

  var terria = options.terria;

  if (!defined(terria.configParameters.feedbackUrl)) {
    raiseError(terria);
    return;
  }

  const shareLinkPromise = options.sendShareURL
    ? BuildShareLink.canShorten(terria)
      ? BuildShareLink.buildShortShareLink(terria)
      : when(BuildShareLink.buildShareLink(terria))
    : when("Not shared");

  return shareLinkPromise
    .then(shareLink => {
      const feedbackData = {
        title: options.title,
        name: options.name,
        email: options.email,
        shareLink: shareLink,
        comment: options.comment
      };
      if (
        options.additionalParameters &&
        terria.serverConfig.config &&
        terria.serverConfig.config.additionalFeedbackParameters
      ) {
        terria.serverConfig.config.additionalFeedbackParameters.forEach(
          ({ name }) => {
            feedbackData[name] = options.additionalParameters[name];
          }
        );
      }
      return loadWithXhr({
        url: terria.configParameters.feedbackUrl,
        responseType: "json",
        method: "POST",
        data: JSON.stringify(feedbackData),
        headers: {
          "Content-Type": "application/json"
        }
      });
    })
    .then(function(json) {
      if (json instanceof String || typeof json === "string") {
        json = JSON.parse(json);
      }

      if (!json || !json.result || json.result !== "SUCCESS") {
        raiseError(terria);
        return false;
      } else {
        terria.error.raiseEvent(
          new TerriaError({
            title: i18next.t("models.feedback.thanksTitle"),
            message: i18next.t("models.feedback.thanksMessage", {
              appName: terria.appName
            })
          })
        );
        return true;
      }
    })
    .otherwise(function() {
      raiseError(terria);
      return false;
    });
}

function raiseError(terria) {
  terria.error.raiseEvent(
    new TerriaError({
      title: i18next.t("models.feedback.unableToSendTitle"),
      message: i18next.t("models.feedback.unableToSendTitle", {
        email:
          '<a href="mailto:' +
          terria.supportEmail +
          '">' +
          terria.supportEmail +
          "</a>."
      })
    })
  );
}

module.exports = sendFeedback;
