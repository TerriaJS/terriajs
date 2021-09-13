"use strict";

const i18next = require("i18next").default;
var readText = require("./readText");

var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var parser;

function readXml(file) {
  return when(
    readText(file),
    function(result) {
      if (!parser) {
        parser = new DOMParser();
      }

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
