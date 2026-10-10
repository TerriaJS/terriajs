import { setupWorker } from "msw/browser";

// MSW worker used to intercept network requests in browser specs.
// Specs register their own handlers with `worker.use(...)`; they are cleared
// after each spec by `worker.resetHandlers()` (see ../SpecMain.ts).
export const worker = setupWorker();
