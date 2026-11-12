import { setupWorker } from "msw/browser";
import { tileServer } from "./tiles";

/**
 * Answers the requests a test's servers would, through MSW: a test adds its
 * own handlers with `network.use(…)`, and they're reset after each test. The
 * servers the test helpers' URLs point to answer every test. A request no
 * handler answers fails the test (setup.ts)
 */
export const network = setupWorker(tileServer);
