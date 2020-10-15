import i18next from "i18next";
import {
  action,
  computed,
  isObservableArray,
  observable,
  runInAction,
  toJS
} from "mobx";
import isDefined from "../Core/isDefined";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { ShortReportTraits } from "../Traits/CatalogMemberTraits";
import WebProcessingServiceCatalogFunctionJobTraits from "../Traits/WebProcessingServiceCatalogFunctionJobTraits";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import LoadableStratum from "./LoadableStratum";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogFunctionJobMixin from "../ModelMixins/CatalogFunctionJobMixin";
import { ChartItem } from "./Chartable";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import URI from "urijs";

const executeWpsTemplate = require("./ExecuteWpsTemplate.xml");

import Mustache from "mustache";

import XmlRequestMixin from "../ModelMixins/XmlRequestMixin";
import TerriaError from "../Core/TerriaError";
import xml2json from "../ThirdParty/xml2json";
import AsyncChartableMixin from "../ModelMixins/AsyncChartableMixin";
import updateModelFromJson from "./updateModelFromJson";

const createGuid = require("terriajs-cesium/Source/Core/createGuid").default;

class WpsLoadableStratum extends LoadableStratum(
  WebProcessingServiceCatalogFunctionJobTraits
) {
  static stratumName = "wpsLoadable";

  constructor(readonly item: WebProcessingServiceCatalogFunctionJob) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new WpsLoadableStratum(
      newModel as WebProcessingServiceCatalogFunctionJob
    ) as this;
  }

  @action
  static async load(item: WebProcessingServiceCatalogFunctionJob) {
    if (!isDefined(item.wpsResponse) && isDefined(item.wpsResponseUrl)) {
      const url = proxyCatalogItemUrl(item, item.wpsResponseUrl, "1d");
      const wpsResponse = await item.getXml(url);
      runInAction(() => {
        item.setTrait(CommonStrata.user, "wpsResponse", wpsResponse);
      });
    }
    return new WpsLoadableStratum(item);
  }

  @computed get shortReportSections() {
    const reports = this.item.outputs
      .map(output => {
        let report;
        if (isDefined(output.Data.LiteralData)) {
          report = createStratumInstance(ShortReportTraits, {
            name: output.Title,
            content: formatOutputValue(output.Title, output.Data.LiteralData)
          });
        }

        return report;
      })
      .filter(isDefined);
    return reports;
  }

  @computed get outputsSectionHtml() {
    const outputsSection =
      '<table class="cesium-infoBox-defaultTable">' +
      this.item.outputs.reduce((previousValue, output) => {
        if (
          !isDefined(output.Data) ||
          (!isDefined(output.Data.LiteralData) &&
            !isDefined(output.Data.ComplexData))
        ) {
          return previousValue;
        }
        let content = "";
        if (isDefined(output.Data.LiteralData)) {
          content = formatOutputValue(output.Title, output.Data.LiteralData);
        } else if (isDefined(output.Data.ComplexData)) {
          if (output.Data.ComplexData.mimeType === "text/csv") {
            content =
              '<chart can-download="true" hide-buttons="false" title="' +
              output.Title +
              "\" data='" +
              output.Data.ComplexData +
              '\' styling: "feature-info">';
          } else if (
            output.Data.ComplexData.mimeType ===
            "application/vnd.terriajs.catalog-member+json"
          ) {
            content = "Chart " + output.Title + " generated.";
          }
          // Support other types of ComplexData here as it becomes necessary.
        }

        return (
          previousValue +
          "<tr>" +
          '<td style="vertical-align: middle">' +
          output.Title +
          "</td>" +
          "<td>" +
          content +
          "</td>" +
          "</tr>"
        );
      }, "") +
      "</table>";
    return outputsSection;
  }
}

StratumOrder.addLoadStratum(WpsLoadableStratum.stratumName);

export default class WebProcessingServiceCatalogFunctionJob
  extends XmlRequestMixin(
    AsyncMappableMixin(
      CatalogFunctionJobMixin(
        CreateModel(WebProcessingServiceCatalogFunctionJobTraits)
      )
    )
  )
  implements Mappable {
  static readonly type = "wps-result";
  get typeName() {
    return i18next.t("models.webProcessingService.wpsResult");
  }
  readonly proxyCacheDuration = "1d";

  @observable
  private geoJsonItem?: GeoJsonCatalogItem;

  /**
   * Returns the proxied URL for the Execute endpoint.
   */
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

  async invoke() {
    if (
      !isDefined(this.identifier) ||
      !isDefined(this.executeUrl) ||
      !isDefined(this.wpsParameters)
    ) {
      throw `Identifier, executeUrl and wpsParameters must be set`;
    }

    const identifier = this.identifier;
    const executeUrl = this.executeUrl;

    const parameters = {
      Identifier: htmlEscapeText(identifier),
      DataInputs: toJS(this.wpsParameters),
      storeExecuteResponse: toJS(this.storeSupported),
      status: toJS(this.statusSupported)
    };

    let promise: Promise<any>;
    if (this.executeWithHttpGet) {
      promise = this.getXml(executeUrl, {
        ...parameters,
        DataInputs: parameters.DataInputs.map(
          ({ inputIdentifier: id, inputValue: val }) => `${id}=${val}`
        ).join(";")
      });
    } else {
      const executeXml = Mustache.render(executeWpsTemplate, parameters);
      promise = this.postXml(executeUrl, executeXml);
    }

    const executeResponseXml = await promise;
    if (
      !executeResponseXml ||
      !executeResponseXml.documentElement ||
      executeResponseXml.documentElement.localName !== "ExecuteResponse"
    ) {
      throw `Invalid XML response for WPS ExecuteResponse`;
    }

    const json = xml2json(executeResponseXml);

    // Check if finished
    if (this.checkStatus(json)) {
      return true;
    }

    runInAction(() =>
      this.setTrait(CommonStrata.user, "wpsResponseUrl", json.statusLocation)
    );

    return false;
  }

  /**
   * Return true for finished, false for running, throw error otherwise
   */
  @action
  checkStatus(json: any) {
    const status = json.Status;
    if (!isDefined(status)) {
      throw new TerriaError({
        sender: this,
        title: i18next.t(
          "models.webProcessingService.invalidResponseErrorTitle"
        ),
        message: i18next.t(
          "models.webProcessingService.invalidResponseErrorMessage",
          {
            name: this.name,
            email:
              '<a href="mailto:' +
              this.terria.supportEmail +
              '">' +
              this.terria.supportEmail +
              "</a>."
          }
        )
      });
    }

    if (isDefined(status.ProcessFailed)) {
      throw status.ProcessFailed.ExceptionReport?.Exception?.ExceptionText ||
        JSON.stringify(status.ProcessFailed);
    } else if (isDefined(status.ProcessSucceeded)) {
      this.setTrait(CommonStrata.user, "wpsResponse", json);
      return true;
    }

    return false;
  }

  async pollForResults() {
    if (!isDefined(this.wpsResponseUrl)) {
      return true;
    }
    const promise = this.getXml(this.wpsResponseUrl);
    const xml = await promise;

    const json = xml2json(xml);

    return this.checkStatus(json);
  }

  async downloadResults() {
    const stratum = await WpsLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(WpsLoadableStratum.stratumName, stratum);
    });

    const reports: StratumFromTraits<ShortReportTraits>[] = [];
    const outputs = runInAction(() => this.outputs);

    const results: CatalogMemberMixin.CatalogMemberMixin[] = [];

    const promises = outputs.map(async (output, i) => {
      if (!output.Data.ComplexData) {
        return;
      }

      let reportContent = output.Data.ComplexData;
      if (output.Data.ComplexData.mimeType === "text/csv") {
        reportContent =
          '<collapsible title="' +
          output.Title +
          '" open="' +
          (i === 0 ? "true" : "false") +
          '">';
        reportContent +=
          '<chart can-download="true" hide-buttons="false" title="' +
          output.Title +
          "\" data='" +
          output.Data.ComplexData.text +
          '\' styling="histogram"></chart>';
        reportContent += "</collapsible>";
      } else if (
        output.Data.ComplexData.mimeType ===
        "application/vnd.terriajs.catalog-member+json"
      ) {
        // Create a catalog member from the embedded json
        const json = JSON.parse(output.Data.ComplexData.text);
        const catalogItem = this.createCatalogItemFromJson(json);
        if (isDefined(catalogItem)) {
          if (CatalogMemberMixin.isMixedInto(catalogItem)) {
            results.push(catalogItem);
            await catalogItem.loadMetadata();
          }
          if (AsyncMappableMixin.isMixedInto(catalogItem)) {
            await catalogItem.loadMapItems();
          }
          if (AsyncChartableMixin.isMixedInto(catalogItem)) {
            await catalogItem.loadChartItems();
          }
          reportContent = "Chart " + output.Title + " generated.";
        }
      }

      reports.push(
        createStratumInstance(ShortReportTraits, {
          name: output.Title,
          content: reportContent
        })
      );
    });

    await Promise.all(promises);

    // Create geojson catalog item for input features
    if (isDefined(this.geojsonFeatures)) {
      runInAction(() => {
        this.geoJsonItem = new GeoJsonCatalogItem(createGuid(), this.terria);
        updateModelFromJson(this.geoJsonItem, CommonStrata.user, {
          name: `${this.name} Input Features`,
          geoJsonData: {
            type: "FeatureCollection",
            features: this.geojsonFeatures!,
            totalFeatures: this.geojsonFeatures!.length
          }
        });
      });
      await this.geoJsonItem!.loadMetadata();
      await this.geoJsonItem!.loadMapItems();
    }

    runInAction(() => {
      this.setTrait(CommonStrata.user, "shortReportSections", reports);
    });

    return results;
  }

  get chartItems(): ChartItem[] {
    return [];
  }

  protected async forceLoadMapItems(): Promise<void> {}

  async loadMapItems() {
    await this.loadMetadata();
    if (isDefined(this.geoJsonItem)) {
      const geoJsonItem = this.geoJsonItem;
      await runInAction(() => geoJsonItem.loadMapItems());
    }
  }

  /**
   * Returns all the process outputs skipping process contexts and empty outputs
   */
  @computed get outputs() {
    const wpsResponse = <any>this.wpsResponse;
    if (
      !wpsResponse ||
      !wpsResponse.ProcessOutputs ||
      !wpsResponse.ProcessOutputs.Output
    ) {
      return [];
    }
    const obj = wpsResponse.ProcessOutputs.Output;
    const outputs = Array.isArray(obj) || isObservableArray(obj) ? obj : [obj];
    return outputs.filter(
      o => o.Identifier !== ".context" && isDefined(o.Data)
    );
  }

  @computed get mapItems() {
    if (isDefined(this.geoJsonItem)) {
      return this.geoJsonItem.mapItems.map(mapItem => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }

  private createCatalogItemFromJson(json: any) {
    const itemJson = fixCatalogItemJson(json);
    const catalogItem = upsertModelFromJson(
      CatalogMemberFactory,
      this.terria,
      this.uniqueId || "",
      undefined,
      CommonStrata.user,
      {
        ...itemJson,
        id: createGuid()
      }
    );
    return catalogItem;
  }
}

function formatOutputValue(title: string, value: string | undefined) {
  if (!isDefined(value)) {
    return "";
  }

  const values = value.split(",");

  return values.reduce(function(previousValue, currentValue) {
    if (value.match(/[.\/](png|jpg|jpeg|gif|svg)/i)) {
      return (
        previousValue +
        '<a href="' +
        currentValue +
        '"><img src="' +
        currentValue +
        '" alt="' +
        title +
        '" /></a>'
      );
    } else if (
      currentValue.indexOf("http:") === 0 ||
      currentValue.indexOf("https:") === 0
    ) {
      const uri = new URI(currentValue);
      return (
        previousValue +
        '<a href="' +
        currentValue +
        '">' +
        uri.filename() +
        "</a>"
      );
    } else {
      return previousValue + currentValue;
    }
  }, "");
}

/**
 * Transform old catalog definitions to match new schema.
 */
function fixCatalogItemJson(json: any) {
  const { isEnabled, ...fixedJson } = json;
  if (json.type === "csv") {
    const { data, tableStyle, ...fixedCsvJson } = fixedJson;
    fixedCsvJson.csvString = fixedCsvJson.csvString || data;
    return fixedCsvJson;
  }
  return fixedJson;
}

function htmlEscapeText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
