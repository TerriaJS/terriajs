/* eslint-disable prefer-rest-params */
import Resource from "terriajs-cesium/Source/Core/Resource";

/** Patch XMLHttpRequest and Fetch so they work correctly in Node.js
 * Also supports `basicAuth` token, which will be added to all requests which use `baseUrl` or start with `/proxy`
 */
export default function patchNetworkRequests(
  baseUrl: string,
  basicAuth: string | undefined,
  logFailedRequest: boolean = false
) {
  // Overwrite browser APIs (eg XMLHttpRequest and fetch)
  require("jsdom-global")(undefined, {
    url: baseUrl
  });

  // Add basic auth token for all XMLHttpRequest/fetch that use baseUrl hostname

  const baseHostname = new URL(baseUrl).hostname;

  // Adapted from https://stackoverflow.com/a/43875390
  const open = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (
    _method: string,
    url: string
  ) {
    // All URLs need to be absolute - so add the base URL if it's not already there
    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
      console.log(`Rewrite relative URL: \`${url}\` to \`${arguments[1]}\``);
      arguments[1] = `${baseUrl}${url}`;
      url = `${baseUrl}${url}`;
    }

    open.apply(this, arguments as any);

    console.log("\x1b[35m%s\x1b[0m", `Making XHR: ${url}`);

    if (basicAuth) {
      if (new URL(url).hostname === baseHostname || url.startsWith("proxy/")) {
        this.setRequestHeader("authorization", `Basic ${basicAuth}`);
      }
    }

    if (logFailedRequest) {
      this.onloadend = (req) => {
        if (this.status < 200 || this.status >= 300) {
          console.log("\n\n\n");
          console.log(this.responseURL);
          console.log(new URL(this.responseURL).hostname === baseHostname);
          console.log("\n\n\n");
        }
      };
    }
  };

  const load = (Resource as any)._Implementations.loadWithXhr;
  (Resource as any)._Implementations.loadWithXhr = function (...args: any) {
    // Note we don't need to patch the loadWithXhr for basic auth, as it uses XMLHttpRequest
    // if (URI(args[0]).hostname() === baseHostname) {
    //   if (!args[4]) {
    //     args[4] = {};
    //   }
    //   args[4]["authorization"] = `Basic ${basicAuth}`;
    // }

    console.log("\x1b[35m%s\x1b[0m", `Loading resource request: ${args[0]}`);

    // All URLs need to be absolute - so add the base URL if it's not already there
    if (args[0].indexOf("http://") !== 0 && args[0].indexOf("https://") !== 0) {
      console.log(
        `Rewrite relative URL: \`${args[0]}\` to \`${baseUrl}${args[0]}\``
      );
      args[0] = `${baseUrl}${args[0]}`;
    }

    load.apply(this, args);
  };

  // A fun method to add Auth headers to all requests with baseUrl
  const originalFetch = globalThis.fetch;
  const newFetch = (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    let url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;

    console.log("\x1b[35m%s\x1b[0m", `Making fetch request: ${url}`);

    // All URLs need to be absolute - so add the base URL if it's not already there
    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
      console.log(`Rewrite relative URL: \`${url}\` to \`${baseUrl}${url}\``);
      url = `${baseUrl}${url}`;
    }

    if (
      (basicAuth && new URL(url).hostname === baseHostname) ||
      url.startsWith("proxy/")
    ) {
      if (!init) {
        init = {};
      }
      const headers = new Headers(init.headers);
      headers.set("authorization", `Basic ${basicAuth}`);
      init.headers = headers;
    }

    return originalFetch(input, init as RequestInit);
  };
  globalThis.fetch = newFetch;

  global.XMLHttpRequest = window.XMLHttpRequest;
  global.DOMParser = window.DOMParser;
}
