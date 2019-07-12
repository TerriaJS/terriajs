import { runInAction, reaction } from "mobx";
import isDefined from "../../lib/Core/isDefined";
import EnumerationParameter from "../../lib/Models/EnumerationParameter";
import GeoJsonParameter from "../../lib/Models/GeoJsonParameter";
import StringParameter from "../../lib/Models/StringParameter";
import Terria from "../../lib/Models/Terria";
import WebProcessingServiceCatalogFunction from "../../lib/Models/WebProcessingServiceCatalogFunction";
import xml2json from "../../lib/ThirdParty/xml2json";
import ResultPendingCatalogItem from "../../lib/Models/ResultPendingCatalogItem";
import Workbench from "../../lib/Models/Workbench";
import WebProcessingServiceCatalogItem from "../../lib/Models/WebProcessingServiceCatalogItem";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";

const processDescriptionsXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/ProcessDescriptions.xml")
);

const executeResponseXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/ExecuteResponse.xml")
);

const failedExecuteResponseXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/FailedExecuteResponse.xml")
);

describe("WebProcessingServiceCatalogFunction", function() {
  let wps: WebProcessingServiceCatalogFunction;

  beforeEach(function() {
    const terria = initTerria();
    wps = new WebProcessingServiceCatalogFunction("test", terria);
    runInAction(() => {
      wps.setTrait("definition", "url", "http://example.com/wps");
      wps.setTrait("definition", "identifier", "someId");
    });
  });

  it("has a type & typeName", function() {
    expect(WebProcessingServiceCatalogFunction.type).toBe("wps");
    expect(wps.typeName).toBe("Web Processing Service (WPS)");
  });

  describe("when loading", function() {
    it("should correctly query the DescribeProcess endpoint", async function() {
      spyOn(wps, "getXml").and.returnValue(processDescriptionsXml);
      await wps.loadMetadata();
      expect(wps.getXml).toHaveBeenCalledWith(
        "http://example.com/wps?service=WPS&request=DescribeProcess&version=1.0.0&Identifier=someId"
      );
    });
  });

  describe("when loaded", function() {
    beforeEach(async function() {
      spyOn(wps, "getXml").and.returnValue(processDescriptionsXml);
      await wps.loadMetadata();
    });

    describe("parameters", function() {
      it("returns one parameter for each input", function() {
        expect(wps.parameters.map(({ type }) => type)).toEqual([
          "string",
          "geojson"
        ]);
      });
    });
  });

  describe("when invoked", function() {
    let dispose: () => void;

    beforeEach(async function() {
      spyOn(wps, "getXml").and.returnValue(processDescriptionsXml);
      dispose = reaction(() => wps.parameters, () => {});
      await wps.loadMetadata();
      runInAction(() => {
        const param = <GeoJsonParameter>(
          wps.parameters.find(p => p.type === "geojson")
        );
        param.subtype = GeoJsonParameter.PointType;
        param.value = {
          longitude: 2.5302435855103993,
          latitude: -0.6592349301568685,
          height: -1196.8235676901866
        };
      });
    });

    afterEach(function() {
      dispose();
    });

    it("makes a POST request to the Execute endpoint", async function() {
      const postXml = spyOn(wps, "postXml").and.returnValue(executeResponseXml);
      await wps.invoke();
      expect(postXml.calls.argsFor(0)[0]).toBe(
        "http://example.com/wps?service=WPS&request=Execute"
      );
      const execute = xml2json(xml(postXml.calls.argsFor(0)[1]));
      expect(execute.Identifier).toBe(wps.identifier);
      expect(execute.DataInputs.Input.Identifier).toBe("geometry");
      expect(execute.DataInputs.Input.Data.ComplexData).toBe(
        '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[144.97227858979468,-37.771379205590165,-1196.8235676901866]}}]}'
      );
    });

    it("adds a ResultPendingCatalogItem to the workbench", async function() {
      spyOn(wps, "postXml").and.returnValue(executeResponseXml);
      spyOn(wps.terria.workbench, "add").and.callThrough();
      await wps.invoke();
      expect(wps.terria.workbench.add).toHaveBeenCalledWith(
        jasmine.any(ResultPendingCatalogItem)
      );
    });

    describe("on success", function() {
      let workbench: Workbench;
      beforeEach(function() {
        spyOn(wps, "postXml").and.returnValue(executeResponseXml);
        workbench = wps.terria.workbench;
      });

      it("adds a WebProcessingServiceCatalogItem to workbench", async function() {
        spyOn(workbench, "add").and.callThrough();
        await wps.invoke();
        expect(workbench.add).toHaveBeenCalledWith(
          jasmine.any(WebProcessingServiceCatalogItem)
        );
      });

      it("removes the ResultPendingCatalogItem", async function() {
        spyOn(workbench, "remove").and.callThrough();
        await wps.invoke();
        expect(workbench.remove).toHaveBeenCalledWith(
          jasmine.any(ResultPendingCatalogItem)
        );
      });
    });

    describe("on failure", function() {
      it("marks the ResultPendingCatalogItem as failed", async function() {
        spyOn(wps, "postXml").and.returnValue(failedExecuteResponseXml);
        const workbenchAdd = spyOn(
          wps.terria.workbench,
          "add"
        ).and.callThrough();
        await wps.invoke();
        const pendingItem: ResultPendingCatalogItem = workbenchAdd.calls.argsFor(
          0
        )[0];
        expect(pendingItem.shortReport).toBeDefined();
        if (isDefined(pendingItem.shortReport)) {
          expect(pendingItem.shortReport).toMatch(/invocation failed/i);
          const errorInfo = pendingItem.info[pendingItem.info.length - 1];
          expect(errorInfo.content).toMatch(
            /identifiers passed does not match/i
          );
        }
      });
    });
  });

  describe("convertInputToParameter", function() {
    it("works for a simple input", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry_id",
        Name: "Geometry ID",
        Abstract: "ID of the input",
        LiteralData: { AnyValue: {} },
        minOccurs: 1
      });
      expect(parameter).toBeDefined();
      if (isDefined(parameter)) {
        expect(parameter.id).toBe("geometry_id");
        expect(parameter.name).toBe("Geometry ID");
        expect(parameter.description).toBe("ID of the input");
        expect(parameter.isRequired).toBe(true);
      }
    });

    it("converts LiteralData input with `AllowedValues` to EnumerationParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry_id",
        LiteralData: { AllowedValues: { Value: ["Point", "Polygon"] } }
      });
      expect(parameter instanceof EnumerationParameter).toBeTruthy();
      if (parameter) {
        const enumParameter = <EnumerationParameter>parameter;
        expect(enumParameter.possibleValues).toEqual(["Point", "Polygon"]);
      }
    });

    it("converts LiteralData input with `AllowedValue` to EnumerationParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry_id",
        LiteralData: { AllowedValue: { Value: "Point" } }
      });
      expect(parameter instanceof EnumerationParameter).toBeTruthy();
      if (parameter) {
        const enumParameter = <EnumerationParameter>parameter;
        expect(enumParameter.possibleValues).toEqual(["Point"]);
      }
    });

    it("converts LiteralData input with `AnyValue` to StringParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry_id",
        LiteralData: { AnyValue: {} }
      });
      expect(parameter instanceof StringParameter).toBeTruthy();
    });

    it("converts ComplexData input with GeoJson schema to GeoJsonParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry",
        ComplexData: {
          Default: {
            Format: { Schema: "http://geojson.org/geojson-spec.html#geojson" }
          }
        }
      });
      expect(parameter instanceof GeoJsonParameter).toBeTruthy();
    });
  });
});

function xml(text: string) {
  return new DOMParser().parseFromString(text, "application/xml");
}

function initTerria() {
  CatalogMemberFactory.register(CsvCatalogItem.type, <any>CsvCatalogItem);
  CatalogMemberFactory.register(GeoJsonCatalogItem.type, <any>(
    GeoJsonCatalogItem
  ));
  const terria = new Terria();
  terria.configParameters.regionMappingDefinitionsUrl =
    "/data/regionMapping.json";
  return terria;
}
