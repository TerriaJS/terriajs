import { initializeErrorServiceProvider } from "../../lib/Models/ErrorServiceProviders/ErrorService";
import RollbarErrorServiceProvider from "../../lib/Models/ErrorServiceProviders/RollbarErrorServiceProvider";

describe("initializeErrorServiceProvider", function () {
  it("can initialize RollbarErrorServiceProvider", async function () {
    const errorService = await initializeErrorServiceProvider({
      provider: "rollbar",
      configuration: {}
    });
    expect(errorService instanceof RollbarErrorServiceProvider).toBe(true);
  });

  it("throws an error when an invalid provider type is given", async function () {
    let error;
    try {
      await initializeErrorServiceProvider({
        provider: "foo",
        configuration: undefined
      });
    } catch (e) {
      error = e;
    }
    expect(error.message).toBe(`Unknown error service provider: foo`);
  });
});
