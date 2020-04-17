"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var loadJson = require("../Core/loadJson");
var loadWithXhr = require("../Core/loadWithXhr");
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;

var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

var GoogleUrlShortener = function(options) {
  if (!defined(options) || !defined(options.terria)) {
    throw new DeveloperError("options.terria is required.");
  }

  this.terria = options.terria;
  this.url = defaultValue(
    options.url,
    "https://www.googleapis.com/urlshortener/v1/url"
  );
};

Object.defineProperties(GoogleUrlShortener.prototype, {
  isUsable: {
    get: function() {
      var key = this.terria.configParameters.googleUrlShortenerKey;
      return defined(key) && key !== null;
    }
  }
});

GoogleUrlShortener.prototype.shorten = function(url) {
  if (!this.isUsable) {
    throw new DeveloperError(
      "GoogleUrlShortener is not usable because Terria.configPrameters.googleUrlShortenerKey is not defined."
    );
  }

  return loadWithXhr({
    url:
      this.url + "?key=" + this.terria.configParameters.googleUrlShortenerKey,
    method: "POST",
    data: JSON.stringify({ longUrl: url }),
    headers: { "Content-Type": "application/json" },
    responseType: "json"
  }).then(function(result) {
    var hashIndex = result.id.lastIndexOf("/");
    if (hashIndex === -1 || hashIndex >= result.id.length) {
      throw new RuntimeError(
        i18next.t("models.googleUrlShortener.unexpectedResult")
      );
    } else {
      return result.id.substring(hashIndex + 1);
    }
  });
};

/**
 * Expands the URL associated with a given token.
 *
 * @param {String} token The token for which to get the expanded URL.
 * @return {Promise|Object} A promise that resolves to the expanded URL.  If the token does not exist, the promise resolves to undefined.
 */
GoogleUrlShortener.prototype.expand = function(token) {
  var that = this;
  var corsProxy = this.terria.corsProxy;

  if (!this.isUsable) {
    throw new DeveloperError(
      "GoogleUrlShortener is not usable because Terria.configPrameters.googleUrlShortenerKey is not defined."
    );
  }

  var url = corsProxy.getURLProxyIfNecessary(
    that.url +
      "?key=" +
      that.terria.configParameters.googleUrlShortenerKey +
      "&shortUrl=http://goo.gl/" +
      token
  );

  return loadJson(url)
    .then(function(json) {
      return json.longUrl;
    })
    .otherwise(function() {
      that.terria.error.raiseEvent(
        new TerriaError({
          title: i18next.t("models.googleUrlShortener.urlNotLocatedTitle"),
          message: i18next.t("models.googleUrlShortener.urlNotLocatedTitle", {
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

module.exports = GoogleUrlShortener;
