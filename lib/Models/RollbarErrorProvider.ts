import isDefined from "../Core/isDefined";
import Terria from "./Terria";
import Rollbar from "rollbar";

interface RollbarErrorProviderOptions {
  terria: Terria;
}

export default class RollbarErrorProvider {
  terria: Terria;
  errorProvider: any;

  constructor(options: RollbarErrorProviderOptions) {
    this.terria = options.terria;

    if (!isDefined(this.terria.configParameters.rollbarAccessToken)) {
      console.log(
        "A rollbarAccessToken must be configured in the config.json to use the rollbar error provider"
      );
      return;
    }
    this.errorProvider = new Rollbar({
      accessToken: this.terria.configParameters.rollbarAccessToken,
      captureUncaught: true,
      captureUnhandledRejections: true
      // enabled: process.env.NODE_ENV === 'production'
    });
  }
}
