import { parseCustomMarkdownToReactWithOptions } from "../../lib/ReactViews/Custom/parseCustomMarkdownToReact";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import Terria from "../../lib/Models/Terria";
import { TooltipWithButtonLauncher } from "../../lib/ReactViews/Generic/TooltipWrapper";

const isComponentOfType: any =
  require("react-shallow-testutils").isComponentOfType;
const findAll: any = require("react-shallow-testutils").findAll;

describe("parseCustomMarkdownToReactTs", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    registerCustomComponentTypes();
  });
  it("correctly parses tooltip terms", function () {
    const spatialDataTerm = {
      term: "spatial data",
      content: "data that is spatial, spluh"
    };
    const result = parseCustomMarkdownToReactWithOptions(
      "something something spatial data mochi",
      {
        injectTermsAsTooltips: true,
        tooltipTerms: [spatialDataTerm]
      }
    );

    var tooltip = findAll(result, (el: any) =>
      isComponentOfType(el, TooltipWithButtonLauncher)
    )[0];
    expect(tooltip).toBeDefined();
    expect(tooltip.props.launcherComponent()).toContain(spatialDataTerm.term);
    expect(tooltip.props.children()).toContain(spatialDataTerm.content);
  });
  it("skips injecting tooltips when no options provided", function () {
    const result = parseCustomMarkdownToReactWithOptions(
      "something something spatial data mochi",
      {}
    );

    var tooltip = findAll(result, (el: any) =>
      isComponentOfType(el, TooltipWithButtonLauncher)
    );
    expect(tooltip.length).toEqual(0);
  });
});
