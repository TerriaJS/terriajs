import ShareDataService from "../../lib/Models/ShareDataService";
import Terria from "../../lib/Models/Terria";

describe("ShareDataService", function () {
  it("leaves share size limits undefined when the server omits them", function () {
    const service = new ShareDataService({
      terria: new Terria({ baseUrl: "./" })
    });

    service.init({ sharePrefix: "share" });

    expect(service.shareMaxRequestSize).toBeUndefined();
    expect(service.shareMaxRequestSizeBytes).toBeUndefined();
  });

  it("uses share size limits supplied by the server", function () {
    const service = new ShareDataService({
      terria: new Terria({ baseUrl: "./" })
    });

    service.init({
      sharePrefix: "share",
      shareMaxRequestSize: "1mb",
      shareMaxRequestSizeBytes: 1024 * 1024
    });

    expect(service.shareMaxRequestSize).toBe("1mb");
    expect(service.shareMaxRequestSizeBytes).toBe(1024 * 1024);
  });
});
