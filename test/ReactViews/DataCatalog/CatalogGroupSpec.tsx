import React from "react";
import CatalogGroup from "../../../lib/ReactViews/DataCatalog/CatalogGroup";
import Loader from "../../../lib/ReactViews/Loader";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";
import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";

describe("CatalogGroup", () => {
  let testRenderer: ReturnType<typeof create>;

  describe("Loading", () => {
    it("Shows loader", () => {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <CatalogGroup
              open={true}
              t={() => {}}
              loading={true}
            ></CatalogGroup>
          </ThemeProvider>
        );
      });
      expect(testRenderer.root.findByType(Loader)).toBeTruthy();
      expect(testRenderer.root.findAllByProps({ key: "empty" }).length).toEqual(
        0
      );
    });
  });
  describe("Empty", () => {
    it("Shows empty message", () => {
      act(() => {
        testRenderer = create(
          <CatalogGroup
            t={() => {}}
            open={true}
            emptyMessage="nothing here"
            loading={false}
            children={[]}
          ></CatalogGroup>
        );
      });

      expect(
        testRenderer.root
          .findAllByType("li")
          .some((e) => e.children[0] === "nothing here")
      ).toBe(true);
      expect(testRenderer.root.findAllByType(Loader).length).toBe(0);
    });
  });
});
