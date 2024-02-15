import classNames from "classnames";
import { isEmpty, merge } from "lodash-es";
import {
  action,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction
} from "mobx";
import { observer } from "mobx-react";
import { IDisposer } from "mobx-utils";
import Mustache from "mustache";
import * as React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import TerriaError from "../../Core/TerriaError";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import TimeVarying from "../../ModelMixins/TimeVarying";
import TerriaFeature from "../../Models/Feature/Feature";
import FeatureInfoContext from "../../Models/Feature/FeatureInfoContext";
import Icon from "../../Styled/Icon";
import { TimeSeriesContext } from "../../Table/tableFeatureInfoContext";
import { FeatureInfoPanelButton as FeatureInfoPanelButtonModel } from "../../ViewModels/FeatureInfoPanel";
import { WithViewState, withViewState } from "../Context";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import FeatureInfoDownload from "./FeatureInfoDownload";
import FeatureInfoPanelButton from "./FeatureInfoPanelButton";
import Styles from "./feature-info-section.scss";
import { generateCesiumInfoHTMLFromProperties } from "./generateCesiumInfoHTMLFromProperties";
import getFeatureProperties from "./getFeatureProperties";
import {
  MustacheFunction,
  mustacheFormatDateTime,
  mustacheFormatNumberFunction,
  mustacheRenderPartialByName,
  mustacheURLEncodeText,
  mustacheURLEncodeTextComponent
} from "./mustacheExpressions";

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
Mustache.escape = function (string) {
  return string;
};

interface FeatureInfoProps extends WithViewState, WithTranslation {
  feature: TerriaFeature;
  position?: Cartesian3;
  catalogItem: MappableMixin.Instance; // Note this may not be known (eg. WFS).
  isOpen: boolean;
  onClickHeader?: (feature: TerriaFeature) => void;
  printView?: boolean;
}

@observer
export class FeatureInfoSection extends React.Component<FeatureInfoProps> {
  private templateReactionDisposer: IDisposer | undefined;
  private removeFeatureChangedSubscription: (() => void) | undefined;

  /** Rendered feature info template - this is set using reaction.
   * We can't use `@computed` values for custom templates - as CustomComponents may cause side-effects.
   * For example
   * - A CsvChartCustomComponent will create a new CsvCatalogItem and set traits
   * See `rawDataReactNode` for rendered raw data
   */
  @observable.ref private templatedFeatureInfoReactNode:
    | React.ReactNode
    | undefined = undefined;

  noInfoRef: HTMLDivElement | null = null;

  @observable
  private showRawData: boolean = false;

  /** See `setFeatureChangedCounter` */
  @observable featureChangedCounter = 0;

  constructor(props: FeatureInfoProps) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    this.templateReactionDisposer = reaction(
      () => [
        this.props.feature,
        this.props.catalogItem.featureInfoTemplate.template,
        this.props.catalogItem.featureInfoTemplate.partials,
        // Note `mustacheContextData` will trigger update when `currentTime` changes (through this.featureProperties)
        this.mustacheContextData
      ],
      () => {
        if (
          this.props.catalogItem.featureInfoTemplate.template &&
          this.mustacheContextData
        ) {
          this.templatedFeatureInfoReactNode = parseCustomMarkdownToReact(
            Mustache.render(
              this.props.catalogItem.featureInfoTemplate.template,
              this.mustacheContextData,
              this.props.catalogItem.featureInfoTemplate.partials
            ),
            this.parseMarkdownContextData
          );
        } else {
          this.templatedFeatureInfoReactNode = undefined;
        }
      },
      { fireImmediately: true }
    );

    this.setFeatureChangedCounter(this.props.feature);
  }

  componentDidUpdate(prevProps: FeatureInfoProps) {
    if (prevProps.feature !== this.props.feature) {
      this.setFeatureChangedCounter(this.props.feature);
    }
  }

  /** Dispose of reaction and cesium feature change event listener */
  componentWillUnmount() {
    this.templateReactionDisposer?.();
    this.removeFeatureChangedSubscription?.();
  }

  /**
   * We need to force `featureProperties` to re-compute when Cesium Feature properties change.
   * We use `featureChangedCounter` and increment it every change
   */
  @action
  private setFeatureChangedCounter(feature: TerriaFeature) {
    this.removeFeatureChangedSubscription?.();
    this.removeFeatureChangedSubscription =
      feature.definitionChanged.addEventListener(
        ((changedFeature: TerriaFeature) => {
          runInAction(() => {
            this.featureChangedCounter++;
          });
        }).bind(this)
      );
  }

  @computed get currentTimeIfAvailable() {
    return TimeVarying.is(this.props.catalogItem)
      ? this.props.catalogItem.currentTimeAsJulianDate
      : undefined;
  }

  @computed get featureProperties() {
    // Force computed to re-calculate when cesium feature properties change
    this.featureChangedCounter;

    return getFeatureProperties(
      this.props.feature,
      this.currentTimeIfAvailable ?? JulianDate.now(),
      MappableMixin.isMixedInto(this.props.catalogItem) &&
        this.props.catalogItem.featureInfoTemplate.formats
        ? this.props.catalogItem.featureInfoTemplate.formats
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
   *     - `rawDataTable` contains markdown table
   *  - properties provided by catalog item through `featureInfoContext` function
   */
  @computed
  get mustacheContextData() {
    const propertyValues = Object.assign({}, this.featureProperties);

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
      timeSeries?: TimeSeriesContext;
      rawDataTable?: string;
    } = {
      partialByName: mustacheRenderPartialByName(
        this.props.catalogItem.featureInfoTemplate?.partials ?? {},
        propertyData
      ),
      formatNumber: mustacheFormatNumberFunction,
      formatDateTime: mustacheFormatDateTime,
      urlEncodeComponent: mustacheURLEncodeTextComponent,
      urlEncode: mustacheURLEncodeText,
      rawDataTable: this.rawDataMarkdown
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

    // Add currentTime property
    // if discrete - use current discrete time
    // otherwise - use current (continuous) time
    if (
      DiscretelyTimeVaryingMixin.isMixedInto(this.props.catalogItem) &&
      this.props.catalogItem.currentDiscreteJulianDate
    ) {
      terria.currentTime = JulianDate.toDate(
        this.props.catalogItem.currentDiscreteJulianDate
      );
    } else if (
      TimeVarying.is(this.props.catalogItem) &&
      this.props.catalogItem.currentTimeAsJulianDate
    ) {
      terria.currentTime = JulianDate.toDate(
        this.props.catalogItem.currentTimeAsJulianDate
      );
    }

    // If catalog item has featureInfoContext function
    // Merge it into other properties
    if (FeatureInfoContext.is(this.props.catalogItem)) {
      return merge(
        { ...propertyData, terria },
        this.props.catalogItem.featureInfoContext(this.props.feature) ?? {}
      );
    }

    return { ...propertyData, terria };
  }

  clickHeader() {
    if (isDefined(this.props.onClickHeader)) {
      this.props.onClickHeader(this.props.feature);
    }
  }

  /** Context object passed into "parseCustomMarkdownToReact"
   * These will get passed to CustomComponents (eg CsvChartCustomComponent)
   */
  @computed get parseMarkdownContextData() {
    return {
      terria: this.props.viewState.terria,
      catalogItem: this.props.catalogItem,
      feature: this.props.feature
    };
  }

  /** Get raw data table as markdown string
   *
   * Will use feature.description if defined
   * Otherwise, will generate cesium info HTML table from feature properties
   */
  @computed get rawDataMarkdown() {
    const feature = this.props.feature;

    const currentTime = this.currentTimeIfAvailable ?? JulianDate.now();
    const description: string | undefined =
      feature.description?.getValue(currentTime);

    if (isDefined(description)) return description;

    if (isDefined(feature.properties)) {
      return generateCesiumInfoHTMLFromProperties(
        feature.properties,
        currentTime,
        MappableMixin.isMixedInto(this.props.catalogItem)
          ? this.props.catalogItem.showStringIfPropertyValueIsNull
          : undefined
      );
    }
  }

  /** Get Raw data as ReactNode.
   * Note: this can be computed - as no custom components are used which cause side-effects (eg CSVChartCustomComponent)
   * See `templatedFeatureInfoReactNode` for rendered feature info template
   */
  @computed
  get rawFeatureInfoReactNode(): React.ReactNode | undefined {
    if (this.rawDataMarkdown)
      return parseCustomMarkdownToReact(
        this.rawDataMarkdown,
        this.parseMarkdownContextData
      );
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
      data:
        this.featureProperties && !isEmpty(this.featureProperties)
          ? this.featureProperties
          : undefined,
      fileName
    };
  }

  @computed
  get generatedButtons(): FeatureInfoPanelButtonModel[] {
    const { feature, catalogItem } = this.props;
    const buttons = filterOutUndefined(
      this.props.viewState.featureInfoPanelButtonGenerators.map((generator) => {
        try {
          const dim = generator({ feature, item: catalogItem });
          return dim;
        } catch (error) {
          TerriaError.from(error).log();
        }
      })
    );
    return buttons;
  }

  renderButtons() {
    const { t } = this.props;
    return (
      <ButtonsContainer>
        {/* If we have templated feature info (and not in print mode) - render "show raw data" button */}
        {!this.props.printView && this.templatedFeatureInfoReactNode && (
          <FeatureInfoPanelButton
            onClick={this.toggleRawData.bind(this)}
            text={
              this.showRawData
                ? t("featureInfo.showCuratedData")
                : t("featureInfo.showRawData")
            }
          />
        )}
        {this.generatedButtons.map((button, i) => (
          <FeatureInfoPanelButton key={i} {...button} />
        ))}
      </ButtonsContainer>
    );
  }

  render() {
    const { t } = this.props;

    let title: string;

    if (this.props.catalogItem.featureInfoTemplate.name) {
      title = Mustache.render(
        this.props.catalogItem.featureInfoTemplate.name,
        this.mustacheContextData,
        this.props.catalogItem.featureInfoTemplate.partials
      );
    } else
      title =
        getName(this.props.catalogItem) +
        " - " +
        (this.props.feature.name || this.props.t("featureInfo.siteData"));

    /** Show feature info download if showing raw data - or showing template and `showFeatureInfoDownloadWithTemplate` is true
     */
    const showFeatureInfoDownload =
      this.showRawData ||
      !this.templatedFeatureInfoReactNode ||
      (this.templatedFeatureInfoReactNode &&
        this.props.catalogItem.featureInfoTemplate
          .showFeatureInfoDownloadWithTemplate);

    const titleElement = this.props.printView ? (
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
    );

    // If feature is unavailable (or not showing) - show no info message
    if (
      !this.props.feature.isAvailable(
        this.currentTimeIfAvailable ?? JulianDate.now()
      ) ||
      !this.props.feature.isShowing
    ) {
      return (
        <li className={classNames(Styles.section)}>
          {titleElement}
          {this.props.isOpen ? (
            <section className={Styles.content}>
              <div
                ref={(r) => {
                  this.noInfoRef = r;
                }}
                key="no-info"
              >
                {t("featureInfo.noInfoAvailable")}
              </div>
            </section>
          ) : null}
        </li>
      );
    }

    return (
      <li className={classNames(Styles.section)}>
        {titleElement}
        {this.props.isOpen ? (
          <section className={Styles.content}>
            {this.renderButtons()}
            <div>
              {this.props.feature.loadingFeatureInfoUrl ? (
                "Loading"
              ) : this.showRawData || !this.templatedFeatureInfoReactNode ? (
                this.rawFeatureInfoReactNode ? (
                  this.rawFeatureInfoReactNode
                ) : (
                  <div
                    ref={(r) => {
                      this.noInfoRef = r;
                    }}
                    key="no-info"
                  >
                    {t("featureInfo.noInfoAvailable")}
                  </div>
                )
              ) : (
                // Show templated feature info
                this.templatedFeatureInfoReactNode
              )}
              {
                // Show FeatureInfoDownload
                !this.props.printView &&
                showFeatureInfoDownload &&
                isDefined(this.downloadableData.data) ? (
                  <FeatureInfoDownload
                    key="download"
                    data={this.downloadableData.data}
                    name={this.downloadableData.fileName}
                  />
                ) : null
              }
            </div>
          </section>
        ) : null}
      </li>
    );
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

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 7px 0 10px 0;
`;

export default withTranslation()(withViewState(FeatureInfoSection));
