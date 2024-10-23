import Resource from "terriajs-cesium/Source/Core/Resource";

interface Options extends Resource.ConstructorOptions {
  responseType?: string;
  headers?: any;
  overrideMimeType?: string;
  method?: "GET" | "POST" | "PUT";
  data?: any;
}

declare function loadWithXhr(options: Options): Promise<any>;

export default loadWithXhr;
