import TerriaError from "../../Core/TerriaError";
import { ErrorServiceProvider } from "./ErrorService";
import * as Sentry from "@sentry/react";

/**
 * A stub error service provider that does nothing.
 */
export default class SentryErrorServiceProvider
  implements ErrorServiceProvider
{
  constructor() {
    console.log("init sentry");
    Sentry.init({
      dsn: "https://87c898683a4f6875b3209c9c81fb9cb7@o4507722649829376.ingest.us.sentry.io/4507722651205632",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.browserProfilingIntegration(),
        Sentry.replayIntegration()
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost"],
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      // Set profilesSampleRate to 1.0 to profile every transaction.
      // Since profilesSampleRate is relative to tracesSampleRate,
      // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
      // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
      // results in 25% of transactions being profiled (0.5*0.5=0.25)
      profilesSampleRate: 1.0
    });
  }

  error(_error: string | Error | TerriaError) {
    console.log("sentry error", _error);
    if (_error instanceof TerriaError) {
      Sentry.captureException(_error.toError());
    } else {
      Sentry.captureException(_error);
    }
  }
}
