import URI from "urijs";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";

const loadXML = require("../Core/loadXML");
const loadWithXhr = require("../Core/loadWithXhr");

export default function XmlRequestMixin<T extends Constructor<any>>(Base: T) {
  class XmlRequestMixin extends Base {
    getXml(url: string, parameters?: any) {
      if (isDefined(parameters)) {
        url = new URI(url).query(parameters).toString();
      }
      return loadXML(url);
    }

    postXml(url: string, data: string) {
      return loadWithXhr({
        url: url,
        method: "POST",
        data,
        overrideMimeType: "text/xml",
        responseType: "document"
      });
    }
  }

  return XmlRequestMixin;
}
