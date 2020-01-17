"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
var FeatureDetection = require("terriajs-cesium/Source/Core/FeatureDetection")
  .default;
var TerriaError = require("../Core/TerriaError");
import i18next from "i18next";

// Unfortunately there's no way to feature-detect for this, it's something that only MS browsers disallow for security reasons.
var canUseDataUriInHref = !(
  FeatureDetection.isInternetExplorer() || /Edge/.exec(navigator.userAgent)
);

var DataUri = {
  /**
   * Turn a file with the supplied type and stringified data into a data uri that can be set as the href of an anchor tag.
   * @param {String} type Data type, eg. 'json' or 'csv'.
   * @param {String} dataString The data.
   * @return {String} A string that can be used to in an anchor tag's 'href' attribute to represent downloadable data.
   */
  make: function(type, dataString) {
    if (dataString) {
      // Using attachment/* mime type makes safari download as attachment. text/* works on Chrome (as does attachment).
      return "data:attachment/" + type + "," + encodeURIComponent(dataString);
    }
  },

  /**
   * Returns a flag stating if data uri links are supported by the user's browser.
   * If errorEvent is provided, presents an error message explaining why it won't work.
   * @param {Error} [errorEvent] A Cesium Event, eg. terria.error, used to raise an error if the browser does not support data download.
   * @param {String} [href] The link to provide in the error message. Required if errorEvent is provided.
   * @param {Boolean} [forceError] If true, always show the error message. Defaults to false, which only shows it if the browser cannot download uri links.
   * @return {Boolean} Returns whether the browser is compatible with data uris.
   */
  checkCompatibility: function(errorEvent, href, forceError) {
    if (!canUseDataUriInHref || forceError) {
      if (defined(errorEvent)) {
        errorEvent.raiseEvent(
          new TerriaError({
            title: i18next.t("core.dataUri.errorTitle"),
            message: i18next.t("core.dataUri.errorMessage", { href: href })
          })
        );
      }
      return false;
    } else {
      return true;
    }
  }
};

module.exports = DataUri;
