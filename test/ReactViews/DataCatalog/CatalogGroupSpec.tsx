import { render, screen } from "@testing-library/react";
import CatalogGroup from "../../../lib/ReactViews/DataCatalog/CatalogGroup";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";

describe("CatalogGroup", () => {
  describe("Loading", () => {
    it("Shows loader", () => {
      render(
        <ThemeProvider theme={terriaTheme}>
          <CatalogGroup open t={() => {}} loading emptyMessage="nothing here" />
        </ThemeProvider>
      );
      // Loader renders a spinning element
      expect(screen.getByText("loader.loadingMessage")).toBeVisible();
      // No empty message
      expect(screen.queryByText("nothing here")).not.toBeInTheDocument();
    });
    it("Doesn't show children when loading", () => {
      render(
        <ThemeProvider theme={terriaTheme}>
          <CatalogGroup open t={() => {}} loading>
            <span>some child</span>
          </CatalogGroup>
        </ThemeProvider>
      );
      expect(screen.getByText("loader.loadingMessage")).toBeVisible();
      expect(screen.queryByText("some child")).not.toBeInTheDocument();
    });

    it("Shows children when not loading", () => {
      render(
        <ThemeProvider theme={terriaTheme}>
          <CatalogGroup open t={() => {}} loading={false}>
            <span>some child</span>
          </CatalogGroup>
        </ThemeProvider>
      );
      expect(
        screen.queryByText("loader.loadingMessage")
      ).not.toBeInTheDocument();
      expect(screen.getByText("some child")).toBeTruthy();
    });
  });
  describe("Empty", () => {
    it("Shows empty message", () => {
      render(
        <CatalogGroup
          t={() => {}}
          open
          emptyMessage="nothing here"
          loading={false}
        >
          {[]}
        </CatalogGroup>
      );

      expect(screen.getByText("nothing here")).toBeTruthy();
    });
  });
});
