import React from "react";
import CatalogGroup from "../../../lib/ReactViews/DataCatalog/CatalogGroup";
import Loader from "../../../lib/ReactViews/Loader";
import Text from "../../../lib/Styled/Text";
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
              loading={true}
              text={"group name"}
              isPrivate={false}
              topLevel={false}
              onClick={() => {
                throw new Error("Function not implemented.");
              }}
              displayGroup={false}
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
          <ThemeProvider theme={terriaTheme}>
            <CatalogGroup
              open={true}
              emptyMessage="nothing here"
              loading={false}
              children={null}
              text={"group name"}
              isPrivate={false}
              topLevel={true}
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
              displayGroup={false}
            ></CatalogGroup>
          </ThemeProvider>
        );
      });
      const rootElement = testRenderer.root.findByType("ul");

      const listItem = rootElement.findByType("li");
      expect(
        listItem.findAll(
          (node) =>
            node.children.length === 1 &&
            typeof node.children[0] === "string" &&
            node.children[0] === "nothing here"
        ).length
      ).toEqual(1);

      expect(testRenderer.root.findAllByType(Loader).length).toBe(0);
    });
  });
});
