"use strict";

import classNames from "classnames";
import dateFormat from "dateformat";
import { TFunction } from "i18next";
import { action, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import Mustache from "mustache";
import React from "react";
import { withTranslation } from "react-i18next";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import isDefined from "../../Core/isDefined";
import {
  isJsonNumber,
  isJsonObject,
  isJsonString,
  JsonObject
} from "../../Core/Json";
import propertyGetTimeValues from "../../Core/propertyGetTimeValues";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import TimeVarying from "../../ModelMixins/TimeVarying";
import Model from "../../Models/Definition/Model";
import Feature from "../../Models/Feature";
import ViewState from "../../ReactViewModels/ViewState";
import Icon from "../../Styled/Icon";
import { ChartDetails } from "../../Table/getChartDetailsFn";
import FeatureInfoTraits, {
  FeatureInfoFormat,
  FeatureInfoTemplateTraits
} from "../../Traits/TraitsClasses/FeatureInfoTraits";
import CustomComponent from "../Custom/CustomComponent";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Styles from "./feature-info-section.scss";
import FeatureInfoDownload from "./FeatureInfoDownload";

type MustacheFunction = () => (
  text: string,
  render: (value: string) => string
) => string;

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
  @observable
  removeClockSubscription?: () => void;

  @observable
  removeFeatureChangedSubscription?: () => void;

  @observable
  timeoutIds: number[] = [];

  @observable
  showRawData: boolean = false;

  @computed get currentTimeIfAvailable() {
    return TimeVarying.is(this.props.catalogItem)
      ? this.props.catalogItem.currentTimeAsJulianDate
      : undefined;
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.setSubscriptionsAndTimeouts(this.props.feature);
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps(nextProps: FeatureInfoProps) {
    // If the feature changed (without an unmount/mount),
    // change the subscriptions that handle time-varying data.
    if (nextProps.feature !== this.props.feature) {
      this.removeSubscriptionsAndTimeouts();
      this.setSubscriptionsAndTimeouts(nextProps.feature);
    }
  }

  componentWillUnmount() {
    this.removeSubscriptionsAndTimeouts();
  }

  /**
   * Do we need to dynamically update this feature info over time?
   * There are three situations in which we would:
   * 1. When the feature description or properties are time-varying.
   * 2. When a custom component self-updates.
   *    Eg. <chart poll-seconds="60" src="xyz.csv"> must reload data from xyz.csv every 60 seconds.
   * 3. When a catalog item changes a feature's properties, eg. changing from a daily view to a monthly view.
   *
   * For (1), use catalogItem.clock.currentTime knockout observable so don't need to do anything specific here.
   * For (2), use a regular javascript setTimeout to update a counter in feature's currentProperties.
   * For (3), use an event listener on the Feature's underlying Entity's "definitionChanged" event.
   *   Conceivably it could also be handled by the catalog item itself changing, if its change is knockout tracked, and the
   *   change leads to a change in what is rendered (unlikely).
   * Since the catalogItem is also a prop, this will trigger a rerender.
   * @private
   */
  @action
  setSubscriptionsAndTimeouts(feature: Feature) {
    this.removeFeatureChangedSubscription = feature.definitionChanged.addEventListener(
      ((changedFeature: Feature) =>
        runInAction(() => {
          setCurrentFeatureValues(
            changedFeature,
            this.currentTimeIfAvailable ??
              this.props.viewState.terria.timelineClock.currentTime
          );
        })).bind(this)
    );
    // setTimeoutsForUpdatingCustomComponents(featureInfoSection);
  }

  /**
   * Remove the clock subscription (event listener) and timeouts.
   * @private
   */
  removeSubscriptionsAndTimeouts() {
    if (isDefined(this.removeFeatureChangedSubscription)) {
      this.removeFeatureChangedSubscription();
      this.removeFeatureChangedSubscription = undefined;
    }
    this.timeoutIds.forEach(id => {
      clearTimeout(id);
    });
  }

  getFeatureProperties() {
    // Manipulate the properties before tempesting them.
    // If they require .getValue, apply that.
    // If they have bad keys, fix them.
    // If they have formatting, apply it.
    const properties =
      this.props.feature.currentProperties ||
      propertyGetTimeValues(
        this.props.feature.properties,
        this.currentTimeIfAvailable
      );

    // Try JSON.parse on values that look like JSON arrays or objects
    let result = parseValues(properties);
    result = replaceBadKeyCharacters(result);

    if (this.props.catalogItem.featureInfoTemplate.formats) {
      applyFormatsInPlace(
        result,
        this.props.catalogItem.featureInfoTemplate.formats
      );
    }
    return result;
  }

  getTemplateData() {
    const propertyValues = Object.assign({}, this.getFeatureProperties());

    // Alises is a map from `key` (which exists in propertyData.properties) to some `aliasKey` which needs to resolve to `key`
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
        propertyValues /* !!! should reference propertyData*/
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
      terria.timeSeries = getTimeSeriesChartContext(
        this.props.catalogItem,
        this.props.feature,
        propertyValues._terria_getChartDetails as any
      );

    return propertyData;
  }

  clickHeader() {
    if (isDefined(this.props.onClickHeader)) {
      this.props.onClickHeader(this.props.feature);
    }
  }

  hasTemplate() {
    return (
      this.props.template &&
      (typeof this.props.template === "string" || this.props.template.template)
    );
  }

  descriptionFromTemplate() {
    const { t } = this.props;
    const template = this.props.template;
    const templateData = this.getTemplateData();

    // templateData may not be isDefined if a re-render gets triggered in the middle of a feature updating.
    // (Recall we re-render whenever feature.definitionChanged triggers.)
    if (isDefined(templateData) && template.template) {
      return Mustache.render(
        template.template,
        templateData,
        template.partials
      );
    }

    return t("featureInfo.noInfoAvailable");
  }

  descriptionFromFeature() {
    const feature = this.props.feature;

    // This description could contain injected <script> tags etc.
    // Before rendering, we will pass it through parseCustomMarkdownToReact, which applies
    //     markdownToHtml (which applies MarkdownIt.render and DOMPurify.sanitize), and then
    //     parseCustomHtmlToReact (which calls htmlToReactParser).
    // Note that there is an unnecessary HTML encoding and decoding in this combination which would be good to remove.
    const currentTime = this.currentTimeIfAvailable ?? JulianDate.now();
    let description =
      feature.currentDescription || getCurrentDescription(feature, currentTime);
    if (!isDefined(description) && isDefined(feature.properties)) {
      description = describeFromProperties(
        feature.properties,
        currentTime,
        this.props.catalogItem.showStringIfPropertyValueIsNull
      );
    }
    return description;
  }

  renderDataTitle() {
    const { t } = this.props;
    const template = this.props.template;
    if (typeof template === "object" && template.name) {
      return Mustache.render(template.name, this.getFeatureProperties());
    }
    const feature = this.props.feature;
    return (feature && feature.name) || t("featureInfo.siteData");
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

  /**
   * Wrangle the provided feature data into more convenient forms.
   * @private
   * @param  {ReactClass} that The FeatureInfoSection.
   * @return {Object} Returns {info, rawData, showRawData, hasRawData, ...}.
   *                  info is the main body of the info section, as a react component.
   *                  rawData is the same for the raw data, if it needs to be shown.
   *                  showRawData is whether to show the rawData.
   *                  hasRawData is whether there is any rawData to show.
   *                  timeSeriesChart - if the feature has timeseries data that could be shown in chart, this is the chart.
   *                  downloadableData is the same as template data, but numerical.
   */
  getInfoAsReactComponent() {
    const templateData = this.getFeatureProperties();
    const downloadableData = isJsonObject(
      templateData._terria_numericalProperties
    )
      ? templateData._terria_numericalProperties
      : isJsonObject(templateData)
      ? templateData
      : undefined;

    const updateCounters = this.props.feature.updateCounters;
    const context = {
      terria: this.props.viewState.terria,
      catalogItem: this.props.catalogItem,
      feature: this.props.feature,
      updateCounters: updateCounters
    };
    let timeSeriesChart;
    let timeSeriesChartTitle;

    if (
      isDefined(templateData) &&
      TableMixin.isMixedInto(this.props.catalogItem)
    ) {
      const timeSeriesChartContext = getTimeSeriesChartContext(
        this.props.catalogItem,
        this.props.feature,
        templateData._terria_getChartDetails as any
      );
      if (isDefined(timeSeriesChartContext)) {
        timeSeriesChart = parseCustomMarkdownToReact(
          timeSeriesChartContext.chart,
          context
        );
        timeSeriesChartTitle = timeSeriesChartContext.title;
      }
    }
    const showRawData = !this.hasTemplate() || this.showRawData;
    let rawDataHtml;
    let rawData;
    if (showRawData) {
      rawDataHtml = this.descriptionFromFeature();
      if (isDefined(rawDataHtml)) {
        rawData = parseCustomMarkdownToReact(rawDataHtml, context);
      }
    }
    return {
      info: this.hasTemplate()
        ? parseCustomMarkdownToReact(this.descriptionFromTemplate(), context)
        : rawData,
      rawData: rawData,
      showRawData: showRawData,
      hasRawData: !!rawDataHtml,
      timeSeriesChartTitle: timeSeriesChartTitle,
      timeSeriesChart: timeSeriesChart,
      downloadableData: downloadableData
    };
  }

  render() {
    const { t } = this.props;
    const catalogItemName =
      (this.props.catalogItem && this.props.catalogItem.name) || "";
    let baseFilename = catalogItemName;
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
        typeof baseFilename !== "string" ||
        !contains(baseFilename, latitude, precision) ||
        !contains(baseFilename, longitude, precision)
      ) {
        baseFilename +=
          " - Lat " +
          latitude.toFixed(precision) +
          " Lon " +
          longitude.toFixed(precision);
      }
    }
    const fullName =
      (catalogItemName ? catalogItemName + " - " : "") + this.renderDataTitle();
    const reactInfo = this.getInfoAsReactComponent();

    return (
      <li className={classNames(Styles.section)}>
        {this.props.printView ? (
          <h2>{fullName}</h2>
        ) : (
          <button
            type="button"
            onClick={this.clickHeader}
            className={Styles.title}
          >
            <span>{fullName}</span>
            {this.props.isOpen ? (
              <Icon glyph={Icon.GLYPHS.opened} />
            ) : (
              <Icon glyph={Icon.GLYPHS.closed} />
            )}
          </button>
        )}

        {this.props.isOpen ? (
          <section className={Styles.content}>
            {!this.props.printView && this.hasTemplate() ? (
              <button
                type="button"
                className={Styles.rawDataButton}
                onClick={this.toggleRawData}
              >
                {this.showRawData
                  ? t("featureInfo.showCuratedData")
                  : t("featureInfo.showRawData")}
              </button>
            ) : null}
            <div>
              {reactInfo.showRawData || !this.hasTemplate() ? (
                <>
                  {reactInfo.hasRawData ? (
                    reactInfo.rawData
                  ) : (
                    <div ref="no-info" key="no-info">
                      {t("featureInfo.noInfoAvailable")}
                    </div>
                  )}
                  {!this.props.printView && reactInfo.timeSeriesChart ? (
                    <div className={Styles.timeSeriesChart}>
                      <h4>{reactInfo.timeSeriesChartTitle}</h4>
                      {reactInfo.timeSeriesChart}
                    </div>
                  ) : null}
                  {!this.props.printView &&
                  isDefined(reactInfo.downloadableData) ? (
                    <FeatureInfoDownload
                      key="download"
                      viewState={this.props.viewState}
                      data={
                        isJsonObject(reactInfo.downloadableData)
                          ? reactInfo.downloadableData
                          : {}
                      }
                      name={baseFilename}
                    />
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
        ) : null}
      </li>
    );
  }
}

function parseValues(properties: JsonObject) {
  // JSON.parse property values that look like arrays or objects
  const result: JsonObject = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      let val = properties[key];
      if (
        val &&
        (typeof val === "string" || val instanceof String) &&
        /^\s*[[{]/.test(val as string)
      ) {
        try {
          val = JSON.parse(val as string);
        } catch (e) {}
      }
      result[key] = val;
    }
  }
  return result;
}

/**
 * Formats values in an object if their keys match the provided formats object.
 * @private
 * @param {Object} properties a map of property labels to property values.
 * @param {Object} formats A map of property labels to the number formats that should be applied for them.
 */
function applyFormatsInPlace(
  properties: JsonObject,
  formats: Record<string, FeatureInfoFormat>
) {
  // Optionally format each property. Updates properties in place, returning nothing.
  for (const key in formats) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      // Default type if not provided is number.
      const value = properties[key];
      if (
        isJsonNumber(value) &&
        (!isDefined(formats[key].type) ||
          (isDefined(formats[key].type) && formats[key].type === "number"))
      ) {
        runInAction(() => {
          // Note we default maximumFractionDigits to 20 (not 3).
          properties[key] = value.toLocaleString(undefined, {
            maximumFractionDigits: 20,
            useGrouping: true,
            ...formats[key]
          });
        });
      }
      if (isDefined(formats[key].type)) {
        if (formats[key].type === "dateTime" && isJsonString(value)) {
          runInAction(() => {
            properties[key] = formatDateTime(value, formats[key]);
          });
        }
      }
    }
  }
}

/**
 * Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
 * @private
 */
function replaceBadKeyCharacters(properties: JsonObject) {
  const result: JsonObject = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const cleanKey = key.replace(/[.#]/g, "_");
      const value = properties[key];
      result[cleanKey] = isJsonObject(value)
        ? replaceBadKeyCharacters(value)
        : value;
    }
  }
  return result;
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

/**
 * Gets a text description for the provided feature at a certain time.
 * @private
 * @param {Entity} feature
 * @param {JulianDate} currentTime
 * @returns {String}
 */
function getCurrentDescription(feature: Feature, currentTime: JulianDate) {
  if (feature.description) {
    return feature.description.getValue(currentTime);
  }
}

/**
 * Updates {@link Entity#currentProperties} and {@link Entity#currentDescription} with the values at the provided time.
 * @private
 * @param {Entity} feature
 * @param {JulianDate} currentTime
 */
function setCurrentFeatureValues(feature: Feature, currentTime: JulianDate) {
  const newProperties = propertyGetTimeValues(feature.properties, currentTime);
  if (newProperties !== feature.currentProperties) {
    feature.currentProperties = newProperties;
  }
  const newDescription = getCurrentDescription(feature, currentTime);
  if (newDescription !== feature.currentDescription) {
    feature.currentDescription = newDescription;
  }
}

/**
 * Returns a function which extracts JSON elements from the content of a Mustache section template and calls the
 * supplied customProcessing function with the extracted JSON options, example syntax processed:
 * {optionKey: optionValue}{{value}}
 * @private
 */
function mustacheJsonSubOptions(
  customProcessing: (value: string, options?: JsonObject) => string
) {
  return function(text: string, render: (input: string) => string) {
    // Eg. "{foo:1}hi there".match(optionReg) = ["{foo:1}hi there", "{foo:1}", "hi there"].
    // Note this won't work with nested objects in the options (but these aren't used yet).
    // Note I use [\s\S]* instead of .* at the end - .* does not match newlines, [\s\S]* does.
    const optionReg = /^(\{[^}]+\})([\s\S]*)/;
    const components = text.match(optionReg);
    // This regex unfortunately matches double-braced text like {{number}}, so detect that separately and do not treat it as option json.
    const startsWithdoubleBraces =
      text.length > 4 && text[0] === "{" && text[1] === "{";
    if (!components || startsWithdoubleBraces) {
      // If no options were provided, just use the defaults.
      return customProcessing(render(text));
    }
    // Allow {foo: 1} by converting it to {"foo": 1} for JSON.parse.
    const quoteReg = /([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:/g;
    const jsonOptions = components[1].replace(quoteReg, '$1"$3":');
    const options = JSON.parse(jsonOptions);
    return customProcessing(render(components[2]), options);
  };
}

/**
 * Returns a function which implements number formatting in Mustache templates, using this syntax:
 * {{#terria.formatNumber}}{useGrouping: true}{{value}}{{/terria.formatNumber}}
 * @private
 */
function mustacheFormatNumberFunction(): (
  text: string,
  render: (value: string) => string
) => string {
  return mustacheJsonSubOptions(
    (value: string, options?: Intl.NumberFormatOptions) =>
      parseFloat(value).toLocaleString(undefined, options)
  );
}

/**
 * Returns a function that replaces value in Mustache templates, using this syntax:
 * {
 *   "template": {{#terria.partialByName}}{{value}}{{/terria.partialByName}}.
 *   "partials": {
 *     "value1": "replacement1",
 *     ...
 *   }
 * }
 *
 * E.g. {{#terria.partialByName}}{{value}}{{/terria.partialByName}}
     "featureInfoTemplate": {
        "template": "{{Pixel Value}} dwellings in {{#terria.partialByName}}{{feature.data.layerId}}{{/terria.partialByName}} radius.",
        "partials": {
          "0": "100m",
          "1": "500m",
          "2": "1km",
          "3": "2km"
        }
      }
 * @private
 */
function mustacheRenderPartialByName(
  partials: Record<string, string>,
  templateData: JsonObject
) {
  return () => {
    return mustacheJsonSubOptions((value, options) => {
      if (!isJsonString(value)) return `${value}`;
      if (partials && typeof partials[value] === "string") {
        return Mustache.render(partials[value], templateData);
      } else {
        return Mustache.render(value, templateData);
      }
    });
  };
}

/**
 * Formats the date according to the date format string.
 * If the date expression can't be parsed using Date.parse() it will be returned unmodified.
 *
 * @param {String} text The date to format.
 * @param {Object} options Object with the following properties:
 * @param {String} options.format If present, will override the default date format using the npm datefromat package
 *                                format (see https://www.npmjs.com/package/dateformat). E.g. "isoDateTime"
 *                                or "dd-mm-yyyy HH:MM:ss". If not supplied isoDateTime will be used.
 * @private
 */
function formatDateTime(text: string, options?: { format?: string }) {
  const date = Date.parse(text);

  if (!isDefined(date) || isNaN(date)) {
    return text;
  }

  if (isDefined(options) && isDefined(options.format)) {
    return dateFormat(date, options.format);
  }

  return dateFormat(date, "isoDateTime");
}

/**
 * Returns a function which implements date/time formatting in Mustache templates, using this syntax:
 * {{#terria.formatDateTime}}{format: "npm dateFormat string"}DateExpression{{/terria.formatDateTime}}
 * format If present, will override the default date format (see https://www.npmjs.com/package/dateformat)
 * Eg. "isoDateTime" or "dd-mm-yyyy HH:MM:ss".
 * If the Date_Expression can't be parsed using Date.parse() it will be used(returned) unmodified by the terria.formatDateTime section expression.
 * If no valid date formatting options are present in the terria.formatDateTime section isoDateTime will be used.
 * @private
 */
function mustacheFormatDateTime() {
  return mustacheJsonSubOptions(formatDateTime);
}

/**
 * URL Encodes provided text: {{#terria.urlEncodeComponent}}{{value}}{{/terria.urlEncodeComponent}}.
 * See encodeURIComponent for details.
 *
 * {{#terria.urlEncodeComponent}}W/HO:E#1{{/terria.urlEncodeComponent}} -> W%2FHO%3AE%231
 * @private
 */
function mustacheURLEncodeTextComponent() {
  return function(text: string, render: (value: string) => string) {
    return encodeURIComponent(render(text));
  };
}

/**
 * URL Encodes provided text: {{#terria.urlEncode}}{{value}}{{/terria.urlEncode}}.
 * See encodeURI for details.
 *
 * {{#terria.urlEncode}}http://example.com/a b{{/terria.urlEncode}} -> http://example.com/a%20b
 * @private
 */
function mustacheURLEncodeText() {
  return function(text: string, render: (value: string) => string) {
    return encodeURI(render(text));
  };
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
 * @private
 */
function describeFromProperties(
  properties: PropertyBag,
  time: JulianDate,
  showStringIfPropertyValueIsNull: string | undefined
) {
  let html = "";
  if (typeof properties.getValue === "function") {
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
              describeFromProperties(
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
              describeFromProperties(
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

/**
 * Get parameters that should be exposed to the template, to help show a timeseries chart of the feature data.
 * @private
 */
function getTimeSeriesChartContext(
  catalogItem: TableMixin.Instance,
  feature: Feature,
  getChartDetails: () => ChartDetails
) {
  // Only show it as a line chart if the details are available, the data is sampled (so a line chart makes sense), and charts are available.
  if (
    isDefined(getChartDetails) &&
    isDefined(catalogItem) &&
    catalogItem.isSampled &&
    CustomComponent.isRegistered("chart")
  ) {
    const chartDetails = getChartDetails();
    const distinguishingId = catalogItem.dataViewId;
    const featureId = isDefined(distinguishingId)
      ? distinguishingId + "--" + feature.id
      : feature.id;
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
