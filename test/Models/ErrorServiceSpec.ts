import { http, HttpResponse } from "msw";
import TerriaError from "../../lib/Core/TerriaError";
import { ErrorServiceProvider } from "../../lib/Models/ErrorServiceProviders/ErrorService";
import StubErrorServiceProvider from "../../lib/Models/ErrorServiceProviders/StubErrorServiceProvider";
import Terria from "../../lib/Models/Terria";
import { worker } from "../mocks/browser";

describe("ErrorService", function () {
  let mockErrorServiceProvider: ErrorServiceProvider;
  let terria: Terria;

  beforeAll(() => {
    mockErrorServiceProvider = {
      init: () => {},
      error: () => {}
    };
  });

  beforeEach(() => {
    worker.use(
      http.get("serverconfig", () => HttpResponse.json({ foo: "bar" })),
      http.get("*/proxyabledomains", () => HttpResponse.json({ foo: "bar" })),
      http.get("*/test-config.json", () => HttpResponse.json({ config: true })),
      http.all("*", () => HttpResponse.error())
    );

    terria = new Terria({
      appBaseHref: "/",
      baseUrl: "./"
    });
  });

  it("Initializes an error service, passing in config", async function () {
    const initSpy = spyOn(mockErrorServiceProvider, "init");
    await terria.start({
      configUrl: "test-config.json",
      errorService: mockErrorServiceProvider
    });
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it("Gets called with error", async function () {
    const errorSpy = spyOn(mockErrorServiceProvider, "error").and.callThrough();
    await terria.start({
      configUrl: "test-config.json",
      errorService: mockErrorServiceProvider
    });
    const error = new TerriaError({
      message: "test error"
    });
    terria.raiseErrorToUser(error);
    expect(errorSpy).toHaveBeenCalledWith(error);
  });

  it("Falls back to stub provider", async () => {
    await terria.start({
      configUrl: "test-config.json"
    });
    expect(terria.errorService).toEqual(jasmine.any(StubErrorServiceProvider));
  });
});
