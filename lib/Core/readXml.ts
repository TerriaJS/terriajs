import i18next from "i18next";
import readText from "./readText";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";

let parser: DOMParser;

function readXml(file: Blob) {
  return readText(file).then(function (result) {
    if (!parser) {
      parser = new DOMParser();
    }

    if (!result) {
      return undefined;
    }
    const xml = parser.parseFromString(result, "application/xml");
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
