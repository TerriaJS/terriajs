import i18next from "i18next";
import URI from "urijs";
import { http, HttpResponse } from "msw";
import { ConfigStrata } from "../../lib/Models/Config/ConfigStrata";
import Internationalization from "../../lib/Models/Internationalization";
import Terria from "../../lib/Models/Terria";
import { worker } from "../mocks/browser";

describe("Translation defaults", function () {
  let savedInterpolation: typeof i18next.options.interpolation;

  const translate = (text: string, options = {}) => {
    i18next.addResource("en", "translationDefaultsSpec", "text", text);
    // A string key, since the spec's text isn't in the typed resources.
    const t = i18next.t as unknown as (key: string, options: object) => string;
    return t("text", {
      ...options,
      lng: "en",
      ns: "translationDefaultsSpec"
    });
  };

  beforeEach(function () {
    savedInterpolation = i18next.options.interpolation;
  });

  afterEach(function () {
    i18next.options.interpolation = savedInterpolation;
    i18next.removeResourceBundle("en", "translationDefaultsSpec");
  });

  it("fills the app name and support email without the caller passing them", function () {
    Internationalization.setDefaultVariables({
      appName: "MyApp",
      supportEmail: "help@example.com"
    });

    expect(translate("{{appName}} {{supportEmail}}")).toBe(
      "MyApp help@example.com"
    );
  });

  it("lets a value the caller passes win", function () {
    Internationalization.setDefaultVariables({ appName: "MyApp" });

    expect(translate("{{appName}}", { appName: "Other" })).toBe("Other");
  });

  it("follows config from Terria#start, through language start-up", async function () {
    worker.use(http.get("*/serverconfig/*", () => HttpResponse.json({})));
    const terria = new Terria({ appBaseHref: "/", baseUrl: "./" });

    await terria.start({
      loadConfig: () =>
        Promise.resolve({
          config: {
            parameters: { appName: "MyApp", supportEmail: "help@example.com" }
          },
          baseUri: new URI("http://example.com/config.json").filename("")
        })
    });

    expect(translate("{{appName}} {{supportEmail}}")).toBe(
      "MyApp help@example.com"
    );

    terria.configParameters.setValue(
      ConfigStrata.definition,
      "appName",
      "RenamedApp"
    );

    expect(translate("{{appName}}")).toBe("RenamedApp");
  });

  it("stops following config once Terria is disposed", async function () {
    worker.use(http.get("*/serverconfig/*", () => HttpResponse.json({})));
    const terria = new Terria({ appBaseHref: "/", baseUrl: "./" });
    await terria.start({
      loadConfig: () =>
        Promise.resolve({
          config: { parameters: { appName: "MyApp" } },
          baseUri: new URI("http://example.com/config.json").filename("")
        })
    });

    terria.dispose();
    terria.configParameters.setValue(
      ConfigStrata.definition,
      "appName",
      "RenamedApp"
    );

    expect(translate("{{appName}}")).toBe("MyApp");
  });
});
