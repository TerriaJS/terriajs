import classNames from "classnames";
import { TFunction } from "i18next";
import { action, computed, observable, reaction } from "mobx";
import { observer } from "mobx-react";
import { IDisposer } from "mobx-utils";
import Mustache from "mustache";
import React from "react";
import { withTranslation } from "react-i18next";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import isDefined from "../../Core/isDefined";
import CatalogMemberMixin, {
  getName
} from "../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import TimeVarying from "../../ModelMixins/TimeVarying";
import Model from "../../Models/Definition/Model";
import Feature from "../../Models/Feature";
import ViewState from "../../ReactViewModels/ViewState";
import Icon from "../../Styled/Icon";
import { ChartDetails } from "../../Table/getChartDetailsFn";
import FeatureInfoTraits, {
  FeatureInfoTemplateTraits
} from "../../Traits/TraitsClasses/FeatureInfoTraits";
import CustomComponent from "../Custom/CustomComponent";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Styles from "./feature-info-section.scss";
import FeatureInfoDownload from "./FeatureInfoDownload";
import getFeatureProperties from "./getFeatureProperties";
import {
  mustacheFormatDateTime,
  mustacheFormatNumberFunction,
  MustacheFunction,
  mustacheRenderPartialByName,
  mustacheURLEncodeText,
  mustacheURLEncodeTextComponent
} from "./mustacheExpressions";

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
Mustache.escape = function(string) {
  return string;
};

interface FeatureInfoProps {
  viewState: ViewState;
  template: Model<FeatureInfoTemplateTraits>;
  feature: Feature;
  position: Cartesian3;
  catalogItem: CatalogMemberMixin.Instance & Model<FeatureInfoTraits>; // Note this may not be known (eg. WFS).
  isOpen: boolean;
  onClickHeader?: (feature: Feature) => void;
  printView: boolean;
  t: TFunction;
}

@observer
export class FeatureInfoSection extends React.Component<FeatureInfoProps> {
  private templateReactionDisposer: IDisposer | undefined;

  @observable private templatedFeatureInfo:
    | React.ReactNode
    | undefined = undefined;
  @observable private chart: React.ReactNode | undefined = undefined;

  @observable
  private showRawData: boolean = false;

  @computed get currentTimeIfAvailable() {
    return TimeVarying.is(this.props.catalogItem)
      ? this.props.catalogItem.currentTimeAsJulianDate
      : undefined;
  }

  componentDidMount() {
    /** We can't use `@computed` values for custom templates - as CustomComponents (eg CSVChartCustomComponent) cause side-effects */
    this.templateReactionDisposer = reaction(
      () => [
        this.props.feature,
        this.props.template.template,
        this.props.template.partials,
        this.mustacheContextData
      ],
      () => {
        if (this.props.template.template) {
          this.templatedFeatureInfo = parseCustomMarkdownToReact(
            Mustache.render(
              this.props.template.template,
              this.mustacheContextData,
              this.props.template.partials
            ),
            this.parseMarkdownContextData
          );
        } else {
          this.templatedFeatureInfo = undefined;
        }

        if (this.timeSeriesChartContext?.chart) {
          this.chart = parseCustomMarkdownToReact(
            this.timeSeriesChartContext.chart,
            this.parseMarkdownContextData
          );
        } else {
          this.chart = undefined;
        }
      },
      { fireImmediately: true }
    );
  }

  componentWillUnmount() {
    this.templateReactionDisposer?.();
  }

  /**
   * Get parameters that should be exposed to the template, to help show a timeseries chart of the feature data.
   * @private
   */
  @computed get timeSeriesChartContext() {
    if (!TableMixin.isMixedInto(this.props.catalogItem)) return;

    // TODO fix this mess
    const getChartDetails = this.featureProperties
      ._terria_getChartDetails as any;

    // Only show it as a line chart if the details are available, the data is sampled (so a line chart makes sense), and charts are available.
    if (
      isDefined(getChartDetails) &&
      isDefined(this.props.catalogItem) &&
      this.props.catalogItem.isSampled &&
      CustomComponent.isRegistered("chart")
    ) {
      const chartDetails = getChartDetails() as ChartDetails;
      const distinguishingId = this.props.catalogItem.dataViewId;
      const featureId = isDefined(distinguishingId)
        ? distinguishingId + "--" + this.props.feature.id
        : this.props.feature.id;
      if (chartDetails) {
        const { title, csvData } = chartDetails;
        const result = {
          ...chartDetails,
          id: featureId?.replace(/\"/g, ""),
          data: csvData?.replace(/\\n/g, "\\n")
        };
        const idAttr = 'id="' + result.id + '" ';
        const titleAttr = title ? `title="${title}"` : "";
        return {
          ...result,
          chart: `<chart ${idAttr} ${titleAttr}>${result.data}</chart>`
        };
      }
    }
  }

  /** Manipulate the properties before tempesting them.
   * If they require .getValue, apply that.
   * If they have bad keys, fix them.
   * If they have formatting, apply it.
   **/
  @computed get featureProperties() {
    return getFeatureProperties(
      this.props.feature,
      this.currentTimeIfAvailable,
      MappableMixin.isMixedInto(this.props.catalogItem) &&
        this.props.catalogItem.featureInfoTemplate
        ? this.props.catalogItem.featureInfoTemplate
        : undefined
    );
  }

  /** This monstrosity contains properties which can be used by Mustache templates:
   * - All feature properties
   * - `properties` = array of key:value from feature properties
   * - `terria` magical object
   *     - a bunch of custom mustache expressions
   *       - `partialByName`
   *       - `formatNumber`
   *       - `formatDateTime`
   *       - `urlEncodeComponent`
   *       - `urlEncode`
   *     - `coords` with `latitude` and `longitude`
   *     - `currentTime`
   *     - `timeSeries` magical object - see `this.timeSeriesChartContext`
   */
  @computed
  get mustacheContextData() {
    const propertyValues = Object.assign({}, this.featureProperties);

    // Aliases is a map from `key` (which exists in propertyData.properties) to some `aliasKey` which needs to resolve to `key`
    // and Yes, this is awful, but not that much worse than what was done in V7
    let aliases: [string, string][] = [];
    if (TableMixin.isMixedInto(this.props.catalogItem)) {
      aliases = this.props.catalogItem.columns
        .filter(col => col.name && col.title && col.name !== col.title)
        .map(col => [col.name!, col.title!]);
    }

    // Always overwrite using aliases so that applying titles to columns doesn't break feature info templates
    aliases.forEach(([name, title]) => {
      propertyValues[name] = propertyValues[title];
    });

    // Properties accessible as {name, value} array; useful when you want
    // to iterate anonymous property values in the mustache template.
    const properties = Object.entries(propertyValues).map(([name, value]) => ({
      name,
      value
    }));

    const propertyData = {
      ...propertyValues,
      properties,
      feature: this.props.feature
    };

    const terria: {
      partialByName: MustacheFunction;
      formatNumber: MustacheFunction;
      formatDateTime: MustacheFunction;
      urlEncodeComponent: MustacheFunction;
      urlEncode: MustacheFunction;
      coords?: {
        latitude: number;
        longitude: number;
      };
      currentTime?: Date;
      timeSeries?: unknown;
    } = {
      partialByName: mustacheRenderPartialByName(
        this.props.template?.partials ?? {},
        propertyData
      ),
      formatNumber: mustacheFormatNumberFunction,
      formatDateTime: mustacheFormatDateTime,
      urlEncodeComponent: mustacheURLEncodeTextComponent,
      urlEncode: mustacheURLEncodeText
    };

    if (this.props.position) {
      const latLngInRadians = Ellipsoid.WGS84.cartesianToCartographic(
        this.props.position
      );
      terria.coords = {
        latitude: CesiumMath.toDegrees(latLngInRadians.latitude),
        longitude: CesiumMath.toDegrees(latLngInRadians.longitude)
      };
    }
    if (
      DiscretelyTimeVaryingMixin.isMixedInto(this.props.catalogItem) &&
      this.props.catalogItem.currentTimeAsJulianDate
    ) {
      terria.currentTime = JulianDate.toDate(
        this.props.catalogItem.currentTimeAsJulianDate
      );
    }

    if (TableMixin.isMixedInto(this.props.catalogItem))
      terria.timeSeries = this.timeSeriesChartContext;

    return { ...propertyData, terria };
  }

  clickHeader() {
    if (isDefined(this.props.onClickHeader)) {
      this.props.onClickHeader(this.props.feature);
    }
  }

  /** Context object passed into "parseCustomMarkdownToReact" */
  @computed get parseMarkdownContextData() {
    return {
      terria: this.props.viewState.terria,
      catalogItem: this.props.catalogItem,
      feature: this.props.feature
    };
  }

  /** Get Raw feature info.
   * Note: this can be computed - as no custom components are used which cause side-effects (eg CSVChartCustomComponent)
   */
  @computed
  get rawFeatureInfo(): React.ReactNode | undefined {
    const feature = this.props.feature;

    const currentTime = this.currentTimeIfAvailable ?? JulianDate.now();
    let description =
      feature.currentDescription || feature.description?.getValue(currentTime);

    if (!isDefined(description) && isDefined(feature.properties)) {
      description = generateCesiumInfoHTMLFromProperties(
        feature.properties,
        currentTime,
        MappableMixin.isMixedInto(this.props.catalogItem)
          ? this.props.catalogItem.showStringIfPropertyValueIsNull
          : undefined
      );
    }

    return parseCustomMarkdownToReact(
      description,
      this.parseMarkdownContextData
    );
  }

  isFeatureTimeVarying(feature: Feature) {
    // The feature is NOT time-varying if:
    // 1. There is no info (ie. no description and no properties).
    // 2. A template is provided and all feature.properties are constant.
    // OR
    // 3. No template is provided, and feature.description is either not isDefined, or isDefined and constant.
    // If info is time-varying, we need to keep updating the description.
    if (!isDefined(feature.description) && !isDefined(feature.properties)) {
      return false;
    }
    if (isDefined(this.props.template)) {
      return !areAllPropertiesConstant(feature.properties);
    }
    if (isDefined(feature.description)) {
      return !feature.description?.isConstant; // This should always be a "Property" eg. a ConstantProperty.
    }
    return false;
  }

  @action
  toggleRawData() {
    this.showRawData = !this.showRawData;
  }

  @computed get downloadableData() {
    let fileName = getName(this.props.catalogItem);

    // Add the Lat, Lon to the baseFilename if it is possible and not already present.
    if (this.props.position) {
      const position = Ellipsoid.WGS84.cartesianToCartographic(
        this.props.position
      );
      const latitude = CesiumMath.toDegrees(position.latitude);
      const longitude = CesiumMath.toDegrees(position.longitude);
      const precision = 5;
      // Check that baseFilename doesn't already contain the lat, lon with the similar or better precision.
      if (
        !contains(fileName, latitude, precision) ||
        !contains(fileName, longitude, precision)
      ) {
        fileName +=
          " - Lat " +
          latitude.toFixed(precision) +
          " Lon " +
          longitude.toFixed(precision);
      }
    }

    return {
      data: this.featureProperties !== {} ? this.featureProperties : undefined,
      fileName
    };
  }

  render() {
    const { t } = this.props;

    let title: string;

    if (this.props.template.name) {
      title = Mustache.render(this.props.template.name, this.featureProperties);
    } else
      title =
        (this.props.catalogItem.name
          ? this.props.catalogItem.name + " - "
          : "") + this.props.feature.name ||
        this.props.t("featureInfo.siteData");

    return (
      <li className={classNames(Styles.section)}>
        {this.props.printView ? (
          <h2>{title}</h2>
        ) : (
          <button
            type="button"
            onClick={this.clickHeader.bind(this)}
            className={Styles.title}
          >
            <span>{title}</span>
            {this.props.isOpen ? (
              <Icon glyph={Icon.GLYPHS.opened} />
            ) : (
              <Icon glyph={Icon.GLYPHS.closed} />
            )}
          </button>
        )}

        {this.props.isOpen ? (
          <section className={Styles.content}>
            {/* If we have templated feature info (and not in print mode) - render "show raw data" button */}
            {!this.props.printView && this.templatedFeatureInfo ? (
              <button
                type="button"
                className={Styles.rawDataButton}
                onClick={this.toggleRawData.bind(this)}
              >
                {this.showRawData
                  ? t("featureInfo.showCuratedData")
                  : t("featureInfo.showRawData")}
              </button>
            ) : null}
            <div>
              {this.showRawData || !this.templatedFeatureInfo ? (
                <>
                  {this.rawFeatureInfo ? (
                    this.rawFeatureInfo
                  ) : (
                    <div ref="no-info" key="no-info">
                      {t("featureInfo.noInfoAvailable")}
                    </div>
                  )}
                  {!this.props.printView && this.chart ? (
                    <div className={Styles.timeSeriesChart}>
                      <h4>{this.timeSeriesChartContext?.title}</h4>
                      {this.chart}
                    </div>
                  ) : null}
                  {!this.props.printView &&
                  isDefined(this.downloadableData.data) ? (
                    <FeatureInfoDownload
                      key="download"
                      viewState={this.props.viewState}
                      data={this.downloadableData.data}
                      name={this.downloadableData.fileName}
                    />
                  ) : null}
                </>
              ) : (
                this.templatedFeatureInfo
              )}
            </div>
          </section>
        ) : null}
      </li>
    );
  }
}

/**
 * Determines whether all properties in the provided properties object have an isConstant flag set - otherwise they're
 * assumed to be time-varying.
 */
function areAllPropertiesConstant(properties: PropertyBag | undefined) {
  // test this by assuming property is time-varying only if property.isConstant === false.
  // (so if it is undefined or true, it is constant.)
  let result = true;
  if (!isDefined(properties)) return result;
  if (isDefined(properties.isConstant)) {
    return properties.isConstant;
  }
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      result =
        result &&
        isDefined(properties[key]) &&
        properties[key].isConstant !== false;
    }
  }
  return result;
}

const simpleStyleIdentifiers = [
  "title",
  "description",
  "marker-size",
  "marker-symbol",
  "marker-color",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "fill",
  "fill-opacity"
];

/**
 * A way to produce a description if properties are available but no template is given.
 * Derived from Cesium's geoJsonDataSource, but made to work with possibly time-varying properties.
 */
export function generateCesiumInfoHTMLFromProperties(
  properties: PropertyBag | undefined,
  time: JulianDate,
  showStringIfPropertyValueIsNull: string | undefined
) {
  let html = "";
  if (typeof properties?.getValue === "function") {
    properties = properties.getValue(time);
  }
  if (typeof properties === "object") {
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        if (simpleStyleIdentifiers.indexOf(key) !== -1) {
          continue;
        }
        let value = properties[key];
        if (isDefined(showStringIfPropertyValueIsNull) && !isDefined(value)) {
          value = showStringIfPropertyValueIsNull;
        }
        if (isDefined(value)) {
          if (typeof value.getValue === "function") {
            value = value.getValue(time);
          }
          if (Array.isArray(properties)) {
            html +=
              "<tr><td>" +
              generateCesiumInfoHTMLFromProperties(
                value,
                time,
                showStringIfPropertyValueIsNull
              ) +
              "</td></tr>";
          } else if (typeof value === "object") {
            html +=
              "<tr><th>" +
              key +
              "</th><td>" +
              generateCesiumInfoHTMLFromProperties(
                value,
                time,
                showStringIfPropertyValueIsNull
              ) +
              "</td></tr>";
          } else {
            html += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
          }
        }
      }
    }
  } else {
    // properties is only a single value.
    html += "<tr><th>" + "</th><td>" + properties + "</td></tr>";
  }
  if (html.length > 0) {
    html =
      '<table class="cesium-infoBox-defaultTable"><tbody>' +
      html +
      "</tbody></table>";
  }
  return html;
}

// See if text contains the number (to a precision number of digits (after the dp) either fixed up or down on the last digit).
function contains(text: string, number: number, precision: number) {
  // Take Math.ceil or Math.floor and use it to calculate the number with a precision number of digits (after the dp).
  function fixed(round: (x: number) => number, number: number) {
    const scale = Math.pow(10, precision);
    return (round(number * scale) / scale).toFixed(precision);
  }
  return (
    text.indexOf(fixed(Math.floor, number)) !== -1 ||
    text.indexOf(fixed(Math.ceil, number)) !== -1
  );
}

export default withTranslation()(FeatureInfoSection);
