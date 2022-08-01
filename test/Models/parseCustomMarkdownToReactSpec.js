import parseCustomMarkdownToReact from "../../lib/ReactViews/Custom/parseCustomMarkdownToReact";

import { findAllWithType, findAll } from "react-shallow-testutils";

function findAllEqualTo(reactElement, text) {
  return findAll(reactElement, (element) => element && element === text);
}

describe("parseCustomMarkdownToReact", function () {
  it("correctly linkifies URLs with ampersands", function () {
    const result = parseCustomMarkdownToReact(
      "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities"
    );

    var a = findAllWithType(result, "a")[0];
    expect(a.props.href).toEqual(
      "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities"
    );

    const text = findAllEqualTo(
      result,
      "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities"
    );
    expect(text).toBeDefined();
    expect(text).not.toBeNull();
  });
});
