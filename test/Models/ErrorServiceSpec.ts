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
      http.get("*/proxyabledomains", () => HttpResponse.json({ foo: "bar" }))
    );

    terria = new Terria({
      appBaseHref: "/",
      baseUrl: "./"
    });
  });

  it("Initializes an error service, passing in config", async function () {
    const initSpy = spyOn(mockErrorServiceProvider, "init");
    terria.setErrorService(mockErrorServiceProvider).build();
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it("Gets called with error", async function () {
    const errorSpy = spyOn(mockErrorServiceProvider, "error").and.callThrough();
    terria.setErrorService(mockErrorServiceProvider).build();
    const error = new TerriaError({
      message: "test error"
    });
    terria.raiseErrorToUser(error);
    expect(errorSpy).toHaveBeenCalledWith(error);
  });

  it("Falls back to stub provider", async () => {
    terria.build();
    expect(terria.errorService).toEqual(jasmine.any(StubErrorServiceProvider));
  });
});
