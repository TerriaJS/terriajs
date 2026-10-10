/// <reference types="jasmine" />
import { worker } from "./mocks/browser";

// Mirrors terriajs's test/SpecMain.ts: start the MSW service worker once before
// the suite so specs can intercept network requests with `worker.use(...)`.
beforeAll(async function () {
  // Unregister stale service workers from previous runs, then start MSW.
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
  await worker.start({
    // Let any request we don't explicitly mock reach the jasmine server
    // (which serves the spec bundle and its assets).
    onUnhandledRequest: "bypass",
    quiet: true
  });
});

beforeEach(function () {
  worker.resetHandlers();
});

afterAll(function () {
  worker.stop();
});
