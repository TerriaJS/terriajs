import supertestReq from "supertest";
import { http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import makeServer from "../lib/makeserver.js";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

const localRequestHandler = http.all("*", ({ request }) => {
  if (request.url.includes("127.0.0.1")) {
    return passthrough();
  }
});

describe("feedback", () => {
  const server = setupServer(localRequestHandler);

  function buildApp() {
    return makeServer({
      settings: {
        feedback: {
          issuesUrl: "https://example.git.com/repos/example/repo/issues",
          accessToken: "fake-token"
        }
      }
    });
  }

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it("should create feedback", async () => {
    server.use(
      http.post(
        "https://example.git.com/repos/example/repo/issues",
        async ({ request }) => {
          const body = await request.json();
          if (body.title === "Test Feedback") {
            return HttpResponse.json({ id: 123, number: 1 }, { status: 201 });
          }
          return HttpResponse.json(
            { error: "Invalid request" },
            { status: 400 }
          );
        }
      )
    );

    const feedbackData = {
      title: "Test Feedback",
      comment: "This is a test feedback message.",
      name: "Test User",
      email: "testuser@example.com",
      labels: ["feedback", "bug"]
    };

    await supertestReq(buildApp())
      .post("/feedback")
      .send(feedbackData)
      .expect(200);
  });
});
