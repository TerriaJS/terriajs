import { configure, reaction, runInAction } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import isDefined from "../../lib/Core/isDefined";
import TerriaError from "../../lib/Core/TerriaError";
import AsyncMappableMixin from "../../lib/ModelMixins/AsyncMappableMixin";
import CommonStrata from "../../lib/Models/CommonStrata";
import DateTimeParameter from "../../lib/Models/FunctionParameters/DateTimeParameter";
import EnumerationParameter from "../../lib/Models/FunctionParameters/EnumerationParameter";
import GeoJsonParameter from "../../lib/Models/FunctionParameters/GeoJsonParameter";
import LineParameter from "../../lib/Models/FunctionParameters/LineParameter";
import PointParameter from "../../lib/Models/FunctionParameters/PointParameter";
import PolygonParameter from "../../lib/Models/FunctionParameters/PolygonParameter";
import RectangleParameter from "../../lib/Models/FunctionParameters/RectangleParameter";
import StringParameter from "../../lib/Models/FunctionParameters/StringParameter";
import Terria from "../../lib/Models/Terria";
import WebProcessingServiceCatalogFunction from "../../lib/Models/WebProcessingServiceCatalogFunction";
import WebProcessingServiceCatalogFunctionJob from "../../lib/Models/WebProcessingServiceCatalogFunctionJob";
import "../SpecHelpers";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);
configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

const processDescriptionsXml = require("raw-loader!../../wwwroot/test/WPS/ProcessDescriptions.xml");

const executeResponseXml = require("raw-loader!../../wwwroot/test/WPS/ExecuteResponse.xml");

const failedExecuteResponseXml = require("raw-loader!../../wwwroot/test/WPS/FailedExecuteResponse.xml");

const pendingExecuteResponseXml = require("raw-loader!../../wwwroot/test/WPS/PendingExecuteResponse.xml");

describe("WebProcessingServiceCatalogFunction", function() {
  let wps: WebProcessingServiceCatalogFunction;

  beforeEach(function() {
    const terria = initTerria();
    wps = new WebProcessingServiceCatalogFunction("test", terria);
    runInAction(() => {
      wps.setTrait("definition", "url", "http://example.com/wps");
      wps.setTrait("definition", "identifier", "someId");
    });
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      "http://example.com/wps?service=WPS&request=DescribeProcess&version=1.0.0&Identifier=someId"
    ).andReturn({ responseText: processDescriptionsXml });

    jasmine.Ajax.stubRequest(
      "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
    ).andReturn({ responseText: executeResponseXml });

    jasmine.Ajax.stubRequest(
      "http://example.com/wps?service=WPS&request=Execute&version=1.0.0&Identifier=someId&DataInputs=geometry%3D%7B%22type%22%3A%22FeatureCollection%22%2C%22features%22%3A%5B%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Point%22%2C%22coordinates%22%3A%5B144.97227858979468%2C-37.771379205590165%2C-1196.8235676901866%5D%7D%2C%22properties%22%3A%7B%7D%7D%5D%7D&storeExecuteResponse=false&status=false"
    ).andReturn({ responseText: executeResponseXml });

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("has a type & typeName", function() {
    expect(WebProcessingServiceCatalogFunction.type).toBe("wps");
    expect(wps.typeName).toBe("Web Processing Service (WPS)");
  });

  describe("when loading", function() {
    it("should correctly query the DescribeProcess endpoint", async function() {
      await wps.loadMetadata();
      expect(wps.functionParameters.length).toBe(2);
      expect(wps.functionParameters.map(({ type }) => type)).toEqual([
        "string",
        "geojson"
      ]);
    });
  });

  describe("when invoked", function() {
    let dispose: () => void;

    beforeEach(async function() {
      dispose = reaction(
        () => wps.parameters,
        () => {}
      );
      await wps.loadMetadata();
      runInAction(() => {
        const param = <GeoJsonParameter>(
          wps.functionParameters.find(p => p.type === "geojson")
        );
        param.subtype = GeoJsonParameter.PointType;
        param.setValue(CommonStrata.user, {
          longitude: 2.5302435855103993,
          latitude: -0.6592349301568685,
          height: -1196.8235676901866
        });
      });
    });

    afterEach(function() {
      dispose();
    });

    it("makes a POST request to the Execute endpoint", async function() {
      const job = (await wps.submitJob()) as WebProcessingServiceCatalogFunctionJob;

      expect(job.identifier).toBe("someId");
      // expect(job.).toMatch(/geometry=/);
      expect(job.jobStatus).toBe("finished");
    });

    it("makes a GET request to the Execute endpoint when `executeWithHttpGet` is true", async function() {
      runInAction(() => wps.setTrait("definition", "executeWithHttpGet", true));

      const job = (await wps.submitJob()) as WebProcessingServiceCatalogFunctionJob;

      expect(job.identifier).toBe("someId");
      // expect(job.).toMatch(/geometry=/);
      expect(job.wpsResponse).toBeDefined();
      expect(job.jobStatus).toBe("finished");
    });

    it("adds a ResultPendingCatalogItem to the workbench", async function() {
      const job = (await wps.submitJob()) as WebProcessingServiceCatalogFunctionJob;
      expect(job.inWorkbench).toBeTruthy();
    });

    describe("on success", function() {
      let job: WebProcessingServiceCatalogFunctionJob;
      beforeEach(async function() {
        job = (await wps.submitJob()) as WebProcessingServiceCatalogFunctionJob;

        await new Promise((resolve, reject) => {
          reaction(
            () => job.downloadedResults,
            () => {
              if (job.downloadedResults) resolve();
            },
            { fireImmediately: true }
          );
        });
      });

      it("adds a WebProcessingServiceCatalogFunctionJob to workbench", async function() {
        expect(job.inWorkbench).toBeTruthy();
      });

      it("adds result to workbench", async function() {
        expect(job.results.length).toBe(2);
        expect(AsyncMappableMixin.isMixedInto(job.results[0])).toBeTruthy();
        expect(AsyncMappableMixin.isMixedInto(job.results[1])).toBeTruthy();
        expect(
          ((<unknown>job.results[0]) as AsyncMappableMixin.AsyncMappableMixin)
            .inWorkbench
        ).toBeTruthy();
        expect(
          ((<unknown>job.results[1]) as AsyncMappableMixin.AsyncMappableMixin)
            .inWorkbench
        ).toBeTruthy();
      });
    });

    describe("otherwise if `statusLocation` is set", function() {
      it("polls the statusLocation for the result", async function() {
        jasmine.Ajax.stubRequest(
          "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
        ).andReturn({ responseText: pendingExecuteResponseXml });

        jasmine.Ajax.stubRequest(
          "http://example.com/ows?check_status/123"
        ).andReturn({ responseText: executeResponseXml });

        const job = await wps.submitJob();

        expect(job.jobStatus).toBe("running");

        // Wait for job to finish polling, then check if finished
        await new Promise((resolve, reject) => {
          reaction(
            () => job.refreshEnabled,
            () => {
              if (!job.refreshEnabled) {
                expect(job.jobStatus).toBe("finished");
                resolve();
              }
            },
            { fireImmediately: true }
          );
        });
      });

      it("stops polling if pendingItem is removed from the workbench", async function() {
        spyOn(wps.terria.workbench, "add"); // do nothing
        jasmine.Ajax.stubRequest(
          "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
        ).andReturn({ responseText: pendingExecuteResponseXml });

        // Note: we don't stubRequest "http://example.com/ows?check_status/123" here - so an error will be thrown if the job polls for a result

        const job = await wps.submitJob();
        expect(job.jobStatus).toBe("running");
      });
    });

    describe("on failure", function() {
      let dispose: () => void;

      beforeEach(async function() {
        dispose = reaction(
          () => wps.parameters,
          () => {}
        );
        await wps.loadMetadata();
        runInAction(() => {
          const param = <GeoJsonParameter>(
            wps.functionParameters.find(p => p.type === "geojson")
          );
          param.subtype = GeoJsonParameter.PointType;
          param.setValue(CommonStrata.user, {
            longitude: 2.5302435855103993,
            latitude: -0.6592349301568685,
            height: -1196.8235676901866
          });
        });
      });

      afterEach(function() {
        dispose();
      });

      it("marks the ResultPendingCatalogItem as failed - for polling results", async function() {
        jasmine.Ajax.stubRequest(
          "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
        ).andReturn({ responseText: pendingExecuteResponseXml });

        jasmine.Ajax.stubRequest(
          "http://example.com/ows?check_status/123"
        ).andReturn({ responseText: failedExecuteResponseXml });

        const job = (await wps.submitJob()) as WebProcessingServiceCatalogFunctionJob;

        // Wait for job to finish polling, then check if failed
        await new Promise((resolve, reject) => {
          reaction(
            () => job.refreshEnabled,
            () => {
              if (!job.refreshEnabled) {
                expect(job.jobStatus).toBe("error");
                expect(job.shortReport).toBeDefined();
                expect(job.shortReport).toMatch(/invocation failed/i);

                resolve();
              }
            },
            { fireImmediately: true }
          );
        });
      });

      it("marks the ResultPendingCatalogItem as failed", async function() {
        jasmine.Ajax.stubRequest(
          "http://example.com/wps?service=WPS&request=Execute&version=1.0.0"
        ).andReturn({ responseText: failedExecuteResponseXml });

        try {
          const job = await wps.submitJob();
          expect(job).toBeUndefined();
        } catch (error) {
          expect(error).toBeDefined();
          expect(error instanceof TerriaError).toBeTruthy();
          expect(error.message).toBe(
            "One of the identifiers passed does not match with any of the processes offered by this server"
          );
        }
      });
    });
  });

  describe("convertInputToParameter", function() {
    it("works for a simple input", function() {
      const parameter = wps.convertInputToParameter(wps, {
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
      const parameter = wps.convertInputToParameter(wps, {
        Identifier: "geometry_id",
        LiteralData: { AllowedValues: { Value: ["Point", "Polygon"] } }
      });
      expect(parameter).toEqual(jasmine.any(EnumerationParameter));
      if (parameter) {
        const enumParameter = <EnumerationParameter>parameter;
        expect(enumParameter.options).toEqual([
          { id: "Point" },
          { id: "Polygon" }
        ]);
      }
    });

    it("converts LiteralData input with `AllowedValue` to EnumerationParameter", function() {
      const parameter = wps.convertInputToParameter(wps, {
        Identifier: "geometry_id",
        LiteralData: { AllowedValue: { Value: "Point" } }
      });
      expect(parameter).toEqual(jasmine.any(EnumerationParameter));
      if (parameter) {
        const enumParameter = <EnumerationParameter>parameter;
        expect(enumParameter.options).toEqual([{ id: "Point" }]);
      }
    });

    it("converts LiteralData input with `AnyValue` to StringParameter", function() {
      const parameter = wps.convertInputToParameter(wps, {
        Identifier: "geometry_id",
        LiteralData: { AnyValue: {} }
      });
      expect(parameter).toEqual(jasmine.any(StringParameter));
    });

    it("converts ComplexData input with datetime schema to DateTimeParameter", function() {
      const parameter = wps.convertInputToParameter(wps, {
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
      const parameter = wps.convertInputToParameter(wps, {
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
      const parameter = wps.convertInputToParameter(wps, {
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
      const parameter = wps.convertInputToParameter(wps, {
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
      const parameter = wps.convertInputToParameter(wps, {
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
      const parameter = wps.convertInputToParameter(wps, {
        Identifier: "geometry",
        BoundingBoxData: {
          Default: { CRS: "crs84" }
        }
      });
      expect(parameter).toEqual(jasmine.any(RectangleParameter));
    });
  });

  it("can convert a parameter to data input", async function() {
    const parameter = new PointParameter(wps, {
      id: "foo"
    });
    parameter.setValue(CommonStrata.user, Cartographic.ZERO);
    const input = await wps.convertParameterToInput(parameter);
    expect(input).toEqual({
      inputIdentifier: "foo",
      inputValue:
        '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0,0]},"properties":{}}]}',
      inputType: "ComplexData"
    });
  });
});

function initTerria() {
  const terria = new Terria({ baseUrl: "./" });

  return terria;
}
