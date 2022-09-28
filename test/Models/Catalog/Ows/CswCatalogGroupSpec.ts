"use strict";

import Terria from "../../../../lib/Models/Terria";

import CswCatalogGroup from "../../../../lib/Models/Catalog/Ows/CswCatalogGroup";
import loadText from "../../../../lib/Core/loadText";
import CatalogMemberMixin from "../../../../lib/ModelMixins/CatalogMemberMixin";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";

describe("CswCatalogGroup", function () {
  let terria: Terria;
  let group: CswCatalogGroup;
  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    group = new CswCatalogGroup("test", terria);

    updateModelFromJson(group, CommonStrata.override, {
      name: "Test",
      type: "csw",

      url: "http://oa-gis.csiro.au/geonetwork/srv/eng/csw",
      domainSpecification: {
        domainPropertyName: "awavea",
        hierarchySeparator: " | ",
        queryPropertyName: "subject"
      }
    });

    const getDomainXml = await loadText("test/csw/Example1GetDomain.xml");
    const getRecords = [
      await loadText("test/csw/Example1GetRecordsPage1.xml"),
      await loadText("test/csw/Example1GetRecordsPage2.xml"),
      await loadText("test/csw/Example1GetRecordsPage3.xml")
    ];

    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(/.*/).andError({
      statusText: "Failed request"
    });
    jasmine.Ajax.stubRequest(
      "http://oa-gis.csiro.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetDomain&propertyname=awavea"
    ).andReturn({
      contentType: "text/xml",
      responseText: getDomainXml
    });

    let page = 0;
    jasmine.Ajax.stubRequest(
      "http://oa-gis.csiro.au/geonetwork/srv/eng/csw"
    ).andCallFunction((req) => {
      req.respondWith({
        contentType: "text/xml",
        responseText: getRecords[page]
      });
      page++;
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("loads domain and creates members", async function () {
    await group.loadMembers();

    expect(group.memberModels.length).toBe(3);
    expect((group.memberModels[0] as CatalogMemberMixin.Instance).name).toBe(
      "Multiple Use"
    );
    expect((group.memberModels[2] as CatalogMemberMixin.Instance).name).toBe(
      "Wave Energy Resource"
    );

    const tidalEnergyGroup = group.memberModels[1] as CatalogGroup;
    expect(tidalEnergyGroup.name).toBe("Tidal Energy");
    expect(tidalEnergyGroup.members.length).toBe(4);

    const contextLayerGroup = tidalEnergyGroup.memberModels[0] as CatalogGroup;
    expect(contextLayerGroup.name).toBe("Context Layers");
    const wmsLayer = contextLayerGroup
      .memberModels[0] as WebMapServiceCatalogItem;
    expect(wmsLayer.name).toBe("National Tidal Model Outline");
  });

  it("loads records without domainspec", async function () {
    const group2 = new CswCatalogGroup("test2", terria);

    updateModelFromJson(group2, CommonStrata.override, {
      name: "Test",
      type: "csw",
      url: "http://oa-gis.csiro.au/geonetwork/srv/eng/csw"
    });

    await group2.loadMembers();

    expect(group2.memberModels.length).toBe(230);

    expect((group2.memberModels[0] as CatalogMemberMixin.Instance).name).toBe(
      "Percent Occurrence Tidal Currant Exceeds 1.0 m/s"
    );
    expect(group2.memberModels[0].type).toBe(WebMapServiceCatalogItem.type);

    expect((group2.memberModels[1] as CatalogMemberMixin.Instance).name).toBe(
      "Percent Occurrence Tidal Currant Exceeds 1.5 m/s"
    );
    expect(group2.memberModels[1].type).toBe(WebMapServiceCatalogItem.type);
  });

  it("loads flattened catalog", async function () {
    group.setTrait(CommonStrata.override, "flatten", true);
    await group.loadMembers();

    expect(group.memberModels.length).toBe(230);

    expect((group.memberModels[0] as CatalogMemberMixin.Instance).name).toBe(
      "Percent Occurrence Tidal Currant Exceeds 1.0 m/s"
    );
    expect(group.memberModels[0].type).toBe(WebMapServiceCatalogItem.type);

    expect((group.memberModels[1] as CatalogMemberMixin.Instance).name).toBe(
      "Percent Occurrence Tidal Currant Exceeds 1.5 m/s"
    );
    expect(group.memberModels[1].type).toBe(WebMapServiceCatalogItem.type);
  });

  it("creates correct WMS layer form record (without loading GetCapabilities)", async function () {
    await group.loadMembers();

    const wmsLayer = (
      (group.memberModels[1] as CatalogGroup).memberModels[0] as CatalogGroup
    ).memberModels[0] as WebMapServiceCatalogItem;
    expect(wmsLayer.name).toBe("National Tidal Model Outline");
    expect(wmsLayer.type).toBe(WebMapServiceCatalogItem.type);

    expect(wmsLayer.url).toBe(
      "http://oa-gis.csiro.au/geoserver/wms?SERVICE=WMS&"
    );
    expect(wmsLayer.layers).toBe("tidal:tidalModelOutline");
    expect(wmsLayer.description).toBe(
      `"Outline of the National Tidal Model grid "`
    );

    expect(wmsLayer.info[0].content).toBe(
      `[Default Polygon (LegendURL)](http://oa-gis.csiro.au/geoserver/wms?request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=tidal%3AtidalModelOutline)

[Velocity and Elevation (LegendURL)](http://oa-gis.csiro.au/geoserver/wms?request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=tidal%3AtidalModelOutline&style=velocityElevPolygons)`
    );

    expect(wmsLayer.metadataUrls[0].url).toBe(
      "http://oa-gis.csiro.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&outputSchema=http%3A%2F%2Fwww.opengis.net%2Fcat%2Fcsw%2F2.0.2&ElementSetName=full&id=6460fa70d63722049b97a00cc58b797a878157f8"
    );

    expect(wmsLayer.legends.length).toBe(0);
  });

  it("honors itemProperties", async function () {
    updateModelFromJson(group, CommonStrata.override, {
      itemProperties: {
        shortReport: "test"
      }
    });

    await group.loadMembers();

    const nestedGroup = group.memberModels[1] as CatalogGroup;

    await nestedGroup.loadMembers();

    const nestedGroup2 = nestedGroup.memberModels[0] as CatalogGroup;

    await nestedGroup2.loadMembers();

    const wmsLayer = nestedGroup2.memberModels[0] as WebMapServiceCatalogItem;

    expect(wmsLayer.shortReport).toBe("test");
  });
});
