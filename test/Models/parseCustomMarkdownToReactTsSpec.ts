import { render, screen, within } from "@testing-library/react";
import parseCustomMarkdownToReact, {
  parseCustomMarkdownToReactWithOptions
} from "../../lib/ReactViews/Custom/parseCustomMarkdownToReact";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import { withThemeContext } from "../ReactViews/withContext";

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

    render(withThemeContext(result));

    expect(
      screen.getByRole("button", { name: /spatial data/i })
    ).toBeInTheDocument();
    expect(screen.getByText(spatialDataTerm.content)).toBeInTheDocument();
  });

  it("skips injecting tooltips when no options provided", function () {
    const result = parseCustomMarkdownToReactWithOptions(
      "something something spatial data mochi",
      {}
    );

    render(withThemeContext(result));

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("correctly linkifies URLs with ampersands", function () {
    const url =
      "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities";
    const result = parseCustomMarkdownToReact(url);

    const { container } = render(withThemeContext(result));

    const link = within(container).getByRole("link");
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveTextContent(url);
  });
});
