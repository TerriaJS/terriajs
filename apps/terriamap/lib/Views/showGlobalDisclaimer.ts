import { runInAction } from "mobx";
import ViewState from "terriajs/lib/ReactViewModels/ViewState";
import devDisclaimerPreambleText from "./DevelopmentDisclaimerPreamble.html";
import globalDisclaimerText from "./GlobalDisclaimer.html";

/**
 * Show global disclaimer
 */
export default function showGlobalDisclaimer(viewState: ViewState) {
  const terria = viewState.terria;
  const globalDisclaimer = terria.configParameters.globalDisclaimer;
  const hostname = window.location.hostname;
  if (
    globalDisclaimer &&
    (globalDisclaimer.enableOnLocalhost || hostname.indexOf("localhost") === -1)
  ) {
    let message = "";
    // Sometimes we want to show a preamble if the user is viewing a site other than the official production instance.
    // This can be expressed as a devHostRegex ("any site starting with staging.") or a negative prodHostRegex ("any site not ending in .gov.au")
    if (
      (globalDisclaimer.devHostRegex !== undefined &&
        hostname.match(globalDisclaimer.devHostRegex)) ||
      (globalDisclaimer.prodHostRegex !== undefined &&
        !hostname.match(globalDisclaimer.prodHostRegex))
    ) {
      message += devDisclaimerPreambleText;
    }
    message += globalDisclaimerText;

    const options = {
      title:
        globalDisclaimer.title !== undefined
          ? globalDisclaimer.title
          : "Warning",
      confirmText: globalDisclaimer.buttonTitle || "Ok",
      denyText: globalDisclaimer.denyText || "Cancel",
      denyAction: globalDisclaimer.afterDenyLocation
        ? function () {
            window.location = globalDisclaimer.afterDenyLocation;
          }
        : undefined,
      width: 600,
      height: 550,
      message: message,
      horizontalPadding: 100
    };
    runInAction(() => {
      viewState.disclaimerSettings = options;
      viewState.disclaimerVisible = true;
    });
  }
}
