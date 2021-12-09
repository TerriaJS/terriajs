import isDefined from "./isDefined";
import JsonValue, { JsonObject } from "./Json";
import Result from "./Result";
import TerriaError from "./TerriaError";

export interface LoadOptions {
  headers?: HeadersInit;
  bodyObject?: string | JsonObject;
  asForm?: boolean;
}

export type LoadResponse<T = Response> = { response: T };

export type OverMaxSizeResponse = {
  overMaxFileSize: { bytes: number; type: "total" | "downloaded" };
};

export function isLoadResponse<T>(
  response: LoadResponse<T> | OverMaxSizeResponse
): response is LoadResponse<T> {
  return "response" in response;
}

export function isOverMaxSizeResponse<T>(
  response: LoadResponse<T> | OverMaxSizeResponse
): response is OverMaxSizeResponse {
  return "overMaxFileSize" in response;
}

export async function fetchJson(
  url: string,
  options?: LoadOptions,
  maxFileSize?: undefined
): Promise<Result<LoadResponse<JsonValue> | undefined>>;
export async function fetchJson(
  url: string,
  options?: LoadOptions,
  maxFileSize?: number
): Promise<Result<LoadResponse<JsonValue> | OverMaxSizeResponse | undefined>>;
export async function fetchJson(
  url: string,
  options?: LoadOptions,
  maxFileSize?: number
): Promise<Result<LoadResponse<JsonValue> | OverMaxSizeResponse | undefined>> {
  return (await fetchWithProgress(url, options, maxFileSize)).mapAsync(
    async result => {
      if (result && "response" in result) {
        return {
          response: (await result.response.json()) as JsonValue
        };
      }
      return result;
    }
  );
}

export async function fetchBlob(
  url: string,
  options?: LoadOptions,
  maxFileSize?: undefined
): Promise<Result<LoadResponse<Blob> | undefined>>;
export async function fetchBlob(
  url: string,
  options?: LoadOptions,
  maxFileSize?: number
): Promise<Result<LoadResponse<Blob> | OverMaxSizeResponse | undefined>>;
export async function fetchBlob(
  url: string,
  options?: LoadOptions,
  maxFileSize?: number
): Promise<Result<LoadResponse<Blob> | OverMaxSizeResponse | undefined>> {
  return (await fetchWithProgress(url, options, maxFileSize)).mapAsync(
    async result => {
      if (result && "response" in result) {
        return {
          response: await result.response.blob()
        };
      }
      return result;
    }
  );
}

export default async function fetchWithProgress(
  url: string,
  options?: LoadOptions,
  maxFileSize?: undefined
): Promise<Result<LoadResponse | undefined>>;
export default async function fetchWithProgress(
  url: string,
  options?: LoadOptions,
  maxFileSize?: number
): Promise<Result<LoadResponse | OverMaxSizeResponse | undefined>>;
export default async function fetchWithProgress(
  url: string,
  options: LoadOptions = {},
  maxFileSize?: number | undefined
): Promise<Result<LoadResponse | OverMaxSizeResponse | undefined>> {
  try {
    const { bodyObject, asForm = false, headers } = options;
    const controller = new AbortController();

    let fetchPromise: Promise<Response>;

    // If bodyObject is provided
    // Parse it into BodyInit
    // and then POST it
    if (bodyObject) {
      let body: BodyInit;
      if (typeof bodyObject === "string") {
        body = bodyObject;
        // Convert to FormData
      } else if (asForm) {
        const formData = new FormData();
        Object.entries(bodyObject).forEach(([key, value]) =>
          formData.append(key, JSON.stringify(value))
        );
        body = formData;
      } else {
        body = JSON.stringify(bodyObject);
      }
      fetchPromise = fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers,
        body
      });

      // No bodyObject, just make GET request
    } else {
      fetchPromise = fetch(url, { signal: controller.signal, headers });
    }

    const response = await fetchPromise;

    if (!isDefined(maxFileSize)) {
      return new Result({ response });
    }

    // If we have a maxFileSize defined either
    // Check content-length
    // Create ReadableStream and check download size everytime bytes are received

    const total = response.headers.get("content-length")
      ? parseInt(response.headers.get("content-length")!, 10)
      : undefined;

    if (isDefined(total) && total > maxFileSize) {
      controller.abort();
      return new Result({ overMaxFileSize: { bytes: total, type: "total" } });
    }

    const reader = response.body?.getReader();

    if (!reader) {
      throw TerriaError.from("Failed to get reader");
    }

    let bytesReceived = 0;

    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      bytesReceived += result.value.length;
      if (bytesReceived > maxFileSize) {
        controller.abort();
        return new Result({
          overMaxFileSize: { bytes: bytesReceived, type: "downloaded" }
        });
      }
    }

    return new Result({ response });
  } catch (e) {
    return Result.error(e, {
      title: "Network request failed",
      message: `Error occurred while fetching ${url}`
    });
  }
}
