import { Analytics } from "./types";

export default class NoopAnalytics implements Analytics {
  start(): void {}

  logEvent(): void {}
}
