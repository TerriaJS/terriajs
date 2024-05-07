import fetch, { Headers, Request, Response } from "node-fetch";
import Resource from "terriajs-cesium/Source/Core/Resource";
import URI from "urijs";

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

  const baseHostname = URI(baseUrl).hostname();

  // Adapted from https://stackoverflow.com/a/43875390
  const open = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (
    method: string,
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
      if (URI(url).hostname() === baseHostname || url.startsWith("proxy/")) {
        this.setRequestHeader("authorization", `Basic ${basicAuth}`);
      }
    }

    if (logFailedRequest) {
      this.onloadend = (req) => {
        if (this.status < 200 || this.status >= 300) {
          console.log("\n\n\n");
          console.log(this.responseURL);
          console.log(URI(this.responseURL).hostname() === baseHostname);
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
  const newFetch = (
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> => {
    let url = typeof input === "string" ? input : input.url;

    console.log("\x1b[35m%s\x1b[0m", `Making fetch request: ${url}`);

    // All URLs need to be absolute - so add the base URL if it's not already there
    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
      console.log(`Rewrite relative URL: \`${url}\` to \`${baseUrl}${url}\``);
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

  global.XMLHttpRequest = window.XMLHttpRequest;
  global.DOMParser = window.DOMParser;
}
