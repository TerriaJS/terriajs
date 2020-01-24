"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var loadXML = require("../Core/loadXML");

var xml2json = require("../ThirdParty/xml2json");

var WebMapServiceCapabilities = function(xml) {
  this.json = xml2json(xml);
};

var capabilitiesCache = {};

WebMapServiceCapabilities.fromUrl = function(url, useCache) {
  if (useCache) {
    var capabilities = capabilitiesCache[url];
    if (defined(capabilities)) {
      return capabilities;
    }
  }

  capabilitiesCache[url] = loadXML(url).then(function(xml) {
    return new WebMapServiceCapabilities(xml);
  });

  return capabilitiesCache[url];
};

module.exports = WebMapServiceCapabilities;
