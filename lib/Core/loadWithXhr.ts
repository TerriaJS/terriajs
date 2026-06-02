import Resource from "terriajs-cesium/Source/Core/Resource";
import TerriaError from "./TerriaError";

interface Options extends Resource.ConstructorOptions {
  responseType?: string;
  headers?: any;
  overrideMimeType?: string;
  method?: "GET" | "POST" | "PUT";
  data?: any;
}

/**
 * When true, {@link loadWithXhr} rejects any non-GET request.
 *
 * Defaults to `false` so POST/PUT requests work out of the box (the OSS
 * behaviour). Deployments that must forbid non-GET XHR (e.g. a locked-down
 * SaaS configuration) can flip this via the `disablePostRequests` config
 * parameter, which calls {@link setPostRequestsDisabled} on startup.
 */
let postRequestsDisabled = false;

/** Enable or disable non-GET requests through {@link loadWithXhr}. */
export function setPostRequestsDisabled(value: boolean): void {
  postRequestsDisabled = value;
}

/** Whether non-GET requests through {@link loadWithXhr} are currently disabled. */
export function arePostRequestsDisabled(): boolean {
  return postRequestsDisabled;
}

export default function loadWithXhr(options: Options): Promise<any> {
  const method = options.method ?? "GET";

  if (postRequestsDisabled && method !== "GET") {
    throw new TerriaError({
      title: "HTTP method not supported",
      message: `HTTP method ${method} is not supported by this Terria configuration.`
    });
  }

  // Take advantage that most parameters are the same
  const resource = new Resource(options);

  // @ts-expect-error Calling "private" method without type declaration.
  return resource._makeRequest({
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    method,
    data: options.data
  });
}

Object.defineProperties(loadWithXhr, {
  load: {
    get: function () {
      // @ts-expect-error Calling "private" method without type declaration.
      return Resource._Implementations.loadWithXhr;
    },
    set: function (value) {
      // @ts-expect-error Calling "private" method without type declaration.
      Resource._Implementations.loadWithXhr = value;
    }
  },

  defaultLoad: {
    get: function () {
      // @ts-expect-error Calling "private" method without type declaration.
      return Resource._DefaultImplementations.loadWithXhr;
    }
  }
});
