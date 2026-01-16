import TerriaError from "../../lib/Core/TerriaError";
import { ErrorServiceProvider } from "../../lib/Models/ErrorServiceProviders/ErrorService";
import StubErrorServiceProvider from "../../lib/Models/ErrorServiceProviders/StubErrorServiceProvider";
import Terria from "../../lib/Models/Terria";

describe("ErrorService", function () {
  let mockErrorServiceProvider: ErrorServiceProvider;
  let terria: Terria;

  beforeAll(() => {
    jasmine.Ajax.stubRequest(/.*/).andError({});
    jasmine.Ajax.stubRequest(/.*(serverconfig|proxyabledomains).*/).andReturn({
      responseText: JSON.stringify({ foo: "bar" })
    });
    jasmine.Ajax.stubRequest("test-config.json").andReturn({
      responseText: JSON.stringify({ config: true })
    });
    mockErrorServiceProvider = {
      init: () => {},
      error: () => {}
    };
  });

  beforeEach(() => {
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

  it("Falls back to stub provider", () => {
    terria.start({
      configUrl: "test-config.json"
    });
    expect(terria.errorService).toEqual(jasmine.any(StubErrorServiceProvider));
  });
});
