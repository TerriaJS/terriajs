"use strict";
import i18next from "i18next";

/*global require*/
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

function readText(file) {
  if (typeof file === "undefined") {
    throw new DeveloperError(i18next.t("core.readText.fileRequired"));
  }

  var reader = new FileReader();
  reader.readAsText(file);
  var deferred = when.defer();
  reader.onload = function(event) {
    var allText = event.target.result;
    deferred.resolve(allText);
  };
  reader.onerror = function(e) {
    deferred.reject(e);
  };
  return deferred.promise;
}

module.exports = readText;
