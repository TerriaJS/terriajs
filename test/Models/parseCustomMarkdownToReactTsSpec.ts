import { parseCustomMarkdownToReactWithOptions } from "../../lib/ReactViews/Custom/parseCustomMarkdownToReact";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import { TooltipWithButtonLauncher } from "../../lib/ReactViews/Generic/TooltipWrapper";

const isComponentOfType: any =
  require("react-shallow-testutils").isComponentOfType;
const findAll: any = require("react-shallow-testutils").findAll;

describe("parseCustomMarkdownToReactTs", function () {
  beforeEach(function () {
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

    const tooltip = findAll(result, (el: any) =>
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

    const tooltip = findAll(result, (el: any) =>
      isComponentOfType(el, TooltipWithButtonLauncher)
    );
    expect(tooltip.length).toEqual(0);
  });
});
