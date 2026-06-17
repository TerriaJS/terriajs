import Resource from "terriajs-cesium/Source/Core/Resource";

async function loadXML(
  urlOrResource: string | Resource
): Promise<XMLDocument | undefined> {
  const resource = (Resource as any).createIfNeeded(urlOrResource) as Resource;
  const response = await resource.fetchXML();

  /**
   * Sometimes Cesium's Resource.fetchXML will return an Array Buffer (usually in Node.js env)
   * Adapted from https://github.com/fengyuanchen/is-array-buffer
   * The MIT License (MIT)
   * Copyright 2015-present Chen Fengyuan
   *
   * See full license here https://github.com/fengyuanchen/is-array-buffer/blob/main/LICENSE
   */
  if (
    response instanceof ArrayBuffer ||
    toString.call(response) === "[object ArrayBuffer]"
  ) {
    const enc = new TextDecoder("utf-8");
    const xmlString = enc.decode(response as any);

    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
  }

  return response;
}

export default loadXML;
