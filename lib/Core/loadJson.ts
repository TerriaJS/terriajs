import Resource from "terriajs-cesium/Source/Core/Resource";

export default function loadJson<T = any>(
  urlOrResource: string | Resource,
  headers?: Record<string, unknown>,
  body?: any,
  asForm: boolean = false
): Promise<T> {
  const responseType: XMLHttpRequestResponseType = "json";

  let jsonPromise: Promise<T>;
  const params: any = {
    url: urlOrResource,
    headers: headers
  };

  if (body !== undefined) {
    // We need to send a POST
    params.headers ??= {};
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

export const loadJsonAbortable = async <T = any>(
  urlOrResource: string | Resource,
  {
    abortSignal,
    headers,
    body,
    asForm = false
  }: {
    abortSignal: AbortSignal;
    headers?: Record<string, unknown>;
    body?: any;
    asForm?: boolean;
  }
) => {
  const resource =
    urlOrResource instanceof Resource
      ? urlOrResource
      : new Resource({ url: urlOrResource });

  abortSignal.addEventListener("abort", () => {
    resource.request.cancelFunction();
  });

  return loadJson<T>(resource, headers, body, asForm);
};
