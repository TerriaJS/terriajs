/* eslint-disable prefer-rest-params */
import fetch, { Headers, Request, Response } from "node-fetch";
import Resource from "terriajs-cesium/Source/Core/Resource";
import URI from "urijs";

/** Cached lightweight JSDOM window reused across calls to avoid leaking instances. */
let _cachedJsdomWindow: { XMLHttpRequest: any; DOMParser: any } | undefined;

export type PatchNetworkRequestsOptions = {
  /** Patch window.XMLHttpRequest.prototype.open for URL rewriting and basic auth. Default: true */
  xhr?: boolean;
  /** Patch Cesium Resource._Implementations.loadWithXhr for URL rewriting. Default: true */
  cesiumResource?: boolean;
  /** Replace global.fetch with a URL-rewriting/auth version. Default: true */
  fetch?: boolean;
  assignXmlHttpRequestToGlobal?: boolean;
  assignDomParserToGlobal?: boolean;
  jsDomGlobal?: boolean;
};

/** Patch XMLHttpRequest and Fetch so they work correctly in Node.js
 * Also supports `basicAuth` token, which will be added to all requests which use `baseUrl` or start with `/proxy`
 *
 * When running inside a shared process (e.g. Next.js), use `options` to limit
 * which patches are applied to avoid polluting the host process globals.
 */
export default function patchNetworkRequests(
  baseUrl: string,
  basicAuth: string | undefined,
  logFailedRequest: boolean = false,
  logTag?: string,
  options?: PatchNetworkRequestsOptions
) {
  const tag = logTag ? `[${logTag}] ` : "";
  const opts = {
    xhr: true,
    cesiumResource: true,
    fetch: true,
    assignXmlHttpRequestToGlobal: true,
    assignDomParserToGlobal: true,
    jsDomGlobal: true,
    ...options
  };

  // Overwrite browser APIs (eg XMLHttpRequest and fetch)
  if (opts.jsDomGlobal) {
    console.log(`${tag}Applying jsdom-global to ${baseUrl}`);
    require("jsdom-global")(undefined, {
      url: baseUrl
    });
  }

  // Add basic auth token for all XMLHttpRequest/fetch that use baseUrl hostname

  const baseHostname = URI(baseUrl).hostname();

  if (opts.xhr) {
    console.log(`${tag}Applying XMLHttpRequest patch to ${baseUrl}`);
    // Adapted from https://stackoverflow.com/a/43875390
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (
      _method: string,
      url: string
    ) {
      // All URLs need to be absolute - so add the base URL if it's not already there
      if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        console.log(
          `${tag}Rewrite relative URL: \`${url}\` to \`${baseUrl}${url}\``
        );
        arguments[1] = `${baseUrl}${url}`;
        url = `${baseUrl}${url}`;
      }

      open.apply(this, arguments as any);

      console.log("\x1b[35m%s\x1b[0m", `${tag}Making XHR: ${url}`);

      if (basicAuth) {
        if (URI(url).hostname() === baseHostname || url.startsWith("proxy/")) {
          this.setRequestHeader("authorization", `Basic ${basicAuth}`);
        }
      }

      if (logFailedRequest) {
        this.onloadend = (req) => {
          if (this.status < 200 || this.status >= 300) {
            console.log(tag, "\n\n\n");
            console.log(tag, this.responseURL);
            console.log(tag, URI(this.responseURL).hostname() === baseHostname);
            console.log(tag, "\n\n\n");
          }
        };
      }
    };
  }

  if (opts.cesiumResource) {
    const impl = (Resource as any)._Implementations;
    // Store the original so repeated calls don't stack wrappers
    if (!impl._originalLoadWithXhr) {
      impl._originalLoadWithXhr = impl.loadWithXhr;
    }
    console.log(`${tag}Applying Cesium Resource patch to ${baseUrl}`);
    const load = impl._originalLoadWithXhr;
    impl.loadWithXhr = function (...args: any) {
      console.log(
        "\x1b[35m%s\x1b[0m",
        `${tag}Loading resource request: ${args[0]}`
      );

      // All URLs need to be absolute - so add the base URL if it's not already there
      if (
        args[0].indexOf("http://") !== 0 &&
        args[0].indexOf("https://") !== 0
      ) {
        console.log(
          `${tag}Rewrite relative URL: \`${args[0]}\` to \`${baseUrl}${args[0]}\``
        );
        args[0] = `${baseUrl}${args[0]}`;
      }

      load.apply(this, args);
    };
  }

  if (opts.fetch) {
    console.log(`${tag}Applying fetch patch to ${baseUrl}`);
    // A fun method to add Auth headers to all requests with baseUrl
    const newFetch = (
      input: RequestInfo,
      init?: RequestInit
    ): Promise<Response> => {
      let url = typeof input === "string" ? input : input.url;

      console.log("\x1b[35m%s\x1b[0m", `${tag}Making fetch request: ${url}`);

      // All URLs need to be absolute - so add the base URL if it's not already there
      if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        console.log(
          `${tag}Rewrite relative URL: \`${url}\` to \`${baseUrl}${url}\``
        );
        url = `${baseUrl}${url}`;
      }

      if (
        (basicAuth && URI(url).hostname() === baseHostname) ||
        url.startsWith("proxy/")
      ) {
        if (!init) {
          init = {};
        }
        if (init.headers) {
          if (Array.isArray(init.headers)) {
            init.headers.push(["authorization", `Basic ${basicAuth}`]);
          } else if (init.headers instanceof Headers) {
            init.headers = [
              ...Array.from(init.headers.entries()),
              ["authorization", `Basic ${basicAuth}`]
            ];
          } else {
            init.headers = [
              ...Object.entries(init.headers),
              ["authorization", `Basic ${basicAuth}`]
            ];
          }
        } else {
          init.headers = [["authorization", `Basic ${basicAuth}`]];
        }
      }

      return fetch(input as any, init as any) as any;
    };
    global.fetch = newFetch as any;

    // Set global fetch objects from node-fetch
    global.Headers = Headers as any;
    global.Request = Request as any;
    global.Response = Response as any;
  }

  // When jsdom-global is not used, create a lightweight JSDOM instance
  // to pull browser APIs from (XMLHttpRequest, DOMParser).
  // Reuse across calls to avoid creating multiple JSDOM instances.
  const needsJsdomInstance =
    !opts.jsDomGlobal &&
    (opts.assignXmlHttpRequestToGlobal || opts.assignDomParserToGlobal);
  if (needsJsdomInstance && !_cachedJsdomWindow) {
    _cachedJsdomWindow = new (require("jsdom").JSDOM)("", {
      url: baseUrl
    }).window;
  }
  const jsdomWindow = needsJsdomInstance ? _cachedJsdomWindow : undefined;

  if (opts.assignXmlHttpRequestToGlobal) {
    if (!opts.jsDomGlobal && !jsdomWindow) {
      throw new Error(
        "Cannot assign XMLHttpRequest: JSDOM window not available"
      );
    }
    console.log(`${tag}Assigning XMLHttpRequest to global`);
    global.XMLHttpRequest = opts.jsDomGlobal
      ? window.XMLHttpRequest
      : jsdomWindow!.XMLHttpRequest;
  }

  if (opts.assignDomParserToGlobal) {
    if (!opts.jsDomGlobal && !jsdomWindow) {
      throw new Error("Cannot assign DOMParser: JSDOM window not available");
    }
    console.log(`${tag}Assigning DOMParser to global`);
    global.DOMParser = opts.jsDomGlobal
      ? window.DOMParser
      : jsdomWindow!.DOMParser;
  }
}
