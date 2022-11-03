"use strict";

import i18next from "i18next";
import readText from "./readText";
import { RuntimeError } from "cesium";

var parser;

function readXml(file) {
  return readText(file).then(function (result) {
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
  });
}

export default readXml;
