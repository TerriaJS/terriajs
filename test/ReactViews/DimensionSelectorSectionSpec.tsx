import TestRenderer from "react-test-renderer";
import React from "react";
import { runInAction } from "mobx";
import { ThemeProvider } from "styled-components";

import CommonStrata from "../../lib/Models/CommonStrata";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import SelectableDimensions from "../../lib/Models/SelectableDimensions";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";

import DimensionSelectorSection from "../../lib/ReactViews/Workbench/Controls/DimensionSelectorSection";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import Select from "../../lib/Styled/Select";

describe("DimensionSelectorSection", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("shows all dimensions and styles for a mock wms layer", function(done) {
    const mockItem: SelectableDimensions = {
      selectableDimensions: [
        {
          id: "some-id",
          name: "Some name",
          options: [
            { id: "option-1", name: "Option 1" },
            { id: "option-2", name: "Option 2" }
          ],
          selectedId: "option-2",
          allowUndefined: true,
          setDimensionValue: (stratumId: string, newStyle: string) => {}
        },
        {
          id: "some-id-2",
          name: "Some name 2",
          options: [
            { id: "option-3", name: "Option 3" },
            { id: "option-4", name: "Option 4" },
            { id: "option-5", name: "Option 5" }
          ],
          selectedId: "option-3",
          allowUndefined: false,
          setDimensionValue: (stratumId: string, newStyle: string) => {}
        },
        {
          id: "some-id-3",
          name: "Some name 3",
          options: [
            { id: "option-6", name: "Neko" },
            { id: "option-7", name: "Mochi" },
            { id: "option-8", name: "A dog" }
          ],
          selectedId: "option-8",
          allowUndefined: false,
          setDimensionValue: (stratumId: string, newStyle: string) => {},
          disable: true
        }
      ]
    };

    const section = TestRenderer.create(
      <ThemeProvider theme={terriaTheme}>
        <DimensionSelectorSection item={mockItem} />
      </ThemeProvider>
    );

    const selects = section.root.findAllByType(Select);
    expect(selects.length).toBe(2); // The 3rd Dimension has disable:true

    const dim1 = selects[0];
    expect(dim1.props.name).toContain("some-id");
    expect(dim1.props.value).toBe("option-2");

    const elevationOptions = dim1.findAllByType("option");
    expect(elevationOptions.length).toBe(3); // This contains an 'undefined' option

    const dim2 = selects[1];
    expect(dim2.props.name).toContain("some-id-2");
    expect(dim2.props.value).toBe("option-3");
    const customOptions = dim2.findAllByType("option");
    expect(customOptions.length).toBe(3);

    done();
  });

  it("show dimensions and styles for a 'real' WMS layer", function(done) {
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
      wmsItem.setTrait(CommonStrata.definition, "parameters", {
        styles: "contour/ferret,shadefill/alg2",
        custom: "Another thing",
        elevation: "-0.59375"
      });
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        const section = TestRenderer.create(
          <ThemeProvider theme={terriaTheme}>
            <DimensionSelectorSection item={wmsItem} />
          </ThemeProvider>
        );

        const selects = section.root.findAllByType(Select);

        const labels = section.root.findAllByType("label");
        expect(selects.length).toBe(3);
        expect(labels.length).toBe(3);

        // Expect 2 styles (layer A, layer B) + 3 dimensions (elevation, custom, another)
        expect(selects.length).toBe(5);
        expect(labels.length).toBe(5);

        // Check Style A
        expect(selects[0].props.name).toContain(`${wmsItem.uniqueId}-A-styles`);
        expect(selects[0].props.value).toBe("contour/ferret");
        const styleOptions = selects[0].findAllByType("option");
        expect(styleOptions.length).toBe(40);

        expect(selects[1].props.name).toContain("dimensions-elevation");
        expect(selects[1].props.value).toBe("-0.59375");
        const elevationOptions = selects[1].findAllByType("option");
        expect(elevationOptions.length).toBe(16);

        expect(selects[2].props.name).toContain("dimensions-custom");
        expect(selects[2].props.value).toBe("Another thing");
        const customOptions = selects[2].findAllByType("option");
        expect(customOptions.length).toBe(4);
      })
      .then(done)
      .catch(done.fail);
  });

  it("shows csv styles and region mapping options", async function(done) {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({
      responseText: JSON.stringify(
        require("../../wwwroot/data/regionMapping.json")
      )
    });

    jasmine.Ajax.stubRequest("test/csv/lga_code_2015.csv").andReturn({
      responseText: require("raw-loader!../../wwwroot/test/csv/lga_code_2015.csv")
    });

    const csvItem = new CsvCatalogItem("some-csv", terria, undefined);

    runInAction(() => {
      csvItem.setTrait(
        CommonStrata.definition,
        "url",
        "test/csv/lga_code_2015.csv"
      );

      csvItem.setTrait(
        CommonStrata.definition,
        "enableManualRegionMapping",
        true
      );
    });

    await csvItem.loadMapItems();

    const section = TestRenderer.create(
      <ThemeProvider theme={terriaTheme}>
        <DimensionSelectorSection item={csvItem} />
      </ThemeProvider>
    );

    const selects = section.root.findAllByType(Select);
    expect(selects.length).toBe(3);

    if (selects.length < 3) {
      done.fail("Not enough select objects");
    }

    expect(selects[0].props.name).toContain("activeStyle");
    expect(selects[0].props.value).toBe("number");
    expect(selects[0].findAllByType("option").length).toBe(2);

    expect(selects[1].props.name).toContain("regionColumn");
    expect(selects[1].props.value).toBe("lga_code_2015");
    expect(selects[1].findAllByType("option").length).toBe(2);

    expect(selects[2].props.name).toContain("regionMapping");
    expect(selects[2].props.value).toBe("LGA_2015");

    done();

    jasmine.Ajax.uninstall();
  });
});
