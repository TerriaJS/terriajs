import {
  create,
  ReactTestInstance,
  ReactTestRenderer
} from "react-test-renderer";
import React from "react";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import ShortReport from "../../lib/ReactViews/Workbench/Controls/ShortReport";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Collapsible from "../../lib/ReactViews/Custom/Collapsible/Collapsible";

describe("ShortReport", function() {
  let testRenderer: ReactTestRenderer | undefined;
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function() {
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
      }
    ]);
  });

  describe("with basic props", function() {
    it("renders without errors", function() {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <ShortReport item={wmsItem} />
          </ThemeProvider>
        );
      });

      if (!testRenderer) throw "Invalid testRenderer";

      const reports = testRenderer.root.findAll((node: ReactTestInstance) =>
        node.children.some((child: any) => child.match?.("Report Name"))
      );
      expect(reports.length).toEqual(2);

      // Test that collapsible components have been created with correct props
      expect(
        testRenderer.root.findAllByProps({
          title: "Report Name 1",
          isOpen: true
        }).length
      ).toBe(1);

      expect(
        testRenderer.root.findAllByProps({
          title: "Report Name 2",
          isOpen: false
        }).length
      ).toBe(1);
    });
  });
});
