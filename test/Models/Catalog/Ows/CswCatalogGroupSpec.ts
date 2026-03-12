import { http, HttpResponse } from "msw";
import Terria from "../../../../lib/Models/Terria";

import CswCatalogGroup from "../../../../lib/Models/Catalog/Ows/CswCatalogGroup";
import CatalogMemberMixin from "../../../../lib/ModelMixins/CatalogMemberMixin";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import { worker } from "../../../mocks/browser";

import getDomainXml from "../../../../wwwroot/test/csw/Example1GetDomain.xml";
import getRecordsPage1Xml from "../../../../wwwroot/test/csw/Example1GetRecordsPage1.xml";
import getRecordsPage2Xml from "../../../../wwwroot/test/csw/Example1GetRecordsPage2.xml";
import getRecordsPage3Xml from "../../../../wwwroot/test/csw/Example1GetRecordsPage3.xml";

describe("CswCatalogGroup", function () {
  let terria: Terria;
  let group: CswCatalogGroup;
  beforeEach(function () {
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

    const getRecords = [
      getRecordsPage1Xml,
      getRecordsPage2Xml,
      getRecordsPage3Xml
    ];

    let page = 0;
    worker.use(
      http.get(
        "http://oa-gis.csiro.au/geonetwork/srv/eng/csw",
        ({ request }) => {
          const url = new URL(request.url);
          const reqType = url.searchParams.get("request");
          if (reqType === "GetDomain") {
            if (url.searchParams.get("propertyname") !== "awavea")
              throw new Error(`Unexpected query params: ${url.search}`);
            return new HttpResponse(getDomainXml, {
              headers: { "Content-Type": "text/xml" }
            });
          }
          throw new Error(`Unexpected GET request: ${url.search}`);
        }
      ),
      http.post("http://oa-gis.csiro.au/geonetwork/srv/eng/csw", () => {
        const xml = getRecords[page];
        page++;
        return new HttpResponse(xml, {
          headers: { "Content-Type": "text/xml" }
        });
      }),
      http.all("*", () => HttpResponse.error())
    );
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
