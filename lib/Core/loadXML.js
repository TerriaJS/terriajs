const Resource = require("terriajs-cesium/Source/Core/Resource").default;

async function loadXML(urlOrResource) {
  var resource = Resource.createIfNeeded(urlOrResource);
  const respone = await resource.fetchXML();

  /**
   * Sometimes Cesium's Resource.fetchXML will return an Array Buffer (usually in Node.js env)
   * Adapted from https://github.com/fengyuanchen/is-array-buffer
   * The MIT License (MIT)
   * Copyright 2015-present Chen Fengyuan
   *
   * See full license here https://github.com/fengyuanchen/is-array-buffer/blob/main/LICENSE
   */
  if (
    respone instanceof ArrayBuffer ||
    toString.call(respone) === "[object ArrayBuffer]"
  ) {
    const enc = new TextDecoder("utf-8");
    const xmlString = enc.decode(respone);

    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
  }

  return respone;
}

module.exports = loadXML;
