import { http, HttpResponse } from "msw";
import { CommonStrata, Terria } from "terriajs-plugin-api";
import OgcProcessCatalogFunctionJob from "../../src/Models/Ogc/Process/OgcProcessCatalogFunctionJob";
import { worker } from "../mocks/browser";

describe("OgcProcessCatalogFunctionJob", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  it("can be invoked", function () {
    const it = new OgcProcessCatalogFunctionJob("test", terria);
    expect(it.type).toBe("ogc-process-job");
  });

  describe("invoke", function () {
    it("correctly POSTs the parameters to the execution endpoint", async function () {
      const job = new OgcProcessCatalogFunctionJob("test", terria);
      const parameters = { aoi: "POLYGON((0 0,1 0,1 1,0 1,0 0))", buffer: 100 };
      job.setTrait(CommonStrata.user, "url", "https://example.com/ogc/");
      job.setTrait(CommonStrata.user, "processId", "buffer-process");
      job.setTrait(CommonStrata.user, "parameters", parameters);

      // Intercept the execution endpoint with MSW and capture the request body.
      let requestCount = 0;
      let postedBody: any;
      worker.use(
        http.post(
          "https://example.com/ogc/processes/buffer-process/execution",
          async ({ request }) => {
            requestCount++;
            postedBody = await request.json();
            return HttpResponse.json({ jobId: "job-123", status: "accepted" });
          }
        )
      );

      await job.invoke();

      // Posted exactly once, to the process execution endpoint.
      expect(requestCount).toBe(1);

      // The request body carries the mock parameters as OGC process inputs.
      expect(postedBody.inputs).toEqual(parameters);
      expect(postedBody.response).toBe("document");

      // The job id returned by the mock is recorded on the job.
      expect(job.jobId).toBe("job-123");
    });
  });

  describe("pollForResults", function () {
    it("GETs the job results endpoint and resolves true", async function () {
      const job = new OgcProcessCatalogFunctionJob("test", terria);
      job.setTrait(CommonStrata.user, "url", "https://example.com/ogc/");
      job.setTrait(CommonStrata.user, "jobId", "job-123");

      worker.use(
        http.get("https://example.com/ogc/jobs/job-123/results", () =>
          HttpResponse.json({ result: "ok" })
        )
      );

      expect(await job.pollForResults()).toBe(true);

      // The results url is derived as {url}jobs/{jobId}/results.
      worker.use(
        http.get("https://example.com/ogc/jobs/job-123/results", () =>
          HttpResponse.json({ result: "ok" })
        )
      );

      expect(await job.pollForResults()).toBe(true);
    });
  });
});
