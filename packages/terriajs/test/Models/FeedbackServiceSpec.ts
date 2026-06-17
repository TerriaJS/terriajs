import { http, HttpResponse } from "msw";
import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import { FeedbackService } from "../../lib/Models/FeedbackService";
import { worker } from "../mocks/browser";

const FEEDBACK_URL = "https://example.com/feedback";

function createTerria() {
  return new Terria({ baseUrl: "./" });
}

function createService(
  terria: Terria,
  options: {
    additionalFeedbackParameters?: { name: string; descriptiveLabel: string }[];
  } = {}
) {
  return new FeedbackService({
    terria,
    feedbackUrl: FEEDBACK_URL,
    ...options
  });
}

function defaultOptions() {
  return {
    name: "Test User",
    email: "test@example.com",
    sendShareURL: false as const,
    comment: "Great app!"
  };
}

describe("FeedbackService", function () {
  describe("constructor", function () {
    it("throws when feedbackUrl is empty", function () {
      const terria = createTerria();
      expect(() => new FeedbackService({ terria, feedbackUrl: "" })).toThrow();
    });
  });

  describe("sendFeedback", function () {
    it("returns SUCCESS result when the server responds with SUCCESS", async function () {
      const terria = createTerria();
      const service = createService(terria);

      worker.use(
        http.post(FEEDBACK_URL, () => HttpResponse.json({ result: "SUCCESS" }))
      );

      const result = await service.sendFeedback(defaultOptions());
      expect(result.result).toBe("SUCCESS");
    });

    it("returns FAILED result when the server responds with non-SUCCESS", async function () {
      const terria = createTerria();
      const service = createService(terria);

      worker.use(
        http.post(FEEDBACK_URL, () => HttpResponse.json({ result: "FAILURE" }))
      );

      const result = await service.sendFeedback(defaultOptions());
      expect(result.result).toBe("FAILED");
    });

    it("returns FAILED result on network failure", async function () {
      const terria = createTerria();
      const service = createService(terria);

      worker.use(http.post(FEEDBACK_URL, () => HttpResponse.error()));

      const result = await service.sendFeedback(defaultOptions());
      expect(result.result).toBe("FAILED");
    });

    it("sends 'Not shared' as shareLink when sendShareURL is false", async function () {
      const terria = createTerria();
      const service = createService(terria);

      worker.use(
        http.post(FEEDBACK_URL, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          if (body.shareLink !== "Not shared") {
            throw new Error(
              `Expected shareLink "Not shared", got "${body.shareLink}"`
            );
          }
          return HttpResponse.json({ result: "SUCCESS" });
        })
      );

      const result = await service.sendFeedback({
        ...defaultOptions(),
        sendShareURL: false
      });
      expect(result.result).toBe("SUCCESS");
    });

    it("sends a URL as shareLink when sendShareURL is true", async function () {
      const terria = createTerria();
      const service = createService(terria);

      worker.use(
        http.post(FEEDBACK_URL, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          if (
            typeof body.shareLink !== "string" ||
            body.shareLink === "Not shared"
          ) {
            throw new Error(`Expected a share URL, got "${body.shareLink}"`);
          }
          return HttpResponse.json({ result: "SUCCESS" });
        })
      );

      const result = await service.sendFeedback({
        ...defaultOptions(),
        sendShareURL: true
      });
      expect(result.result).toBe("SUCCESS");
    });

    it("posts name, email, comment, and title in the request body", async function () {
      const terria = createTerria();
      const service = createService(terria);

      worker.use(
        http.post(FEEDBACK_URL, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          if (
            body.name !== "Alice" ||
            body.email !== "alice@example.com" ||
            body.comment !== "Looks good" ||
            body.title !== "Review"
          ) {
            throw new Error(`Unexpected body fields: ${JSON.stringify(body)}`);
          }
          return HttpResponse.json({ result: "SUCCESS" });
        })
      );

      const result = await service.sendFeedback({
        name: "Alice",
        email: "alice@example.com",
        sendShareURL: false,
        comment: "Looks good",
        title: "Review"
      });
      expect(result.result).toBe("SUCCESS");
    });

    it("includes custom request headers from feedbackRequestHeaders", async function () {
      const terria = createTerria();
      runInAction(() => {
        terria.configParameters.feedbackRequestHeaders = async () => ({
          Authorization: "Bearer test-token"
        });
      });
      const service = createService(terria);

      worker.use(
        http.post(FEEDBACK_URL, async ({ request }) => {
          if (request.headers.get("Authorization") !== "Bearer test-token") {
            throw new Error("Missing or incorrect Authorization header");
          }
          return HttpResponse.json({ result: "SUCCESS" });
        })
      );

      const result = await service.sendFeedback(defaultOptions());
      expect(result.result).toBe("SUCCESS");
    });

    it("only forwards additional parameters whose names are in the constructor list", async function () {
      const terria = createTerria();
      runInAction(() => {
        terria.configParameters.feedbackRequestHeaders = async () => ({
          Authorization: "Bearer test-token"
        });
      });
      const service = createService(terria, {
        additionalFeedbackParameters: [
          { name: "param1", descriptiveLabel: "Parameter 1" }
        ]
      });

      worker.use(
        http.post(FEEDBACK_URL, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          if (body.param1 !== "value1" || body.unlisted !== undefined) {
            throw new Error(`Unexpected body fields: ${JSON.stringify(body)}`);
          }
          return HttpResponse.json({ result: "SUCCESS" });
        })
      );

      const result = await service.sendFeedback({
        ...defaultOptions(),
        additionalParameters: { param1: "value1", unlisted: "ignored" }
      });
      expect(result.result).toBe("SUCCESS");
    });
  });
});
