import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import ShortReport from "../../lib/ReactViews/Workbench/Controls/ShortReport";
import userEvent from "@testing-library/user-event";

describe("ShortReport", function () {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem("mochiwms", terria);
    wmsItem.setTrait("definition", "shortReportSections", [
      {
        name: "Report Name 1",
        content: "Some content which is showing",
        show: true
      },
      {
        name: "Report Name 2",
        content: "Some content which is hidden by default",
        show: false
      },
      {
        name: "Report Name - with no content",
        content: undefined,
        show: undefined
      }
    ]);
  });

  it("renders section content", function () {
    render(
      <ThemeProvider theme={terriaTheme}>
        <ShortReport item={wmsItem} />
      </ThemeProvider>
    );

    // All three report names should be rendered
    expect(screen.getByRole("button", { name: "Report Name 1" })).toBeVisible();
    expect(screen.getByText("Some content which is showing")).toBeVisible();
    expect(screen.getByRole("button", { name: "Report Name 2" })).toBeVisible();
    expect(
      screen.queryByText("Some content which is hidden by default")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Report Name - with no content")).toBeVisible();
  });

  it("should expand and collapse sections when the section name is clicked", async function () {
    render(
      <ThemeProvider theme={terriaTheme}>
        <ShortReport item={wmsItem} />
      </ThemeProvider>
    );

    const section2Btn = screen.getByRole("button", { name: "Report Name 2" });
    expect(
      screen.queryByText("Some content which is hidden by default")
    ).not.toBeInTheDocument();

    await userEvent.click(section2Btn);

    expect(
      screen.getByText("Some content which is hidden by default")
    ).toBeVisible();

    const section1Btn = screen.getByRole("button", { name: "Report Name 1" });
    expect(screen.getByText("Some content which is showing")).toBeVisible();
    await userEvent.click(section1Btn);

    expect(
      screen.queryByText("Some content which is showing")
    ).not.toBeInTheDocument();
  });
});
