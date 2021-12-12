import i18next from "i18next";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import isDefined from "./isDefined";
import JsonValue, { JsonObject } from "./Json";
import Result from "./Result";
import TerriaError, { TerriaErrorSeverity } from "./TerriaError";

export interface LoadOptions {
  headers?: HeadersInit;
  bodyObject?: string | JsonObject;
  asForm?: boolean;
}

export interface LoadOptionsWithMaxSize extends LoadOptions {
  /** File size in bytes, if download reaches this size, the user will be prompted if they want to continue the download */
  fileSizeToPrompt?: number;
  /** Abosolute maximum file size in bytes, if download reaches this size it will be interrupted and a error will be returned */
  maxFileSize?: number;
  model: CatalogMemberMixin.Instance;
}

export type LoadResponse<T = Response> = { response: T };

export type OverMaxSizeResponse = {
  overMaxFileSize: {
    bytes: number;
    type: "total" | "downloaded";
    message: string;
  };
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

/** fetchWithProgress wrapper to fetch JSON  */
export async function fetchJson(
  url: string,
  options?: LoadOptions
): Promise<Result<LoadResponse<JsonValue> | undefined>>;
export async function fetchJson(
  url: string,
  options?: LoadOptionsWithMaxSize
): Promise<Result<LoadResponse<JsonValue> | OverMaxSizeResponse | undefined>>;
export async function fetchJson(
  url: string,
  options?: LoadOptions | LoadOptionsWithMaxSize
) {
  return (await fetchWithProgress(url, options)).mapAsync(async result => {
    if (result && "response" in result) {
      return {
        response: (await result.response.json()) as JsonValue
      };
    }
    return result;
  });
}

/** fetchWithProgress wrapper to fetch a Blob */
export async function fetchBlob(
  url: string,
  options?: LoadOptions
): Promise<Result<LoadResponse<Blob> | undefined>>;
export async function fetchBlob(
  url: string,
  options?: LoadOptionsWithMaxSize
): Promise<Result<LoadResponse<Blob> | OverMaxSizeResponse | undefined>>;
export async function fetchBlob(
  url: string,
  options?: LoadOptions | LoadOptionsWithMaxSize
) {
  return (await fetchWithProgress(url, options)).mapAsync(async result => {
    if (result && "response" in result) {
      return {
        response: await result.response.blob()
      };
    }
    return result;
  });
}

export default async function fetchWithProgress(
  url: string,
  options?: LoadOptions
): Promise<Result<LoadResponse | undefined>>;
export default async function fetchWithProgress(
  url: string,
  options?: LoadOptionsWithMaxSize
): Promise<Result<LoadResponse | OverMaxSizeResponse | undefined>>;
export default async function fetchWithProgress(
  url: string,
  options: LoadOptions | LoadOptionsWithMaxSize = {}
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

    // Check response status
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        throw new TerriaError({
          title: "Client-side network error",
          message: `${response.statusText} (code: ${response.status})`
        });
      } else if (response.status >= 500) {
        throw new TerriaError({
          title: "Server-side network error",
          message: `${response.statusText} (code: ${response.status})`
        });
      }
      throw new TerriaError({
        title: "Unknown network error",
        message: `${response.statusText} (code: ${response.status})`
      });
    }

    // If there aren't limits on file size - just return response from fetch
    if (!("maxFileSize" in options) || !("fileSizeToPrompt" in options)) {
      return new Result({ response });
    }

    // If we have a maxFileSize defined either
    // Check content-length
    // Create ReadableStream and check download size everytime bytes are received

    const total = response.headers.get("content-length")
      ? parseInt(response.headers.get("content-length")!, 10)
      : undefined;

    if (isDefined(total)) {
      // If total file size is larger than maxFileSize - cancel download and throw error
      if (isDefined(options.maxFileSize) && total > options.maxFileSize) {
        controller.abort();
        throw downloadOverMaxSizeError(
          getOverMaxSizeReponse(total, "total"),
          options.model
        );
      }
      // If total file size is larger than fileSizeToPrompt - prompt user to continue
      else if (
        isDefined(options.fileSizeToPrompt) &&
        total > options.fileSizeToPrompt
      ) {
        const overMaxSizeResponse = await promptUserToContinue(
          getOverMaxSizeReponse(total, "total"),
          options.model
        );
        if (isDefined(overMaxSizeResponse)) {
          controller.abort();
          return new Result(overMaxSizeResponse);
        }
      }

      return new Result({ response });
    }

    // If we can't determine maxFileSize from header, we need to stream in download and count the bytes
    const reader = response.body?.getReader();

    if (!reader) {
      throw TerriaError.from("Failed to get reader");
    }

    let bytesReceived = 0;
    const bytes: Uint8Array[] = [];
    let userPromptedToContinue = false;

    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      bytesReceived += result.value.length;
      bytes.push(result.value);

      // If download size is larger than maxFileSize - cancel download and throw error
      if (
        isDefined(options.maxFileSize) &&
        bytesReceived > options.maxFileSize
      ) {
        controller.abort();
        throw downloadOverMaxSizeError(
          getOverMaxSizeReponse(bytesReceived, "downloaded"),
          options.model
        );
      }

      // If download size is larger than fileSizeToPrompt - prompt user to continue
      if (
        isDefined(options.fileSizeToPrompt) &&
        bytesReceived > options.fileSizeToPrompt &&
        !userPromptedToContinue
      ) {
        const overMaxSizeResponse = await promptUserToContinue(
          getOverMaxSizeReponse(bytesReceived, "downloaded"),
          options.model
        );
        if (isDefined(overMaxSizeResponse)) {
          controller.abort();
          return new Result(overMaxSizeResponse);
        } else {
          userPromptedToContinue = true;
        }
      }
    }

    const allBytes = new Uint8Array(bytesReceived);
    let position = 0;
    for (let byte of bytes) {
      allBytes.set(byte, position);
      position += byte.length;
    }

    return new Result({ response: new Response(allBytes) });
  } catch (e) {
    return Result.error(e, {
      title: "Network request failed",
      message: `Error occurred while fetching ${url}`
    });
  }
}

/** Prompt user to continue download:
 * - if user confirms, then `undefined` is returned,
 * - if user denies, then a `OverMaxSizeResponse` is returned
 */
function promptUserToContinue(
  response: OverMaxSizeResponse,
  model: CatalogMemberMixin.Instance
) {
  return new Promise<OverMaxSizeResponse | undefined>(resolve => {
    model.terria.notificationState.addNotificationToQueue({
      title: i18next.t("core.fetchWithProgress.downloadPromptTitle"),
      message: i18next.t("core.fetchWithProgress.downloadPromptMessage", {
        name: getName(model),
        fileSizeMessage: response.overMaxFileSize.message
      }),
      confirmAction: () => resolve(undefined),
      denyAction: () => resolve(response),
      denyText: i18next.t("core.fetchWithProgress.downloadPromptDenyTitle"),
      confirmText: i18next.t(
        "core.fetchWithProgress.downloadPromptConfirmTitle"
      )
    });
  });
}

function getOverMaxSizeReponse(
  bytes: number,
  /** Type determines how bytes was calculated:
   * `downloaded` = we don't know actual file size, all we know is that we have downloaded at least this much
   * `total` = actual file size (from headers.content-length)
   */
  type: "downloaded" | "total"
) {
  return {
    overMaxFileSize: {
      bytes,
      type,
      message: i18next.t(
        type === "downloaded"
          ? "core.fetchWithProgress.fileSizeMessageDownloaded"
          : "core.fetchWithProgress.fileSizeMessageTotal",
        { size: Math.round(bytes / (1024 * 1024)) }
      )
    }
  };
}

export function downloadInterruptedByUserError(response: OverMaxSizeResponse) {
  return new TerriaError({
    title: i18next.t("core.fetchWithProgress.downloadInterruptedByUserTitle"),
    message: i18next.t(
      "core.fetchWithProgress.downloadInterruptedByUserMessage",
      {
        fileSizeMessage: response.overMaxFileSize.message
      }
    ),
    overrideRaiseToUser: false,
    importance: 3,
    severity: TerriaErrorSeverity.Error
  });
}

export function downloadOverMaxSizeError(
  response: OverMaxSizeResponse,
  model: CatalogMemberMixin.Instance
) {
  return new TerriaError({
    title: i18next.t("core.fetchWithProgress.downloadOverMaxSizeTitle"),
    message: i18next.t("core.fetchWithProgress.downloadOverMaxSizeMessage", {
      name: getName(model),
      fileSizeMessage: response.overMaxFileSize.message,
      appName: model.terria.appName
    }),
    importance: 3,
    severity: TerriaErrorSeverity.Error
  });
}
