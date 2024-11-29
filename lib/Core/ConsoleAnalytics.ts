import isDefined from "../Core/isDefined";
import { Analytics } from "../Models/Terria";
import i18next from "i18next";

export default class ConsoleAnalytics implements Analytics {
  // either set enableConsoleAnalytics here to true, or pass true
  // in `configParameters.enableConsoleAnalytics` for verbose app analytics.
  enableConsoleAnalytics: boolean = false;

  start(
    configParameters: Partial<{
      enableConsoleAnalytics: boolean;
      googleAnalyticsKey: any;
      googleAnalyticsOptions: any;
    }>
  ): void {
    if (
      configParameters.googleAnalyticsKey ||
      configParameters.googleAnalyticsOptions
    ) {
      console.log(
        i18next.t("core.consoleAnalytics.logStartedWithGAParameters")
      );
    }
    if (isDefined(configParameters.enableConsoleAnalytics)) {
      console.log(i18next.t("core.consoleAnalytics.started"));
      this.enableConsoleAnalytics = configParameters.enableConsoleAnalytics;
    } else if (
      !isDefined(configParameters.enableConsoleAnalytics) ||
      !configParameters.enableConsoleAnalytics
    ) {
      console.log(
        i18next.t("core.consoleAnalytics.startedNoenableConsoleAnalytics")
      );
    }
  }

  logEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    if (this.enableConsoleAnalytics) {
      const labelString = isDefined(label) ? " Label: " + label : "";
      const valueString = isDefined(value) ? " Value: " + value : "";
      console.log(
        "** Event ** Category: " +
          category +
          " Action: " +
          action +
          labelString +
          valueString
      );
    }
  }
}
