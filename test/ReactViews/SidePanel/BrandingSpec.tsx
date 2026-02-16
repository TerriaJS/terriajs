import { screen, within } from "@testing-library/dom";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Branding from "../../../lib/ReactViews/SidePanel/Branding";
import { renderWithContexts } from "../withContext";

describe("Branding", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders without issues", function () {
    terria.configParameters.brandBarElements = ["<a href='blah'>a thing</a>"];
    renderWithContexts(<Branding />, viewState);
    expect(screen.getByRole("link", { name: "a thing" })).toBeVisible();
  });

  it("renders when provided displayOne inside of index", function () {
    terria.configParameters.brandBarElements = [
      "<details><summary>a thing</summary></details>"
    ];
    terria.configParameters.displayOneBrand = 0;
    const { container } = renderWithContexts(<Branding />, viewState);

    expect(container.querySelector("details")).toBeTruthy();
    expect(within(container).getByText("a thing")).toBeVisible();
    expect(within(container).queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders when provided displayOne inside of index, but targetting empty string", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<progress>progress is a html element!</progress>"
    ];
    terria.configParameters.displayOneBrand = 0;
    renderWithContexts(<Branding />, viewState);

    expect(screen.getByRole("progressbar")).toBeVisible();
    expect(screen.getByText("progress is a html element!")).toBeVisible();
  });

  it("renders when provided displayOne outside of index", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<meter>meter is a html element!</meter>"
    ];
    terria.configParameters.displayOneBrand = 5;
    renderWithContexts(<Branding />, viewState);
    expect(screen.getByRole("meter")).toBeVisible();
  });

  it("renders brandBarElements when provided brandBarSmallElements", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<meter>meter is a html element!</meter>"
    ];

    terria.configParameters.brandBarSmallElements = [
      "<small>small is a html element!</small>",
      "<a>a is a html element!</a>"
    ];
    terria.configParameters.displayOneBrand = 1;
    renderWithContexts(<Branding />, viewState);
    expect(screen.getByRole("meter")).toBeVisible();
  });

  it("renders when provided brandBarSmallElements and ignores displayOneBrand", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<meter>meter is a html element!</meter>"
    ];

    terria.configParameters.brandBarSmallElements = [
      "<small>small is a html element!</small>",
      "<a href='test'>a is a html element!</a>"
    ];
    terria.configParameters.displayOneBrand = 1;
    viewState.useSmallScreenInterface = true;
    renderWithContexts(<Branding />, viewState);

    expect(screen.getByText("small is a html element!")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "a is a html element!" })
    ).toBeVisible();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });
});
