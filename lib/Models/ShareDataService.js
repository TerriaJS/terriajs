"use strict";

/*global require*/
var i18next = require("i18next").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var loadJson = require("../Core/loadJson");
var loadWithXhr = require("../Core/loadWithXhr");

var TerriaError = require("../Core/TerriaError");

var ShareDataService = function(options) {
  if (!defined(options) || !defined(options.terria)) {
    throw new DeveloperError("options.terria is required.");
  }

  this.terria = options.terria;
  this.url = options.url;

  this._isUsable = undefined;
};

Object.defineProperties(ShareDataService.prototype, {
  isUsable: {
    get: function() {
      return this._isUsable;
    }
  }
});

/**
 * Initialise the service, passing through server config options.
 * @param  {Object} serverConfig Options retrieved from ServerConfig.config.
 */
ShareDataService.prototype.init = function(serverConfig) {
  this.url = defaultValue(
    this.url,
    defaultValue(this.terria.configParameters.shareUrl, "share")
  );

  if (
    typeof serverConfig === "object" &&
    typeof serverConfig.newShareUrlPrefix === "string"
  ) {
    this._isUsable = true;
  } else {
    this._isUsable = false;
  }
};

/**
 * Allocates a share token using Terria Server, storing the provided data there.
 * @param  {Object} shareData JSON to store.
 * @return {String} The token (which can later be resolved at /share/TOKEN).
 */
ShareDataService.prototype.getShareToken = function(shareData) {
  if (!this.isUsable) {
    throw new DeveloperError("ShareDataService is not usable.");
  }
  var that = this;

  return loadWithXhr({
    url: this.url,
    method: "POST",
    data: JSON.stringify(shareData),
    headers: { "Content-Type": "application/json" },
    responseType: "json"
  })
    .then(function(result) {
      if (typeof result === "string" || result instanceof String) {
        result = JSON.parse(result);
      }
      return result.id;
    })
    .otherwise(function(error) {
      console.log(error);
      that.terria.error.raiseEvent(
        new TerriaError({
          title: i18next.t("models.shareData.generateErrorTitle"),
          message: i18next.t("models.shareData.generateErrorMessage", {
            appName: that.terria.appName,
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          })
        })
      );
    });
};

/**
 * Retrieves the share data JSON from a share token.
 *
 * @param {String} token The token identifying the data.
 * @return {Promise|Object} A promise that resolves to the JSON contents, or undefined if it's not available.
 */
ShareDataService.prototype.resolveData = function(token) {
  var that = this;

  if (!this.isUsable) {
    throw new DeveloperError("ShareDataService is not usable because ###");
  }

  return loadJson(this.url + "/" + token)
    .then(function(json) {
      return json;
    })
    .otherwise(function() {
      that.terria.error.raiseEvent(
        new TerriaError({
          title: i18next.t("models.shareData.expandErrorTitle"),
          message: i18next.t("models.shareData.expandErrorMessage", {
            appName: that.terria.appName,
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          })
        })
      );

      return undefined;
    });
};

module.exports = ShareDataService;
