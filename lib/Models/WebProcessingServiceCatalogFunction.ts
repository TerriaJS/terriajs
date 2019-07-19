import { computed, observable, runInAction } from "mobx";
import Mustache from "mustache";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import URI from "urijs";
import isDefined from "../Core/isDefined";
import runLater from "../Core/runLater";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import XmlRequestMixin from "../ModelMixins/XmlRequestMixin";
import xml2json from "../ThirdParty/xml2json";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import WebProcessingServiceCatalogFunctionTraits from "../Traits/WebProcessingServiceCatalogFunctionTraits";
import { ParameterTraits } from "../Traits/WebProcessingServiceCatalogItemTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import DateTimeParameter from "./DateTimeParameter";
import EnumerationParameter from "./EnumerationParameter";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameter";
import GeoJsonParameter from "./GeoJsonParameter";
import LineParameter from "./LineParameter";
import PointParameter from "./PointParameter";
import PolygonParameter from "./PolygonParameter";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import RegionParameter from "./RegionParameter";
import RegionTypeParameter from "./RegionTypeParameter";
import ResultPendingCatalogItem from "./ResultPendingCatalogItem";
import StringParameter from "./StringParameter";
import WebProcessingServiceCatalogItem from "./WebProcessingServiceCatalogItem";
import RectangleParameter from "./RectangleParameter";

const Reproject = require("../Map/Reproject");
const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf");
const executeWpsTemplate = require("./ExecuteWpsTemplate.xml");

interface AllowedValues {
  Value?: string | string[];
}

interface LiteralData {
  AllowedValues?: AllowedValues;
  AllowedValue?: AllowedValues;
  AnyValue?: unknown;
}

interface ComplexData {
  Default?: { Format?: { Schema?: string } };
}

interface BoundingBoxData {
  Default?: { CRS?: string };
  Supported?: { CRS?: string[] };
}

interface Input {
  Identifier?: string;
  Name?: string;
  Abstract?: string;
  LiteralData?: LiteralData;
  ComplexData?: ComplexData;
  BoundingBoxData?: BoundingBoxData;
  minOccurs?: number;
}

interface ProcessDescription {
  DataInputs?: { Input: Input[] | Input };
  storeSupported?: string;
  statusSupported?: string;
}

interface InputData {
  inputValue: Promise<string | undefined> | string | undefined;
  inputType: string;
}

interface ParameterConverter {
  inputToParameter: (
    input: Input,
    options: FunctionParameterOptions
  ) => FunctionParameter | undefined;

  parameterToInput: (parameter: FunctionParameter) => InputData | undefined;
}

export default class WebProcessingServiceCatalogFunction extends XmlRequestMixin(
  CatalogMemberMixin(CreateModel(WebProcessingServiceCatalogFunctionTraits))
) {
  static readonly type = "wps";
  readonly typeName = "Web Processing Service (WPS)";
  readonly proxyCacheDuration = "1d";

  readonly parameterConverters: ParameterConverter[] = [
    LiteralDataConverter,
    DateTimeConverter,
    PointConverter,
    LineConverter,
    PolygonConverter,
    RectangleConverter,
    GeoJsonGeometryConverter
  ];

  @observable.shallow
  private processDescription?: ProcessDescription;

  @computed get describeProcessUrl() {
    if (!isDefined(this.url) || !isDefined(this.identifier)) {
      return;
    }

    const uri = new URI(this.url).query({
      service: "WPS",
      request: "DescribeProcess",
      version: "1.0.0",
      Identifier: this.identifier
    });

    return proxyCatalogItemUrl(this, uri.toString(), this.proxyCacheDuration);
  }

  @computed get executeUrl() {
    if (!isDefined(this.url)) {
      return;
    }

    const uri = new URI(this.url).query({
      service: "WPS",
      request: "Execute",
      version: "1.0.0"
    });
    return proxyCatalogItemUrl(this, uri.toString(), this.proxyCacheDuration);
  }

  async forceLoadMetadata() {
    if (!isDefined(this.describeProcessUrl)) {
      return;
    }

    const xml = await this.getXml(this.describeProcessUrl);
    if (
      !isDefined(xml) ||
      !isDefined(xml.documentElement) ||
      xml.documentElement.localName !== "ProcessDescriptions"
    ) {
      throwInvalidWpsServerError(this, "DescribeProcess");
    }

    const json = xml2json(xml);
    if (!isDefined(json.ProcessDescription)) {
      throw new TerriaError({
        sender: this,
        title: "Process does not have a process description",
        message:
          "The WPS DescribeProcess for this process does not include a ProcessDescription."
      });
    }

    runInAction(() => {
      this.processDescription = json.ProcessDescription;
    });
  }

  @computed get storeSupported() {
    return (
      isDefined(this.processDescription) &&
      this.processDescription.storeSupported === "true"
    );
  }

  @computed get statusSupported() {
    return (
      isDefined(this.processDescription) &&
      this.processDescription.statusSupported === "true"
    );
  }

  /**
   * Return the inputs in the processDescription
   */
  @computed get inputs(): Input[] {
    if (!isDefined(this.processDescription)) {
      return [];
    }

    const dataInputs = this.processDescription.DataInputs;
    if (!isDefined(dataInputs) || !isDefined(dataInputs.Input)) {
      throw new TerriaError({
        sender: this,
        title: "Process does not have any inputs",
        message: "This WPS process does not specify any inputs."
      });
    }

    const inputs = Array.isArray(dataInputs.Input)
      ? dataInputs.Input
      : [dataInputs.Input];
    return inputs;
  }

  /**
   *  Maps the input to function parameters.
   *
   * We `keepAlive` because the parameter properties could be modified by
   * UI that can come and go, but we want those modifications to persist.
   */
  @computed({ keepAlive: true })
  get parameters() {
    const parameters = this.inputs.map(input => {
      const parameter = this.convertInputToParameter(input);
      if (isDefined(parameter)) {
        return parameter;
      }
      throw new TerriaError({
        sender: this,
        title: "Unsupported parameter type",
        message: `The parameter ${
          input.Identifier
        } is not a supported type of parameter.`
      });
    });
    return parameters;
  }

  /**
   * Performs the Execute request for the WPS process
   *
   */
  async invoke() {
    if (!isDefined(this.identifier) || !isDefined(this.executeUrl)) {
      return;
    }

    const pendingItem = this.createPendingCatalogItem();
    let dataInputs = await Promise.all(
      this.parameters.map(p => this.convertParameterToInput(p))
    );
    const parameters = {
      Identifier: htmlEscapeText(this.identifier),
      DataInputs: dataInputs.filter(isDefined),
      storeExecuteResponse: this.storeSupported,
      status: this.statusSupported
    };
    let promise: Promise<any>;
    if (this.executeWithHttpGet) {
      promise = this.getXml(this.executeUrl, {
        ...parameters,
        DataInputs: parameters.DataInputs.map(
          ({ inputIdentifier: id, inputValue: val }) => `${id}=${val}`
        ).join(";")
      });
    } else {
      const executeXml = Mustache.render(executeWpsTemplate, parameters);
      promise = this.postXml(this.executeUrl, executeXml);
    }

    pendingItem.loadPromise = promise;
    this.terria.workbench.add(pendingItem);
    const executeResponseXml = await promise;
    await this.handleExecuteResponse(executeResponseXml, pendingItem);
  }

  /**
   * Handle the Execute response
   *
   * If execution succeeded, we create a WebProcessingServiceCatalogItem to show the result.
   * If execution failed, mark the pendingItem item as error.
   * Otherwise, if statusLocation is set, poll until we get a result or the pendingItem is removed from the workbench.
   */
  async handleExecuteResponse(
    xml: any,
    pendingItem: ResultPendingCatalogItem
  ): Promise<unknown> {
    if (
      !xml ||
      !xml.documentElement ||
      xml.documentElement.localName !== "ExecuteResponse"
    ) {
      throwInvalidWpsServerError(this, "ExecuteResponse");
    }
    const json = xml2json(xml);
    const status = json.Status;
    if (!isDefined(status)) {
      throw new TerriaError({
        sender: this,
        title: "Invalid response from WPS server",
        message:
          "The response from the WPS server does not include a Status element."
      });
    }

    if (isDefined(status.ProcessFailed)) {
      this.setErrorOnPendingItem(pendingItem, status.ProcessFailed);
    } else if (isDefined(status.ProcessSucceeded)) {
      const item = await this.createCatalogItem(pendingItem, json);
      await item.loadMapItems();
      this.terria.workbench.add(item);
      this.terria.workbench.remove(pendingItem);
    } else if (
      isDefined(json.statusLocation) &&
      this.terria.workbench.contains(pendingItem)
    ) {
      return runLater(async () => {
        const promise = this.getXml(json.statusLocation);
        pendingItem.loadPromise = promise;
        const xml = await promise;
        return this.handleExecuteResponse(xml, pendingItem);
      }, 500);
    }
  }

  convertInputToParameter(input: Input) {
    if (!isDefined(input.Identifier)) {
      return;
    }

    const isRequired = isDefined(input.minOccurs) && input.minOccurs > 0;

    for (let i = 0; i < this.parameterConverters.length; i++) {
      const converter = this.parameterConverters[i];
      const parameter = converter.inputToParameter(input, {
        id: input.Identifier,
        name: input.Name,
        description: input.Abstract,
        isRequired,
        converter
      });
      if (isDefined(parameter)) {
        return parameter;
      }
    }
  }

  async convertParameterToInput(parameter: FunctionParameter) {
    let converter = <ParameterConverter>parameter.converter;
    const result = converter.parameterToInput(parameter);
    if (!isDefined(result)) {
      return;
    }

    const inputValue = await Promise.resolve(result.inputValue);
    if (!isDefined(inputValue)) {
      return;
    }

    return {
      inputIdentifier: parameter.id,
      inputValue: inputValue,
      inputType: result.inputType
    };
  }

  async createCatalogItem(
    pendingItem: ResultPendingCatalogItem,
    wpsResponse: any
  ) {
    const id = `result-${pendingItem.uniqueId}`;
    const item = new WebProcessingServiceCatalogItem(id, this.terria);
    const parameterTraits = await Promise.all(
      this.parameters.map(async p => {
        const geoJsonFeature = await p.geoJsonFeature;
        const tmp = createStratumInstance(ParameterTraits, {
          name: p.name,
          value: p.formatValueAsString(),
          geoJsonFeature: <any>geoJsonFeature
        });
        return tmp;
      })
    );
    runInAction(() => {
      item.setTrait(CommonStrata.user, "name", pendingItem.name);
      item.setTrait(CommonStrata.user, "description", pendingItem.description);
      item.setTrait(CommonStrata.user, "wpsResponse", wpsResponse);
      item.setTrait(CommonStrata.user, "parameters", parameterTraits);
    });
    return item;
  }

  createPendingCatalogItem() {
    const now = new Date();
    const timestamp = sprintf(
      "%04d-%02d-%02dT%02d:%02d:%02d",
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );

    const id = `${this.name} ${timestamp}`;
    const item = new ResultPendingCatalogItem(id, this.terria);

    const inputsSection =
      '<table class="cesium-infoBox-defaultTable">' +
      this.parameters.reduce((previousValue, parameter) => {
        return (
          previousValue +
          "<tr>" +
          '<td style="vertical-align: middle">' +
          parameter.name +
          "</td>" +
          "<td>" +
          parameter.formatValueAsString(parameter.value) +
          "</td>" +
          "</tr>"
        );
      }, "") +
      "</table>";

    runInAction(() => {
      item.setTrait(CommonStrata.user, "name", id);
      item.setTrait(
        CommonStrata.user,
        "description",
        `This is the result of invoking the ${
          this.name
        } process or service at ${timestamp} with the input parameters below.`
      );

      const info = createStratumInstance(InfoSectionTraits, {
        name: "Inputs",
        content: inputsSection
      });
      item.setTrait(CommonStrata.user, "info", [info]);
    });

    return item;
  }

  setErrorOnPendingItem(pendingItem: ResultPendingCatalogItem, failure: any) {
    let errorMessage = "The reason for failure is unknown.";
    if (
      isDefined(failure.ExceptionReport) &&
      isDefined(failure.ExceptionReport.Exception)
    ) {
      const e = failure.ExceptionReport.Exception;
      errorMessage = e.ExceptionText || e.Exception || errorMessage;
    }

    runInAction(() => {
      pendingItem.setTrait(
        CommonStrata.user,
        "shortReport",
        "Web Processing Service invocation failed.  More details are available on the Info panel."
      );

      const errorInfo = createStratumInstance(InfoSectionTraits, {
        name: "Error Details",
        content: errorMessage
      });
      const info = pendingItem.getTrait(CommonStrata.user, "info");
      if (isDefined(info)) {
        info.push(errorInfo);
      }
    });
  }
}

const LiteralDataConverter = {
  inputToParameter: function(input: Input, options: FunctionParameterOptions) {
    if (!isDefined(input.LiteralData)) {
      return;
    }

    const allowedValues =
      input.LiteralData.AllowedValues || input.LiteralData.AllowedValue;
    if (isDefined(allowedValues) && isDefined(allowedValues.Value)) {
      return new EnumerationParameter({
        ...options,
        possibleValues: Array.isArray(allowedValues.Value)
          ? allowedValues.Value
          : [allowedValues.Value]
      });
    } else if (isDefined(input.LiteralData.AnyValue)) {
      return new StringParameter({
        ...options
      });
    }
  },
  parameterToInput: function(parameter: FunctionParameter) {
    return {
      inputValue: <string | undefined>parameter.value,
      inputType: "LiteralData"
    };
  }
};

const DateTimeConverter = {
  inputToParameter: function(input: Input, options: FunctionParameterOptions) {
    if (
      !isDefined(input.ComplexData) ||
      !isDefined(input.ComplexData.Default) ||
      !isDefined(input.ComplexData.Default.Format) ||
      !isDefined(input.ComplexData.Default.Format.Schema)
    ) {
      return undefined;
    }

    var schema = input.ComplexData.Default.Format.Schema;
    if (schema !== "http://www.w3.org/TR/xmlschema-2/#dateTime") {
      return undefined;
    }
    return new DateTimeParameter(options);
  },
  parameterToInput: function(parameter: FunctionParameter) {
    return {
      inputType: "ComplexData",
      inputValue: DateTimeParameter.formatValueForUrl(<string>parameter.value)
    };
  }
};

const PointConverter = simpleGeoJsonDataConverter("point", PointParameter);
const LineConverter = simpleGeoJsonDataConverter("linestring", LineParameter);
const PolygonConverter = simpleGeoJsonDataConverter(
  "polygon",
  PolygonParameter
);

const RectangleConverter = {
  inputToParameter: function(input: Input, options: FunctionParameterOptions) {
    if (
      !isDefined(input.BoundingBoxData) ||
      !isDefined(input.BoundingBoxData.Default) ||
      !isDefined(input.BoundingBoxData.Default.CRS)
    ) {
      return undefined;
    }
    var code = Reproject.crsStringToCode(input.BoundingBoxData.Default.CRS);
    var usedCrs = input.BoundingBoxData.Default.CRS;
    // Find out if Terria's CRS is supported.
    if (
      code !== Reproject.TERRIA_CRS &&
      isDefined(input.BoundingBoxData.Supported) &&
      isDefined(input.BoundingBoxData.Supported.CRS)
    ) {
      for (let i = 0; i < input.BoundingBoxData.Supported.CRS.length; i++) {
        if (
          Reproject.crsStringToCode(input.BoundingBoxData.Supported.CRS[i]) ===
          Reproject.TERRIA_CRS
        ) {
          code = Reproject.TERRIA_CRS;
          usedCrs = input.BoundingBoxData.Supported.CRS[i];
          break;
        }
      }
    }
    // We are currently only supporting Terria's CRS, because if we reproject we don't know the URI or whether
    // the bounding box order is lat-long or long-lat.
    if (!isDefined(code)) {
      return undefined;
    }

    return new RectangleParameter({
      ...options,
      crs: usedCrs
    });
  },
  parameterToInput: function(functionParameter: FunctionParameter) {
    const parameter = <RectangleParameter>functionParameter;
    const value = parameter.value;

    if (!isDefined(value)) {
      return;
    }

    let bboxMinCoord1, bboxMinCoord2, bboxMaxCoord1, bboxMaxCoord2, urn;
    // We only support CRS84 and EPSG:4326
    if (parameter.crs.indexOf("crs84") !== -1) {
      // CRS84 uses long, lat rather that lat, long order.
      bboxMinCoord1 = CesiumMath.toDegrees(value.west);
      bboxMinCoord2 = CesiumMath.toDegrees(value.south);
      bboxMaxCoord1 = CesiumMath.toDegrees(value.east);
      bboxMaxCoord2 = CesiumMath.toDegrees(value.north);
      // Comfortingly known as WGS 84 longitude-latitude according to Table 3 in OGC 07-092r1.
      urn = "urn:ogc:def:crs:OGC:1.3:CRS84";
    } else {
      // The URN value urn:ogc:def:crs:EPSG:6.6:4326 shall mean the Coordinate Reference System (CRS) with code
      // 4326 specified in version 6.6 of the EPSG database available at http://www.epsg.org/. That CRS specifies
      // the axis order as Latitude followed by Longitude.
      // We don't know about other URN versions, so are going to return 6.6 regardless of what was requested.
      bboxMinCoord1 = CesiumMath.toDegrees(value.south);
      bboxMinCoord2 = CesiumMath.toDegrees(value.west);
      bboxMaxCoord1 = CesiumMath.toDegrees(value.north);
      bboxMaxCoord2 = CesiumMath.toDegrees(value.east);
      urn = "urn:ogc:def:crs:EPSG:6.6:4326";
    }

    return {
      inputType: "BoundingBoxData",
      inputValue:
        bboxMinCoord1 +
        "," +
        bboxMinCoord2 +
        "," +
        bboxMaxCoord1 +
        "," +
        bboxMaxCoord2 +
        "," +
        urn
    };
  }
};

const GeoJsonGeometryConverter = {
  inputToParameter: function(input: Input, options: FunctionParameterOptions) {
    if (
      !isDefined(input.ComplexData) ||
      !isDefined(input.ComplexData.Default) ||
      !isDefined(input.ComplexData.Default.Format) ||
      !isDefined(input.ComplexData.Default.Format.Schema)
    ) {
      return;
    }

    const schema = input.ComplexData.Default.Format.Schema;
    if (schema.indexOf("http://geojson.org/geojson-spec.html#") !== 0) {
      return undefined;
    }

    const regionTypeParameter = new RegionTypeParameter({
      id: "regionType",
      name: "Region Type",
      description: "The type of region to analyze.",
      converter: undefined
    });

    const regionParameter = new RegionParameter({
      id: "regionParameter",
      name: "Region Parameter",
      regionProvider: regionTypeParameter,
      converter: undefined
    });

    return new GeoJsonParameter({
      ...options,
      regionParameter
    });
  },

  parameterToInput: function(parameter: FunctionParameter) {
    if (!isDefined(parameter.value)) {
      return;
    }
    return (<GeoJsonParameter>parameter).getProcessedValue(parameter.value);
  }
};

function simpleGeoJsonDataConverter(schemaType: string, klass: any) {
  return {
    inputToParameter: function(
      input: Input,
      options: FunctionParameterOptions
    ) {
      if (
        !isDefined(input.ComplexData) ||
        !isDefined(input.ComplexData.Default) ||
        !isDefined(input.ComplexData.Default.Format) ||
        !isDefined(input.ComplexData.Default.Format.Schema)
      ) {
        return undefined;
      }

      var schema = input.ComplexData.Default.Format.Schema;
      if (schema.indexOf("http://geojson.org/geojson-spec.html#") !== 0) {
        return undefined;
      }

      if (schema.substring(schema.lastIndexOf("#") + 1) !== schemaType) {
        return undefined;
      }

      return new klass(options);
    },
    parameterToInput: function(parameter: FunctionParameter) {
      return {
        inputType: "ComplexData",
        inputValue: klass.formatValueForUrl(parameter.value)
      };
    }
  };
}

function throwInvalidWpsServerError(
  wps: WebProcessingServiceCatalogFunction,
  endpoint: string
) {
  throw new TerriaError({
    title: "Invalid WPS Server",
    message: `An error occurred while invoking ${endpoint} on the WPS server for process name ${
      wps.name
    }. The server's response does not appear to be a valid ${endpoint} document. <p>This error may also indicate that the processing server you specified is temporarily unavailable or there is a problem with your internet connection.  Try opening the processing server again, and if the problem persists, please report it by sending an email to <a href=\"mailto:${
      wps.terria.supportEmail
    }">${wps.terria.supportEmail}</a>.</p>`
  });
}

function htmlEscapeText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
