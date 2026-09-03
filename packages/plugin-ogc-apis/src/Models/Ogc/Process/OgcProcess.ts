import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Resource from "terriajs-cesium/Source/Core/Resource";
import {
  BaseModel,
  proxyCatalogItemUrl,
  TerriaError
} from "terriajs-plugin-api";
import { JsonObject } from "terriajs/lib/Core/Json";
import loadJson from "terriajs/lib/Core/loadJson";
import * as z from "zod";

const OgcProcessInput = z.object({
  title: z.string(),
  description: z.string(),
  minOccurs: z.number().default(1),
  maxOccurs: z.union([z.number().default(1), z.enum(["unbounded"])]),
  schema: z.any()
});

/**
 * Schema: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/outputDescription.yaml
 */
const OgcProcessOutputDescription = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  schema: z.any()
});

export const OgcProcess = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  inputs: z.record(z.string(), OgcProcessInput),
  outputs: z.record(z.string(), OgcProcessOutputDescription)
});

export const successStatus = ["successful"] as const;
export const failureStatus = ["failed", "dismissed"] as const;
export const finalStatus = [...successStatus, ...failureStatus] as const;
export const pendingStatus = ["accepted", "running"] as const;
export const jobStatus = [...finalStatus, ...pendingStatus] as const;

const JobStatus = z.enum(jobStatus);

export const OgcProcessAsyncExecutionResponse = z.object({
  // TODO: Fix to match spec once upstream is fixed
  jobID: z.string(),
  status: JobStatus
});

// See: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/statusInfo.yaml
export const OgcProcessJob = z.object({
  // TODO: Fix to match spec once upstream is fixed
  jobID: z.string(),
  status: JobStatus,
  message: z.string().nullish(),
  progress: z.number().optional(),
  created: z.string().optional(),
  started: z.string().optional(),
  finished: z.string().optional(),
  updated: z.string().optional()
});

/**
 * Schema: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/statusInfo.yaml
 */
const OgcProcessJobSummary = z.object({
  jobID: z.string(),
  processID: z.string().optional()
});

/**
 * Schema: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/jobList.yaml
 */
export const OgcProcessJobSummaries = z.object({
  jobs: z.array(OgcProcessJobSummary)
});

/**
 * Schema: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/processSummary.yaml
 */
export const OgcProcessSummary = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string().optional(),
  description: z.string().optional()
});

/**
 * Schema: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/processList.yaml
 */
export const OgcProcessSummaries = z.object({
  processes: z.array(OgcProcessSummary)
});

export const OgcProcessJobResults = z.record(z.string(), z.unknown());

export type OgcProcess = z.infer<typeof OgcProcess>;
export type OgcProcessSummary = z.infer<typeof OgcProcessSummary>;
export type OgcProcessSummaries = z.infer<typeof OgcProcessSummaries>;
export type OgcProcessJobSummary = z.infer<typeof OgcProcessJobSummary>;
export type OgcProcessJobSummaries = z.infer<typeof OgcProcessJobSummaries>;
export type OgcProcessJob = z.infer<typeof OgcProcessJob>;
export type OgcProcessJobResults = z.infer<typeof OgcProcessJobResults>;
export type OgcProcessOutputDescription = z.infer<
  typeof OgcProcessOutputDescription
>;
export type JobStatus = z.infer<typeof JobStatus>;

export const client = {
  async listProcessSummaries(
    model: BaseModel,
    baseUrl: string
  ): Promise<OgcProcessSummaries> {
    const listUrl = proxyCatalogItemUrl(model, joinUrl(baseUrl, "processes"));
    const result = await request(listUrl);
    if (!result.ok) {
      throw result.error;
    }
    return OgcProcessSummaries.parse(result.value);
  },

  async listJobSummaries(
    model: BaseModel,
    baseUrl: string,
    { queryParameters }: { queryParameters?: JsonObject } = {}
  ): Promise<OgcProcessJobSummaries> {
    const listUrl = proxyCatalogItemUrl(model, joinUrl(baseUrl, "jobs"));
    const result = await request(listUrl, { queryParameters });
    if (!result.ok) {
      throw result.error;
    }
    return OgcProcessJobSummaries.parse(result.value);
  },

  async getProcess(
    model: BaseModel,
    baseUrl: string,
    processId: string
  ): Promise<OgcProcess> {
    const processUrl = proxyCatalogItemUrl(
      model,
      joinUrl(baseUrl, `processes/${processId}`)
    );
    const result = await request(processUrl);
    if (!result.ok) {
      throw result.error;
    }
    return OgcProcess.parse(result.value);
  },

  async getJob(
    model: BaseModel,
    baseUrl: string,
    jobId: string
  ): Promise<OgcProcessJob> {
    const jobUrl = proxyCatalogItemUrl(
      model,
      joinUrl(baseUrl, `jobs/${jobId}`)
    );
    const result = await request(jobUrl);
    if (!result.ok) {
      throw result.error;
    }
    return OgcProcessJob.parse(result.value);
  },

  async executeAsync(
    model: BaseModel,
    baseUrl: string,
    processId: string,
    body: JsonObject
  ) {
    const executionUrl = proxyCatalogItemUrl(
      model,
      joinUrl(baseUrl, `processes/${processId}/execution`)
    );
    const result = await request(executionUrl, {
      body,
      headers: {
        Prefer: "respond-async"
      }
    });
    if (!result.ok) {
      throw result.error;
    }
    return OgcProcessAsyncExecutionResponse.parse(result.value);
  },

  async getJobResults(
    model: BaseModel,
    baseUrl: string,
    jobId: string
  ): Promise<OgcProcessJobResults> {
    const resultsUrl = proxyCatalogItemUrl(
      model,
      joinUrl(baseUrl, `jobs/${jobId}/results`)
    );
    const result = await request(resultsUrl);
    if (!result.ok) {
      throw result.error;
    }
    return OgcProcessJobResults.parse(result.value);
  }
};

async function request(
  url: string,
  options?: {
    headers?: Record<string, string>;
    queryParameters?: JsonObject;
    body?: JsonObject;
  }
): Promise<{ ok: true; value: unknown } | { ok: false; error: TerriaError }> {
  const resource = new Resource({
    url,
    queryParameters: options?.queryParameters,
    headers: {
      ...options?.headers
    }
  });

  return loadJson(resource, undefined, options?.body)
    .then((value) => ({ ok: true as const, value }))
    .catch((error) => {
      const details =
        error instanceof RequestErrorEvent
          ? friendlierNetworkErrors[error.statusCode]?.(error)
          : undefined;
      return {
        ok: false,
        error: TerriaError.from(error, details)
      };
    });
}

const friendlierNetworkErrors: Record<
  number,
  (error: RequestErrorEvent) => { title: string; message: string }
> = {
  401: () => ({
    title: "Unauthorized request",
    message: "Job could not be started due to an authorization error"
  }),
  403: () => ({
    title: "Permission denied",
    message: "Job could not be started due to a permission error"
  }),
  400: (error: RequestErrorEvent) => {
    // This generally follows the spec recommendation for OpenAPI errors
    // https://docs.ogc.org/is/18-062r2/18-062r2.html#7-13-3-%C2%A0-error-situations
    const response = error.response;
    const title = response?.title ?? response?.code ?? "Bad request";
    const message =
      response?.detail ??
      response?.description ?? // pygeoapi returns a description instead of detail
      "Job could not be started due to unknown error in parameters";
    return { title, message };
  }
};

function joinUrl(baseUrl: string, path: string): string {
  const url = new URL(baseUrl);
  url.pathname =
    url.pathname.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
  return url.toString();
}
