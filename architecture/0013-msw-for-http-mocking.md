# 13. Mock Service Worker (MSW) for HTTP Mocking in Tests

Date: 2026-02-17

## Status

Proposed

## Context

TerriaJS is a large geospatial web application with extensive HTTP-based testing requirements. The codebase currently uses multiple approaches for HTTP mocking in tests:

1. **jasmine-ajax**: Intercepts XHR requests by monkey-patching the XMLHttpRequest constructor
2. **loadWithXhr.load spies**: Tests spy on `loadWithXhr.load()` to rewrite URLs to local fixture paths
3. **fetchMock**: Patches the global `fetch` API for fetch-based HTTP mocking

This fragmentation creates several problems:

- **Framework coupling**: jasmine-ajax is tightly coupled to Jasmine, making it incompatible with other test frameworks
- **Incomplete coverage**: jasmine-ajax only patches XHR, not fetch; fetchMock only patches fetch, not XHR
- **Maintenance burden**: Maintaining three different HTTP mocking patterns increases cognitive load and makes tests harder to understand
- **URL rewriting complexity**: The `loadWithXhr.load` spy pattern requires tests to maintain mappings from real URLs to fixture paths, obscuring test intent
- **Monkey-patching fragility**: Both jasmine-ajax and fetchMock work by replacing global objects, which can cause subtle bugs and conflicts

TerriaJS uses both XHR and fetch for HTTP requests. The Cesium library (a core dependency) uses XHR via its `Resource.js` abstraction, while modern browser APIs and some TerriaJS code use fetch. Any HTTP mocking solution must handle both transparently.

### Requirements

Any HTTP mocking solution must:

1. Work in real browser environments
2. Intercept both XHR and fetch transparently
3. Be framework-agnostic (not tied to Jasmine or any specific test runner)
4. Provide declarative handler API for readability
5. Support request inspection for assertions
6. Allow per-test handler overrides without global state pollution
7. Handle edge cases like error responses, network failures, and custom headers
8. Serve static fixture data without URL rewriting gymnastics
9. Support global handlers that persist across test resets (e.g., for Cesium terrain mocking)

## Decision

We will adopt **Mock Service Worker (MSW) v2** as the single HTTP mocking solution for all TerriaJS tests, replacing jasmine-ajax, fetchMock, and the `loadWithXhr.load` spy pattern.

MSW intercepts HTTP requests at the Service Worker level, which sits between the browser's network layer and the application code. This provides framework-agnostic, transparent interception of both XHR and fetch without monkey-patching global objects.

### Infrastructure Pattern

**Shared worker instance** (`test/mocks/browser.ts`):

```typescript
import { setupWorker, http, HttpResponse } from "msw";

// Global handlers that survive resetHandlers()
const globalHandlers = [
  // Example: Cesium Ion terrain mock
  http.get("https://api.cesium.com/v1/assets/1/endpoint", () =>
    HttpResponse.json({
      /* ... */
    })
  )
];

export const worker = setupWorker(...globalHandlers);
```

**Test setup** (`test/setup.ts` or `SpecMain.ts`):

```typescript
import { worker } from "./mocks/browser";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  worker.resetHandlers(); // Clears per-test handlers, keeps global handlers
});

afterAll(() => {
  worker.stop();
});
```

**Per-test handlers**:

```typescript
import { worker } from "./mocks/browser";
import { http, HttpResponse } from "msw";
import fixtureData from "./fixtures/data.json";

beforeEach(() => {
  worker.use(
    http.get("https://example.com/api/data", () =>
      HttpResponse.json(fixtureData)
    )
  );
});
```

**Request inspection**:

```typescript
import { captureRequests } from "./mocks/captureRequests";

test("makes expected request", async () => {
  const requests = captureRequests();

  await someFunction();

  expect(requests).toHaveLength(1);
  expect(requests[0].url).toContain("/api/data");
});
```

### Migration Pattern

For each test file currently using jasmine-ajax, fetchMock, or loadWithXhr spies:

**Before (jasmine-ajax)**:

```typescript
beforeEach(() => jasmine.Ajax.install());
afterEach(() => jasmine.Ajax.uninstall());

it("loads data", () => {
  jasmine.Ajax.stubRequest("https://example.com/data.json").andReturn({
    status: 200,
    responseJSON: { value: 42 }
  });

  // test code

  const request = jasmine.Ajax.requests.mostRecent();
  expect(request.url).toBe("https://example.com/data.json");
});
```

**After (MSW)**:

```typescript
import { worker } from "../mocks/browser";
import { http, HttpResponse } from "msw";
import { captureRequests } from "../mocks/captureRequests";

beforeEach(() => {
  worker.use(
    http.get("https://example.com/data.json", () =>
      HttpResponse.json({ value: 42 })
    )
  );
});

it("loads data", async () => {
  const requests = captureRequests();

  // test code

  expect(requests).toHaveLength(1);
  expect(requests[0].url).toContain("/data.json");
});
```

**Before (loadWithXhr spy pattern)**:

```typescript
beforeEach(() => {
  spyOn(loadWithXhr, "load").and.callFake((url, headers, method) => {
    if (url.includes("real-api.com/data")) {
      return loadWithXhr.load("./fixtures/data.json");
    }
    return loadWithXhr.load.originalValue(url, headers, method);
  });
});
```

**After (MSW with direct fixture serving)**:

```typescript
import fixtureData from "./fixtures/data.json";

beforeEach(() => {
  worker.use(
    http.get("https://real-api.com/data", () => HttpResponse.json(fixtureData))
  );
});
```

## Alternatives Considered

### Alternative 1: Keep jasmine-ajax

**Pros:**

- Already in use; no migration cost
- Familiar to existing contributors
- Well-understood behavior

**Cons:**

- Tightly coupled to Jasmine
- Only patches XHR, not fetch (incomplete coverage)
- Monkey-patches global XMLHttpRequest (fragile, can cause conflicts)
- No longer actively maintained
- Requires separate solution for fetch mocking

**Why Rejected**: Framework coupling makes it incompatible with the migration to another test framework, and it cannot handle fetch requests, which TerriaJS increasingly uses.

### Alternative 2: Use nock

**Pros:**

- Mature library with large user base
- Comprehensive HTTP mocking features
- Good for integration testing

**Cons:**

- **Node.js only**: Patches Node's `http`/`https` modules, does not work in browsers
- Cannot be used with browser mode
- Would require running tests in Node environment (loses browser API fidelity)

**Why Rejected**: TerriaJS tests must run in real browsers to exercise browser-specific APIs (Cesium WebGL, geospatial rendering, etc.). Nock only works in Node.js.

### Alternative 3: Use fetch-mock alone

**Pros:**

- Modern library focused on fetch API
- Good developer experience for fetch-based code
- Actively maintained

**Cons:**

- **Only patches fetch, not XHR**: Cesium library uses XHR via `Resource.js`
- Would still require jasmine-ajax or equivalent for XHR mocking
- Does not solve the fragmentation problem
- Monkey-patches global `fetch`

**Why Rejected**: TerriaJS requires both XHR and fetch mocking. Using fetch-mock alone would still require a second mocking library, maintaining the fragmentation problem we're trying to solve.

## Consequences

### Positive

1. **Framework agnostic**: MSW works with Jasmine, Vitest, Jest, or any other test framework, unblocking the test framework migration
2. **Unified mocking approach**: Single API for all HTTP mocking eliminates cognitive load of maintaining multiple patterns
3. **Transparent interception**: Works with both XHR and fetch without requiring code changes or awareness of which API is used
4. **Closer to production**: Tests exercise the real browser HTTP stack (XHR, fetch) rather than monkey-patched globals
5. **Better developer experience**: Declarative handler API (`http.get()`, `http.post()`) is more readable than imperative stubbing
6. **Composable handlers**: Global handlers (Cesium terrain) can coexist with per-test handlers via `worker.use()` and `worker.resetHandlers()`
7. **Request inspection via events**: `request:start` event provides access to requests for assertions without invasive spying
8. **Direct fixture serving**: Import fixture data and serve it directly in handlers, eliminating URL rewriting pattern
9. **Active maintenance**: MSW is actively developed with a large community and modern browser support
10. **Service Worker debugging**: Can inspect network traffic in browser DevTools (Service Worker shows in Network tab)

### Negative

1. **Migration effort**: All tests using jasmine-ajax, fetchMock, or `loadWithXhr` spies must be migrated
2. **Service Worker lifecycle**: Must manage worker start/stop/reset lifecycle in test setup
3. **Async by nature**: Service Worker interception is asynchronous, which can complicate some test scenarios
4. **Browser compatibility**: Requires Service Worker support (all modern browsers, but not IE11 - already unsupported per ADR-0010)
5. **Learning curve**: Contributors familiar with jasmine-ajax must learn MSW API
6. **Service Worker debugging complexity**: When things go wrong, debugging Service Worker behavior requires understanding MSW internals
7. **Removes potential for unhandled requests**: If handlers are not set up correctly, tests will fail due to unhandled requests

### Neutral

1. **Service Worker unregistration**: Must unregister stale Service Workers in watch mode (handled in `beforeAll`)
2. **Query parameter handling**: MSW v2 strips query params from handler URLs; must match on base path and check params in resolver if needed
3. **Request body consumption**: `request:match` event fires after handler (body consumed); use `request:start` for request inspection
4. **TLD-less domains**: `tough-cookie` crashes on TLD-less domains like `http://test/`; use `http://example.com/` in tests
5. **Global state**: Worker instance is shared across tests; per-test isolation achieved via `resetHandlers()` in `afterEach`

## Implementation Notes

1. **Install MSW**: `yarn add -D msw`
2. **Create shared worker** in `test/mocks/browser.ts` with global handlers
3. **Create captureRequests utility** in `test/mocks/captureRequests.ts` for request inspection
4. **Update test setup** to start/stop worker lifecycle
5. **Migrate tests incrementally**: Start with high-value test files that use jasmine-ajax heavily
6. **Ensure Service Worker registration**: Browser mode must allow Service Workers
7. **Document common patterns** in test documentation (e.g., error responses, custom headers, POST with body)
8. **Add MSW handlers for Cesium infrastructure** (Ion endpoints, terrain endpoints) as global handlers to prevent unhandled requests

### Common Migration Patterns

**Error responses**:

```typescript
worker.use(http.get("https://example.com/fail", () => HttpResponse.error()));
```

**Custom headers and status**:

```typescript
worker.use(
  http.get(
    "https://example.com/data",
    () =>
      new HttpResponse("text content", {
        status: 201,
        headers: { "Content-Type": "text/plain" }
      })
  )
);
```

**POST with body validation**:

```typescript
worker.use(
  http.post("https://example.com/api", async ({ request }) => {
    const body = await request.json();
    expect(body.field).toBe("expected");
    return HttpResponse.json({ success: true });
  })
);
```

**Catch-all failure handler**:

```typescript
worker.use(http.all("*", () => HttpResponse.error()));
```

## References

- [Mock Service Worker Documentation](https://mswjs.io/)
- [MSW Browser Integration Guide](https://mswjs.io/docs/integrations/browser)
- [MSW API Reference](https://mswjs.io/docs/api)
- [Service Workers API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [jasmine-ajax repository](https://github.com/jasmine/jasmine-ajax)
- [fetch-mock repository](https://github.com/wheresrhys/fetch-mock)
