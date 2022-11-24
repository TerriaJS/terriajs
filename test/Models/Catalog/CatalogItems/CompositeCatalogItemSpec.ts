import CatalogMemberFactory from "../../../../lib/Models/Catalog/CatalogMemberFactory";
import CompositeCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CompositeCatalogItem";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import { runInAction } from "mobx";

describe("CompositeCatalogItem", function () {
  let terria: Terria;
  let composite: CompositeCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    composite = new CompositeCatalogItem("test", terria);
  });

  it("loads map items after members are added", function (done) {
    const item1 = new GeoJsonCatalogItem("item1", terria);
    const item2 = new WebMapServiceCatalogItem("item2", terria);
    const item3 = new WebMapServiceCatalogItem("item3", terria);

    runInAction(() => {
      item1.setTrait(
        CommonStrata.definition,
        "url",
        "test/GeoJSON/bike_racks.geojson"
      );
      item2.setTrait(
        CommonStrata.definition,
        "url",
        "test/WMS/single_metadata_url.xml"
      );
      item3.setTrait(
        CommonStrata.definition,
        "url",
        "test/WMS/single_metadata_url.xml"
      );
    });

    composite.add(CommonStrata.definition, item1);
    composite.add(CommonStrata.definition, item2);

    composite
      .loadMapItems()
      .then(() => {
        expect(composite.mapItems.length).toBe(2);
        composite.add(CommonStrata.definition, item3);
        return composite.loadMapItems();
      })
      .then(() => {
        expect(composite.mapItems.length).toBe(3);
        done();
      });
  });

  it("updates from json, preserving order", function () {
    const json = {
      members: [
        {
          name: "B",
          type: "geojson",
          url: "test/GeoJSON/bike_racks.geojson"
        },
        {
          name: "A",
          type: "wms",
          url: "test/WMS/single_metadata_url.xml"
        }
      ]
    };

    updateModelFromJson(composite, CommonStrata.definition, json);

    expect(composite.memberModels.length).toBe(2);
    expect((<GeoJsonCatalogItem>composite.memberModels[0]).name).toBe("B");
    expect((<WebMapServiceCatalogItem>composite.memberModels[1]).name).toBe(
      "A"
    );
  });

  it("syncs visibility to its members", function () {
    const item1 = new GeoJsonCatalogItem("item1", terria);
    const item2 = new WebMapServiceCatalogItem("item2", terria);

    runInAction(() => {
      item1.setTrait(
        CommonStrata.definition,
        "url",
        "test/GeoJSON/bike_racks.geojson"
      );
      item2.setTrait(
        CommonStrata.definition,
        "url",
        "test/WMS/single_metadata_url.xml"
      );
    });

    composite.add(CommonStrata.definition, item1);
    composite.add(CommonStrata.definition, item2);

    composite.setTrait(CommonStrata.user, "show", false);

    expect(item1.show).toEqual(false);
    expect(item2.show).toEqual(false);
  });

  // it("concatenates legends", function(done) {
  //   composite
  //     .updateFromJson({
  //       type: "composite",
  //       items: [
  //         {
  //           type: "wms",
  //           legendUrl: "http://not.valid"
  //         },
  //         {
  //           type: "wms",
  //           legendUrl: "http://not.valid.either"
  //         }
  //       ]
  //     })
  //     .then(function() {
  //       expect(composite.legendUrls.slice()).toEqual([
  //         new LegendUrl("http://not.valid"),
  //         new LegendUrl("http://not.valid.either")
  //       ]);
  //     })
  //     .then(done)
  //     .catch(fail);
  // });
});
