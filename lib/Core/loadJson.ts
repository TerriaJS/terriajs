import Resource from "terriajs-cesium/Source/Core/Resource";

export default function loadJson<T = any>(
  urlOrResource: any,
  headers?: any,
  body?: any,
  asForm: boolean = false
): Promise<T> {
  let responseType: XMLHttpRequestResponseType = "json";

  let jsonPromise: Promise<T>;
  let params: any = {
    url: urlOrResource,
    headers: headers
  };

  if (body !== undefined) {
    // We need to send a POST
    params.headers = headers ?? {};
    params.headers["Content-Type"] = "application/json";

    if (asForm) {
      const data = new FormData();
      Object.entries(body).forEach(([key, value]) =>
        data.append(key, JSON.stringify(value))
      );
      params.data = data;
    } else {
      params.data = JSON.stringify(body);
    }

    params.responseType = responseType;

    jsonPromise =
      urlOrResource instanceof Resource
        ? urlOrResource.post(body, {
            responseType: responseType
          })!
        : Resource.post(params)!;
  } else {
    // Make a GET instead
    jsonPromise =
      urlOrResource instanceof Resource
        ? urlOrResource.fetchJson()!
        : Resource.fetchJson(params)!;
  }

  return jsonPromise;
}
