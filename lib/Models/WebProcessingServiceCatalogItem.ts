import { computed, isObservableArray, observable, runInAction } from "mobx";
import isDefined from "../Core/isDefined";
import loadXML from "../Core/loadXML";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import {
  InfoSectionTraits,
  ShortReportTraits
} from "../Traits/CatalogMemberTraits";
import { FeatureInfoTemplateTraits } from "../Traits/FeatureInfoTraits";
import WebProcessingServiceCatalogItemTraits from "../Traits/WebProcessingServiceCatalogItemTraits";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import LoadableStratum from "./LoadableStratum";
import Mappable from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";
import upsertModelFromJson from "./upsertModelFromJson";

const createGuid = require("terriajs-cesium/Source/Core/createGuid");

class WpsLoadableStratum extends LoadableStratum(
  WebProcessingServiceCatalogItemTraits
) {
  static stratumName = "wpsLoadable";

  constructor(readonly item: WebProcessingServiceCatalogItem) {
    super();
  }

  static async load(item: WebProcessingServiceCatalogItem) {
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

  @computed get info() {
    return [
      createStratumInstance(InfoSectionTraits, {
        name: "Inputs",
        content: this.inputsSectionHtml
      })
    ];
  }

  @computed get featureInfoTemplate() {
    const template = [
      "#### Inputs\n\n" + this.inputsSectionHtml,
      "#### Outputs\n\n" + this.outputsSectionHtml
    ].join("\n\n");
    return createStratumInstance(FeatureInfoTemplateTraits, {
      template
    });
  }

  @computed get geoJsonItem() {
    const features = this.item.parameters
      .map(param => param.geoJsonFeature)
      .filter(isDefined);
    const geoJsonItem = <GeoJsonCatalogItem>(
      upsertModelFromJson(
        CatalogMemberFactory,
        this.item.terria,
        this.item.uniqueId || "",
        undefined,
        CommonStrata.user,
        {
          id: createGuid(),
          type: "geojson",
          name: this.name,
          geoJsonData: {
            type: "FeatureCollection",
            features,
            totalFeatures: features.length
          }
        }
      )
    );
    return geoJsonItem;
  }

  @computed get rectangle() {
    return this.geoJsonItem.rectangle;
  }

  @computed get inputsSectionHtml() {
    const inputsSection =
      '<table class="cesium-infoBox-defaultTable">' +
      this.item.parameters.reduce((previousValue, parameter) => {
        return (
          previousValue +
          "<tr>" +
          '<td style="vertical-align: middle">' +
          parameter.name +
          "</td>" +
          '<td style="padding-left: 4px">' +
          parameter.value +
          "</td>" +
          "</tr>"
        );
      }, "") +
      "</table>";
    return inputsSection;
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

export default class WebProcessingServiceCatalogItem
  extends CatalogMemberMixin(CreateModel(WebProcessingServiceCatalogItemTraits))
  implements Mappable {
  static readonly type = "wps-result";
  readonly typeName = "Web Processing Service Result";

  readonly showsInfo = true;
  readonly isMappable = true;

  @observable
  private geoJsonItem?: GeoJsonCatalogItem;

  async forceLoadMetadata() {
    const stratum = await WpsLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(WpsLoadableStratum.stratumName, stratum);
    });

    const reports: StratumFromTraits<ShortReportTraits>[] = [];
    const promises = this.outputs.map(async (output, i) => {
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
          await loadCatalogItem(catalogItem);
          this.terria.workbench.add(catalogItem);
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

    runInAction(() => {
      this.setTrait(CommonStrata.user, "shortReportSections", reports);
      this.geoJsonItem = stratum.geoJsonItem;
    });
  }

  async loadMapItems() {
    await this.loadMetadata();
    if (isDefined(this.geoJsonItem)) {
      await this.geoJsonItem.loadMapItems();
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
    if (json.isEnabled) {
      // Fix the catalog item json to match the new schema.
      // TODO: Remove this when mobx migration is complete
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

  getXml(url: string, parameters?: any) {
    if (isDefined(parameters)) {
      url = new URI(url).query(parameters).toString();
    }
    return loadXML(url);
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
 * Completely load a catalog item
 */
async function loadCatalogItem(item: any) {
  if (CatalogMemberMixin.isMixedInto(item)) {
    await item.loadMetadata();
  }
  if (Mappable.is(item)) {
    await item.loadMapItems();
  }
  return item;
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
