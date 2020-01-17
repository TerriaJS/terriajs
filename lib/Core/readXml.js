"use strict";

import i18next from "i18next";
/*global require*/
var readText = require("./readText");

var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var parser = new DOMParser();

function readXml(file) {
  return when(
    readText(file),
    function(result) {
      var xml = parser.parseFromString(result, "application/xml");
      if (
        !xml ||
        !xml.documentElement ||
        xml.getElementsByTagName("parsererror").length > 0
      ) {
        throw new RuntimeError(i18next.t("core.readXml.xmlError"));
      }
      return xml;
    },
    function(e) {
      throw e;
    }
  );
}

module.exports = readXml;
