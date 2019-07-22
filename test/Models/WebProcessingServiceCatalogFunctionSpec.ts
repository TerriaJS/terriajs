import { configure, reaction, runInAction } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import isDefined from "../../lib/Core/isDefined";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import DateTimeParameter from "../../lib/Models/DateTimeParameter";
import EnumerationParameter from "../../lib/Models/EnumerationParameter";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";
import GeoJsonParameter from "../../lib/Models/GeoJsonParameter";
import LineParameter from "../../lib/Models/LineParameter";
import PointParameter from "../../lib/Models/PointParameter";
import PolygonParameter from "../../lib/Models/PolygonParameter";
import RectangleParameter from "../../lib/Models/RectangleParameter";
import ResultPendingCatalogItem from "../../lib/Models/ResultPendingCatalogItem";
import StringParameter from "../../lib/Models/StringParameter";
import Terria from "../../lib/Models/Terria";
import WebProcessingServiceCatalogFunction, {
  PointConverter
} from "../../lib/Models/WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogItem from "../../lib/Models/WebProcessingServiceCatalogItem";
import Workbench from "../../lib/Models/Workbench";
import xml2json from "../../lib/ThirdParty/xml2json";
import "../SpecHelpers";
import { xml } from "../SpecHelpers";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

const processDescriptionsXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/ProcessDescriptions.xml")
);

const executeResponseXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/ExecuteResponse.xml")
);

const failedExecuteResponseXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/FailedExecuteResponse.xml")
);

const pendingExecuteResponseXml = xml(
  require("raw-loader!../../wwwroot/test/WPS/PendingExecuteResponse.xml")
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
    let getXml: jasmine.Spy;

    beforeEach(async function() {
      getXml = spyOn(wps, "getXml").and.returnValue(processDescriptionsXml);
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
        "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
      );
      const execute = xml2json(xml(postXml.calls.argsFor(0)[1]));
      expect(execute.Identifier).toBe(wps.identifier);
      expect(execute.DataInputs.Input.Identifier).toBe("geometry");
      expect(execute.DataInputs.Input.Data.ComplexData).toBeDefined();
    });

    it("makes a GET request to the Execute endpoint when `executeWithHttpGet` is true", async function() {
      runInAction(() => wps.setTrait("definition", "executeWithHttpGet", true));
      getXml.and.returnValue(executeResponseXml);
      await wps.invoke();
      const [url, params] = getXml.calls.argsFor(1);
      expect(url).toBe(
        "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
      );
      expect(params.Identifier).toBe("someId");
      expect(params.DataInputs).toMatch(/geometry=/);
      expect(params.storeExecuteResponse).toBe(true);
      expect(params.status).toBe(true);
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

    describe("otherwise if `statusLocation` is set", function() {
      it("polls the statusLocation for the result", async function() {
        spyOn(wps, "postXml").and.returnValue(pendingExecuteResponseXml);
        getXml.and.returnValues(pendingExecuteResponseXml, executeResponseXml);
        await wps.invoke();
        expect(getXml).toHaveBeenCalledTimes(3);
        expect(getXml.calls.argsFor(1)[0]).toBe(
          "http://gsky.nci.org.au/ows?check_status/123"
        );
        expect(getXml.calls.argsFor(2)[0]).toBe(
          "http://gsky.nci.org.au/ows?check_status/123"
        );
      });

      it("stops polling if pendingItem is removed from the workbench", async function() {
        spyOn(wps.terria.workbench, "add"); // do nothing
        spyOn(wps, "postXml").and.returnValue(pendingExecuteResponseXml);
        getXml.and.returnValues.apply(
          null,
          [...Array(10)].map(() => pendingExecuteResponseXml)
        );
        await wps.invoke();
        expect(getXml.calls.all.length).toBe(0);
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
      expect(parameter).toEqual(jasmine.any(EnumerationParameter));
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
      expect(parameter).toEqual(jasmine.any(EnumerationParameter));
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
      expect(parameter).toEqual(jasmine.any(StringParameter));
    });

    it("converts ComplexData input with datetime schema to DateTimeParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry",
        ComplexData: {
          Default: {
            Format: { Schema: "http://www.w3.org/TR/xmlschema-2/#dateTime" }
          }
        }
      });
      expect(parameter).toEqual(jasmine.any(DateTimeParameter));
    });

    it("converts ComplexData input with point schema to PointParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry",
        ComplexData: {
          Default: {
            Format: { Schema: "http://geojson.org/geojson-spec.html#point" }
          }
        }
      });
      expect(parameter).toEqual(jasmine.any(PointParameter));
    });

    it("converts ComplexData input with line schema to LineParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry",
        ComplexData: {
          Default: {
            Format: {
              Schema: "http://geojson.org/geojson-spec.html#linestring"
            }
          }
        }
      });
      expect(parameter).toEqual(jasmine.any(LineParameter));
    });

    it("converts ComplexData input with polygon schema to PolygonParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry",
        ComplexData: {
          Default: {
            Format: { Schema: "http://geojson.org/geojson-spec.html#polygon" }
          }
        }
      });
      expect(parameter).toEqual(jasmine.any(PolygonParameter));
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
      expect(parameter).toEqual(jasmine.any(GeoJsonParameter));
    });

    it("converts input with BoundingBoxData to RectangleParameter", function() {
      const parameter = wps.convertInputToParameter({
        Identifier: "geometry",
        BoundingBoxData: {
          Default: { CRS: "crs84" }
        }
      });
      expect(parameter).toEqual(jasmine.any(RectangleParameter));
    });
  });

  it("can convert a parameter to data input", async function() {
    const parameter = new PointParameter({
      id: "foo",
      converter: PointConverter
    });
    parameter.value = Cartographic.ZERO;
    const input = await wps.convertParameterToInput(parameter);
    expect(input).toEqual({
      inputIdentifier: "foo",
      inputValue:
        '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0,0]}}]}',
      inputType: "ComplexData"
    });
  });
});

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
