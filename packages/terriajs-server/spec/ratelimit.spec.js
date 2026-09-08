import makeserver from "../lib/makeserver.js";
import supertestReq from "supertest";

/**
 * Specs for rate limiting when basic auth is enabled
 */
describe("server rate limiting", () => {
  function makeRequest(app, url, auth) {
    return new Promise((resolve) => {
      const req = supertestReq(app).get(url);
      if (auth) {
        req.auth(auth.username, auth.password);
      }
      req.end((err, res) => resolve({ err, res }));
    });
  }

  describe("with basic auth NOT configured", () => {
    it("does not rate limit requests", async () => {
      const app = makeserver({ pingauth: true, settings: {} });

      for (let attempt = 0; attempt < 10; attempt++) {
        const { err, res } = await makeRequest(app, "/pingauth");
        if (err || res.status !== 200) {
          throw new Error(`Unexpected error ${res?.status}`);
        }
      }
    });
  });

  describe("with basic auth configured", () => {
    it("does not rate limit requests when auth succeeds", async () => {
      const rateLimit = {
        freeRetries: 4,
        minWait: 2000,
        maxWait: 60000
      };

      const app = makeserver({
        pingauth: true,
        settings: {
          basicAuthentication: {
            username: "foo",
            password: "bar"
          },
          rateLimit
        }
      });

      for (let attempt = 0; attempt < 10; attempt++) {
        const { res } = await makeRequest(app, "/pingauth", {
          username: "foo",
          password: "bar"
        });
        if (res.status !== 200) {
          throw new Error(`Unexpected error ${res.status}`);
        }
      }
    });

    it("rate limit requests when auth fails", async () => {
      const rateLimit = {
        freeRetries: 4,
        minWait: 2000,
        maxWait: 60000
      };

      const app = makeserver({
        pingauth: true,
        settings: {
          basicAuthentication: {
            username: "foo",
            password: "bar"
          },
          rateLimit
        }
      });

      for (let attempt = 0; attempt < 10; attempt++) {
        const { res } = await makeRequest(app, "/pingauth");
        if (attempt < rateLimit.freeRetries) {
          if (res.status !== 401) {
            throw new Error(
              `Expected only HTTP 401 error before free retries finish`
            );
          }
        } else {
          if (res.status !== 429) {
            throw new Error(
              `Expected only HTTP 429 error after free retries finish`
            );
          }
        }
      }
    });

    it("uses default rate limit config when no custom config provided", async () => {
      const app = makeserver({
        pingauth: true,
        settings: {
          basicAuthentication: {
            username: "foo",
            password: "bar"
          }
        }
      });

      // Default freeRetries is 2
      for (let attempt = 0; attempt < 5; attempt++) {
        const { res } = await makeRequest(app, "/pingauth");
        if (attempt < 2) {
          if (res.status !== 401) {
            throw new Error(
              `Attempt ${attempt}: expected 401 before default freeRetries (2), got ${res.status}`
            );
          }
        } else {
          if (res.status !== 429) {
            throw new Error(
              `Attempt ${attempt}: expected 429 after default freeRetries (2), got ${res.status}`
            );
          }
        }
      }
    });

    it("allows successful auth after failed attempts within free retries", async () => {
      const rateLimit = {
        freeRetries: 4,
        minWait: 2000,
        maxWait: 60000
      };

      const app = makeserver({
        pingauth: true,
        settings: {
          basicAuthentication: {
            username: "foo",
            password: "bar"
          },
          rateLimit
        }
      });

      const validAuth = { username: "foo", password: "bar" };

      // Fail twice (within freeRetries)
      for (let attempt = 0; attempt < 2; attempt++) {
        const { res } = await makeRequest(app, "/pingauth");
        if (res.status !== 401) {
          throw new Error(`Expected 401 on failed attempt, got ${res.status}`);
        }
      }

      // Succeed with valid credentials - should still work and reset counter
      const { res: successRes } = await makeRequest(
        app,
        "/pingauth",
        validAuth
      );
      if (successRes.status !== 200) {
        throw new Error(
          `Expected 200 on valid auth after failed attempts, got ${successRes.status}`
        );
      }

      // After reset, failed attempts should start counting from zero again
      for (let attempt = 0; attempt < rateLimit.freeRetries; attempt++) {
        const { res } = await makeRequest(app, "/pingauth");
        if (res.status !== 401) {
          throw new Error(
            `Attempt ${attempt} after reset: expected 401, got ${res.status}`
          );
        }
      }
    });

    it("returns 429 with retry-after header when rate limited", async () => {
      const rateLimit = {
        freeRetries: 2,
        minWait: 200,
        maxWait: 60000
      };

      const app = makeserver({
        pingauth: true,
        settings: {
          basicAuthentication: {
            username: "foo",
            password: "bar"
          },
          rateLimit
        }
      });

      // Exhaust free retries
      for (let attempt = 0; attempt < rateLimit.freeRetries; attempt++) {
        await makeRequest(app, "/pingauth");
      }

      // Next request should be rate limited with retry-after header
      const { res } = await makeRequest(app, "/pingauth");
      if (res.status !== 429) {
        throw new Error(`Expected 429 when rate limited, got ${res.status}`);
      }
      if (!res.headers["retry-after"]) {
        throw new Error("Expected retry-after header on 429 response");
      }
    });

    it("blocks requests even with valid credentials after rate limit is hit", async () => {
      const rateLimit = {
        freeRetries: 2,
        minWait: 2000,
        maxWait: 60000
      };

      const app = makeserver({
        pingauth: true,
        settings: {
          basicAuthentication: {
            username: "foo",
            password: "bar"
          },
          rateLimit
        }
      });

      const validAuth = { username: "foo", password: "bar" };

      // Exhaust free retries with failed auth
      for (let attempt = 0; attempt < rateLimit.freeRetries; attempt++) {
        await makeRequest(app, "/pingauth");
      }

      // Verify we're rate limited
      const { res: blockedRes } = await makeRequest(app, "/pingauth");
      if (blockedRes.status !== 429) {
        throw new Error(`Expected 429, got ${blockedRes.status}`);
      }

      // Even with valid credentials, should be blocked because
      // bruteforce.prevent runs before the auth handler
      const { res: authRes } = await makeRequest(app, "/pingauth", validAuth);
      if (authRes.status !== 429) {
        throw new Error(
          `Expected 429 even with valid auth after rate limit hit, got ${authRes.status}`
        );
      }
    });
  });
});
