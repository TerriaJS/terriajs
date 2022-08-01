import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import markdownToHtml from "../../lib/Core/markdownToHtml";
import Terria from "../../lib/Models/Terria";
import CustomComponent from "../../lib/ReactViews/Custom/CustomComponent";

describe("markdownToHtml", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    registerCustomComponentTypes();
  });
  it("correctly injects terria's custom tooltips", function () {
    const spatialDataTerm = {
      term: "spatial data",
      content: "data that is spatial, spluh"
    };
    const result = markdownToHtml(
      "something something spatial data mochi",
      false,
      {
        ADD_TAGS: CustomComponent.names,
        ADD_ATTR: CustomComponent.attributes,
        // This is so that we can have attrs with `:` in their values.
        // Without this setting such attrs are discarded as unknown protocols.
        ALLOW_UNKNOWN_PROTOCOLS: true
      },
      {
        injectTermsAsTooltips: true,
        tooltipTerms: [spatialDataTerm]
      }
    );
    // no react nodes yet as we are testing pure markdown to "terria html" via custom components
    expect(result).toContain("<terriatooltip");
    expect(result).toContain(`title="${spatialDataTerm.term}"`);
    expect(result).toContain(`${spatialDataTerm.content}`);
    expect(result).toContain("</terriatooltip>");
  });
});
