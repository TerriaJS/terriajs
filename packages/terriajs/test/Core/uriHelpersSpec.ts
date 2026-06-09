import { getUriWithoutPath } from "../../lib/Core/uriHelpers";
import URI from "urijs";

describe("uriHelpers", function () {
  describe("getUriWithoutPath", function () {
    it("returns a uri with protocol, hostname", function () {
      const uriWithPath = new URI(
        "https://a.fully.qualified.domain/and-a-path"
      );
      expect(getUriWithoutPath(uriWithPath)).toBe(
        "https://a.fully.qualified.domain/"
      );
    });
    it("returns a uri with protocol, hostname and port", function () {
      const uriWithPortAndPath = new URI(
        "https://a.fully.qualified.domain:4242/and-a-path"
      );
      expect(getUriWithoutPath(uriWithPortAndPath)).toBe(
        "https://a.fully.qualified.domain:4242/"
      );
    });
  });
});
