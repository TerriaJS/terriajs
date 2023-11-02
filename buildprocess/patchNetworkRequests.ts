import fetch, { Headers, Request, Response } from "node-fetch";
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

  // Alternative approach using Resource instead of XMLHttpRequest (can be swapped over if needed)

  // const load = (Resource as any)._Implementations.loadWithXhr;
  // (Resource as any)._Implementations.loadWithXhr = function(...args: any) {
  //   if (URI(args[0]).hostname() === baseHostname) {
  //     if (!args[4]) {
  //       args[4] = {};
  //     }
  //     args[4]["authorization"] = `Basic ${basicAuth}`;
  //   }

  //   load.apply(this, args);
  // };

  // A fun method to add Auth headers to all requests with baseUrl
  const newFetch = (
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.url;

    console.log("\x1b[35m%s\x1b[0m", `Making fetch request: ${url}`);

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
