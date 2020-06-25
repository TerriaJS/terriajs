import {
  computed,
  isObservableArray,
  observable,
  runInAction,
  toJS
} from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import URI from "urijs";
import isDefined from "../Core/isDefined";
import TerriaError from "../Core/TerriaError";
import Reproject from "../Map/Reproject";
import xml2json from "../ThirdParty/xml2json";
import WebProcessingServiceCatalogFunctionTraits from "../Traits/WebProcessingServiceCatalogFunctionTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import DateTimeParameter from "./FunctionParameters/DateTimeParameter";
import EnumerationParameter from "./FunctionParameters/EnumerationParameter";
import FunctionParameter, {
  Options as FunctionParameterOptions
} from "./FunctionParameters/FunctionParameter";
import GeoJsonParameter from "./FunctionParameters/GeoJsonParameter";
import LineParameter from "./FunctionParameters/LineParameter";
import PointParameter from "./FunctionParameters/PointParameter";
import PolygonParameter from "./FunctionParameters/PolygonParameter";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import RectangleParameter from "./FunctionParameters/RectangleParameter";
import RegionParameter from "./FunctionParameters/RegionParameter";
import RegionTypeParameter from "./FunctionParameters/RegionTypeParameter";
import StringParameter from "./FunctionParameters/StringParameter";
import WebProcessingServiceCatalogFunctionJob from "./WebProcessingServiceCatalogFunctionJob";
import i18next from "i18next";
import CatalogFunctionMixin from "../ModelMixins/CatalogFunctionMixin";
import CatalogFunctionJobMixin from "../ModelMixins/CatalogFunctionJobMixin";
import updateModelFromJson from "./updateModelFromJson";
import XmlRequestMixin from "../ModelMixins/XmlRequestMixin";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

type AllowedValues = {
  Value?: string | string[];
};

type LiteralData = {
  AllowedValues?: AllowedValues;
  AllowedValue?: AllowedValues;
  AnyValue?: unknown;
};

type ComplexData = {
  Default?: { Format?: { Schema?: string } };
};

type BoundingBoxData = {
  Default?: { CRS?: string };
  Supported?: { CRS?: string[] };
};

type Input = {
  Identifier?: string;
  Name?: string;
  Abstract?: string;
  LiteralData?: LiteralData;
  ComplexData?: ComplexData;
  BoundingBoxData?: BoundingBoxData;
  minOccurs?: number;
};

type ProcessDescription = {
  DataInputs?: { Input: Input[] | Input };
  storeSupported?: string;
  statusSupported?: string;
};

export type WpsInputData = {
  inputValue: Promise<string | undefined> | string | undefined;
  inputType: string;
};

type ParameterConverter = {
  inputToParameter: (
    catalogFunction: CatalogFunctionMixin,
    input: Input,
    options: FunctionParameterOptions
  ) => FunctionParameter | undefined;

  parameterToInput: (parameter: FunctionParameter) => WpsInputData | undefined;
};

export default class WebProcessingServiceCatalogFunction extends XmlRequestMixin(
  CatalogFunctionMixin(CreateModel(WebProcessingServiceCatalogFunctionTraits))
) {
  readonly jobType = WebProcessingServiceCatalogFunctionJob.type;

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

  @observable
  private processDescription?: ProcessDescription;

  @observable
  private _functionParameters: FunctionParameter[] = [];

  /**
   * Returns the proxied URL for the DescribeProcess endpoint.
   */
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
        title: i18next.t(
          "models.webProcessingService.processDescriptionErrorTitle"
        ),
        message: i18next.t(
          "models.webProcessingService.processDescriptionErrorMessage"
        )
      });
    }

    runInAction(() => {
      this.processDescription = json.ProcessDescription;

      this._functionParameters = this.inputs.map(input => {
        const parameter = this.convertInputToParameter(this, input);
        if (isDefined(parameter)) {
          return parameter;
        }
        throw new TerriaError({
          sender: this,
          title: "Unsupported parameter type",
          message: `The parameter ${input.Identifier} is not a supported type of parameter.`
        });
      });
    });
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
        title: i18next.t("models.webProcessingService.processInputErrorTitle"),
        message: i18next.t(
          "models.webProcessingService.processInputErrorMessage"
        )
      });
    }

    const inputs =
      Array.isArray(dataInputs.Input) || isObservableArray(dataInputs.Input)
        ? dataInputs.Input
        : [dataInputs.Input];
    return inputs;
  }

  /**
   *  Maps the input to function parameters.
   */
  @computed
  get functionParameters() {
    return this._functionParameters;
  }

  onSubmit = async (job: CatalogFunctionJobMixin) => {
    const wpsJob = job as WebProcessingServiceCatalogFunctionJob;

    let dataInputs = await Promise.all(
      this.functionParameters
        .filter(p => isDefined(p.value) && p.value !== null)
        .map(p => this.convertParameterToInput(p))
    );

    updateModelFromJson(wpsJob, CommonStrata.user, {
      geojsonFeatures: this.functionParameters
        .map(param => param.geoJsonFeature)
        .filter(isDefined),
      url: this.url,
      identifier: this.identifier,
      executeWithHttpGet: this.executeWithHttpGet,
      statusSupported: isDefined(this.statusSupported)
        ? this.statusSupported
        : isDefined(this.processDescription) &&
          this.processDescription.statusSupported === "true",
      storeSupported: isDefined(this.storeSupported)
        ? this.storeSupporte
        : isDefined(this.processDescription) &&
          this.processDescription.storeSupported === "true",
      wpsParameters: dataInputs
    });
  };

  // setErrorOnPendingItem(pendingItem: ResultPendingCatalogItem, failure: any) {
  //   let errorMessage = "The reason for failure is unknown.";
  //   if (
  //     isDefined(failure.ExceptionReport) &&
  //     isDefined(failure.ExceptionReport.Exception)
  //   ) {
  //     const e = failure.ExceptionReport.Exception;
  //     errorMessage = e.ExceptionText || e.Exception || errorMessage;
  //   }

  //   runInAction(() => {
  //     pendingItem.setTrait(
  //       CommonStrata.user,
  //       "shortReport",
  //       "Web Processing Service invocation failed.  More details are available on the Info panel."
  //     );

  //     const errorInfo = createStratumInstance(InfoSectionTraits, {
  //       name: "Error Details",
  //       content: errorMessage
  //     });
  //     const info = pendingItem.getTrait(CommonStrata.user, "info");
  //     if (isDefined(info)) {
  //       info.push(errorInfo);
  //     }
  //   });
  // }

  convertInputToParameter(catalogFunction: CatalogFunctionMixin, input: Input) {
    if (!isDefined(input.Identifier)) {
      return;
    }

    const isRequired = isDefined(input.minOccurs) && input.minOccurs > 0;

    for (let i = 0; i < this.parameterConverters.length; i++) {
      const converter = this.parameterConverters[i];
      const parameter = converter.inputToParameter(catalogFunction, input, {
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
}

const LiteralDataConverter = {
  inputToParameter: function(
    catalogFunction: CatalogFunctionMixin,
    input: Input,
    options: FunctionParameterOptions
  ) {
    if (!isDefined(input.LiteralData)) {
      return;
    }

    const allowedValues =
      input.LiteralData.AllowedValues || input.LiteralData.AllowedValue;
    if (isDefined(allowedValues) && isDefined(allowedValues.Value)) {
      return new EnumerationParameter(catalogFunction, {
        ...options,
        possibleValues:
          Array.isArray(allowedValues.Value) ||
          isObservableArray(allowedValues.Value)
            ? allowedValues.Value
            : [allowedValues.Value]
      });
    } else if (isDefined(input.LiteralData.AnyValue)) {
      return new StringParameter(catalogFunction, {
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
  inputToParameter: function(
    catalogFunction: CatalogFunctionMixin,
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
    if (schema !== "http://www.w3.org/TR/xmlschema-2/#dateTime") {
      return undefined;
    }
    return new DateTimeParameter(catalogFunction, options);
  },
  parameterToInput: function(parameter: FunctionParameter) {
    return {
      inputType: "ComplexData",
      inputValue: DateTimeParameter.formatValueForUrl(
        parameter?.value?.toString() || ""
      )
    };
  }
};

export const PointConverter = simpleGeoJsonDataConverter(
  "point",
  PointParameter
);
const LineConverter = simpleGeoJsonDataConverter("linestring", LineParameter);
const PolygonConverter = simpleGeoJsonDataConverter(
  "polygon",
  PolygonParameter
);

const RectangleConverter = {
  inputToParameter: function(
    catalogFunction: CatalogFunctionMixin,
    input: Input,
    options: FunctionParameterOptions
  ) {
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

    return new RectangleParameter(catalogFunction, {
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
  inputToParameter: function(
    catalogFunction: CatalogFunctionMixin,
    input: Input,
    options: FunctionParameterOptions
  ) {
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

    const regionTypeParameter = new RegionTypeParameter(catalogFunction, {
      id: "regionType",
      name: "Region Type",
      description: "The type of region to analyze.",
      converter: undefined
    });

    const regionParameter = new RegionParameter(catalogFunction, {
      id: "regionParameter",
      name: "Region Parameter",
      regionProvider: regionTypeParameter,
      converter: undefined
    });

    return new GeoJsonParameter(catalogFunction, {
      ...options,
      regionParameter
    });
  },

  parameterToInput: function(
    parameter: FunctionParameter
  ): WpsInputData | undefined {
    if (!isDefined(parameter.value) || parameter.value === null) {
      return;
    }
    return (<GeoJsonParameter>parameter).getProcessedValue(
      (<GeoJsonParameter>parameter).value!
    );
  }
};

function simpleGeoJsonDataConverter(schemaType: string, klass: any) {
  return {
    inputToParameter: function(
      catalogFunction: CatalogFunctionMixin,
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

      return new klass(catalogFunction, options);
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
    title: i18next.t("models.webProcessingService.invalidWPSServerTitle"),
    message: i18next.t("models.webProcessingService.invalidWPSServerMessage", {
      name: wps.name,
      email:
        '<a href="mailto:' +
        wps.terria.supportEmail +
        '">' +
        wps.terria.supportEmail +
        "</a>.",
      endpoint
    })
  });
}
