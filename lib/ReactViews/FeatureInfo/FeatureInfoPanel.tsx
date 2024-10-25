import classNames from "classnames";
import { TFunction } from "i18next";
import {
  action,
  reaction,
  runInAction,
  makeObservable,
  observable
} from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import React from "react";
import { withTranslation } from "react-i18next";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import flatten from "../../Core/flatten";
import isDefined from "../../Core/isDefined";
import { featureBelongsToCatalogItem } from "../../Map/PickedFeatures/PickedFeatures";
import prettifyCoordinates from "../../Map/Vector/prettifyCoordinates";
import MappableMixin from "../../ModelMixins/MappableMixin";
import TimeFilterMixin from "../../ModelMixins/TimeFilterMixin";
import CompositeCatalogItem from "../../Models/Catalog/CatalogItems/CompositeCatalogItem";
import { BaseModel } from "../../Models/Definition/Model";
import TerriaFeature from "../../Models/Feature/Feature";
import {
  addMarker,
  isMarkerVisible,
  removeMarker
} from "../../Models/LocationMarkerUtils";
import Terria from "../../Models/Terria";
import Workbench from "../../Models/Workbench";
import ViewState from "../../ReactViewModels/ViewState";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Loader from "../Loader";
import { withViewState } from "../Context";
import Styles from "./feature-info-panel.scss";
import FeatureInfoCatalogItem from "./FeatureInfoCatalogItem";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import DataUri from "../../Core/DataUri";
import Button from "../../Styled/Button";
import { StyledHr } from "../Map/Panels/SharePanel/StyledHr";
import { TextSpan } from "../../Styled/Text";
import clipboard from "clipboard";

const DragWrapper = require("../DragWrapper");

interface Props {
  viewState: ViewState;
  printView?: boolean;
  t: TFunction;
}

@observer
class FeatureInfoPanel extends React.Component<Props> {
  @observable whereAmI?: string = "";
  @observable whereAmIDetailed?: string = "";

  constructor(props: Props) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    const { t } = this.props;
    const terria = this.props.viewState.terria;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const clipboardBtn = new clipboard(`.btn-copy-featureinfopanel`);

    disposeOnUnmount(
      this,
      reaction(
        () => terria.pickedFeatures,
        (pickedFeatures) => {
          if (!isDefined(pickedFeatures)) {
            terria.selectedFeature = undefined;
          } else {
            terria.selectedFeature = TerriaFeature.fromEntity(
              new Entity({
                id: t("featureInfo.pickLocation"),
                position: pickedFeatures.pickPosition
              })
            );
            this.setPicked(terria, pickedFeatures.pickPosition);
            if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
              pickedFeatures.allFeaturesAvailablePromise.then(() => {
                if (this.props.viewState.featureInfoPanelIsVisible === false) {
                  // Panel is closed, refrain from setting selectedFeature
                  return;
                }

                // We only show features that are associated with a catalog item, so make sure the one we select to be
                // open initially is one we're actually going to show.
                const featuresShownAtAll = pickedFeatures.features.filter((x) =>
                  isDefined(determineCatalogItem(terria.workbench, x))
                );

                // Return if `terria.selectedFeatures` already showing a valid feature?
                if (
                  featuresShownAtAll.some(
                    (feature) => feature === terria.selectedFeature
                  )
                )
                  return;

                // Otherwise find first feature with data to show
                let selectedFeature = featuresShownAtAll.filter(
                  (feature) =>
                    isDefined(feature.properties) ||
                    isDefined(feature.description)
                )[0];
                if (
                  !isDefined(selectedFeature) &&
                  featuresShownAtAll.length > 0
                ) {
                  // Handles the case when no features have info - still want something to be open.
                  selectedFeature = featuresShownAtAll[0];
                }
                runInAction(() => {
                  terria.selectedFeature = selectedFeature;
                });
              });
            }
          }
        }
      )
    );
  }

  renderFeatureInfoCatalogItems(
    catalogItems: MappableMixin.Instance[],
    featureMap: Map<string, TerriaFeature[]>
  ) {
    return catalogItems.map((catalogItem, _i) => {
      // From the pairs, select only those with this catalog item, and pull the features out of the pair objects.
      const features =
        (catalogItem.uniqueId
          ? featureMap.get(catalogItem.uniqueId)
          : undefined) ?? [];
      return (
        <FeatureInfoCatalogItem
          key={catalogItem.uniqueId}
          viewState={this.props.viewState}
          catalogItem={catalogItem}
          features={features}
          onToggleOpen={this.toggleOpenFeature}
          printView={this.props.printView}
        />
      );
    });
  }

  @action.bound
  close() {
    this.props.viewState.featureInfoPanelIsVisible = false;

    // give the close animation time to finish before unselecting, to avoid jumpiness
    setTimeout(
      action(() => {
        this.props.viewState.terria.pickedFeatures = undefined;
        this.props.viewState.terria.selectedFeature = undefined;
      }),
      200
    );
  }

  @action.bound
  toggleCollapsed() {
    this.props.viewState.featureInfoPanelIsCollapsed =
      !this.props.viewState.featureInfoPanelIsCollapsed;
  }

  @action.bound
  toggleOpenFeature(feature: TerriaFeature) {
    const terria = this.props.viewState.terria;
    if (feature === terria.selectedFeature) {
      terria.selectedFeature = undefined;
    } else {
      terria.selectedFeature = feature;
    }
  }

  getMessageForNoResults() {
    const { t } = this.props;
    if (this.props.viewState.terria.workbench.items.length > 0) {
      // feature info shows up becuase data has been added for the first time
      if (this.props.viewState.firstTimeAddingData) {
        runInAction(() => {
          this.props.viewState.firstTimeAddingData = false;
        });
        return t("featureInfo.clickMap");
      }
      // if clicking on somewhere that has no data
      return t("featureInfo.noDataAvailable");
    } else {
      return t("featureInfo.clickToAddData");
    }
  }

  addManualMarker(longitude: number, latitude: number) {
    const { t } = this.props;
    addMarker(this.props.viewState.terria, {
      name: t("featureInfo.userSelection"),
      location: {
        latitude: latitude,
        longitude: longitude
      }
    });
  }

  pinClicked(longitude: number, latitude: number) {
    if (!isMarkerVisible(this.props.viewState.terria)) {
      this.addManualMarker(longitude, latitude);
    } else {
      removeMarker(this.props.viewState.terria);
    }
  }

  // locationUpdated(longitude, latitude) {
  //   if (
  //     isDefined(latitude) &&
  //     isDefined(longitude) &&
  //     isMarkerVisible(this.props.viewState.terria)
  //   ) {
  //     removeMarker(this.props.viewState.terria);
  //     this.addManualMarker(longitude, latitude);
  //   }
  // }

  filterIntervalsByFeature(
    catalogItem: TimeFilterMixin.Instance,
    feature: TerriaFeature
  ) {
    try {
      catalogItem.setTimeFilterFeature(
        feature,
        this.props.viewState.terria.pickedFeatures?.providerCoords
      );
    } catch (e) {
      this.props.viewState.terria.raiseErrorToUser(e);
    }
  }

  generateGpxWaypoints(location: Cartographic): string {
    return `<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="runtracker">
      <metadata/>
      <wpt name="Location"
        lat="${CesiumMath.toDegrees(location.latitude)}"
        lon="${CesiumMath.toDegrees(location.longitude)}"
        ele="${location.height.toFixed(2)}">
      </wpt>
    </gpx>`;
  }

  downloadLocationAsGpx(locationGpx: string): void {
    const a = document.createElement("a");
    a.href = DataUri.make("xml", locationGpx) ?? "";
    a.download = "location.gpx";
    a.click();
  }

  renderLocationItem(cartesianPosition: Cartesian3) {
    const { t } = this.props;
    const cartographic =
      this.props.viewState.terria.pickedPosition ??
      Ellipsoid.WGS84.cartesianToCartographic(cartesianPosition);
    if (cartographic === undefined) {
      return null;
    }
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const pretty = prettifyCoordinates(longitude, latitude, {
      errorBar: undefined,
      digits: 6
    });
    // this.locationUpdated(longitude, latitude);

    const prettyHeight = this.props.viewState.terria.cesium
      ? this.props.viewState.terria.pickedPosition?.height
        ? `${this.props.viewState.terria.pickedPosition?.height.toFixed(1)}${t(
            "featureInfo.heightAboveSea"
          )}`
        : ""
      : "2D";

    const that = this;
    const pinClicked = function () {
      that.pinClicked(longitude, latitude);
    };

    /*const locationButtonStyle = isMarkerVisible(this.props.viewState.terria)
      ? Styles.btnLocationSelected
      : Styles.btnLocation;*/
    const downloadLocationAsGpx = () => {
      that.downloadLocationAsGpx(that.generateGpxWaypoints(cartographic));
    };

    return (
      /*<div className={Styles.location}>
        <span>Lat / Lon&nbsp;</span>
        <span>
          {pretty.latitude + ", " + pretty.longitude}
          {!this.props.printView && (
            <button
              type="button"
              onClick={pinClicked}
              className={locationButtonStyle}
            >
              <Icon glyph={Icon.GLYPHS.location} />
            </button>
          )}
        </span>
      </div>*/
      <div>
        {!!cartographic &&
          this.props.viewState.terria.configParameters.whereAmIParams &&
          this.whereAmI && (
            <WhereAmITranslated
              whereAmI={this.whereAmI}
              whereAmIDetailed={this.whereAmIDetailed}
              viewState={this.props.viewState}
            />
          )}
        {!!cartographic && (
          <div className={Styles.location}>
            <span>{t("featureInfo.elevation")}</span>
            <span>{prettyHeight}</span>
          </div>
        )}
        <div className={Styles.location}>
          Lat / Lon
          <span id="featureinfopanel">
            {pretty.latitude + ", " + pretty.longitude}
          </span>
        </div>
        <div className={Styles.location}>
          <span />
          {!this.props.printView && (
            <span>
              <Button
                primary
                title={t("featureInfo.copyButtonTooltip")}
                css={`
                  width: 14px;
                  border-radius: 2px;
                  margin: 2px;
                `}
                className={`btn-copy-featureinfopanel`}
                data-clipboard-target={`#featureinfopanel`}
              >
                <StyledIcon
                  light
                  realDark={false}
                  glyph={Icon.GLYPHS.copy}
                  styledWidth="16px"
                />
              </Button>
              <Button
                primary
                title={t("featureInfo.pinButtonTooltip")}
                onClick={pinClicked}
                css={`
                  width: 14px;
                  border-radius: 2px;
                  margin: 2px;
                  border-width: ${isMarkerVisible(this.props.viewState.terria)
                    ? "2px"
                    : "0px"};
                  border-color: red;
                `}
              >
                <StyledIcon
                  light
                  realDark={false}
                  glyph={Icon.GLYPHS.location}
                  styledWidth="16px"
                />
              </Button>
              <Button
                primary
                title={t("featureInfo.downloadButtonTooltip")}
                onClick={downloadLocationAsGpx}
                css={`
                  width: 14px;
                  border-radius: 2px;
                  margin: 2px;
                `}
              >
                <StyledIcon
                  light
                  realDark={false}
                  glyph={Icon.GLYPHS.downloadNew}
                  styledWidth="16px"
                />
              </Button>
            </span>
          )}
        </div>
        <StyledHr />
      </div>
    );
  }

  @action
  setWhereAmI = (
    whereAmI: string | undefined,
    whereAmIDetailed: string | undefined
  ) => {
    this.whereAmI = whereAmI;
    this.whereAmIDetailed = whereAmIDetailed;
  };

  @action
  setPicked(terria: Terria, position: Cartesian3 | undefined) {
    if (!position) return;
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
    if (!Cartographic.equals(terria.pickedPosition, cartographic)) {
      terria.currentViewer.mouseCoords.debounceAskWhereAmI(
        terria,
        cartographic,
        this.setWhereAmI
      );
      terria.pickedPosition = cartographic.clone();
    }
  }

  render() {
    const { t } = this.props;
    const terria = this.props.viewState.terria;
    const viewState = this.props.viewState;

    const { catalogItems, featureMap } = getFeatureMapByCatalogItems(
      this.props.viewState.terria
    );

    const featureInfoCatalogItems = this.renderFeatureInfoCatalogItems(
      catalogItems,
      featureMap
    );
    const panelClassName = classNames(Styles.panel, {
      [Styles.isCollapsed]: viewState.featureInfoPanelIsCollapsed,
      [Styles.isVisible]: viewState.featureInfoPanelIsVisible,
      [Styles.isTranslucent]: viewState.explorerPanelIsVisible
    });

    const filterableCatalogItems = catalogItems
      .filter(
        (catalogItem) =>
          TimeFilterMixin.isMixedInto(catalogItem) &&
          catalogItem.canFilterTimeByFeature
      )
      .map((catalogItem) => {
        const features =
          (catalogItem.uniqueId
            ? featureMap.get(catalogItem.uniqueId)
            : undefined) ?? [];
        return {
          catalogItem: catalogItem,
          feature: isDefined(features[0]) ? features[0] : undefined
        };
      })
      .filter((pair) => isDefined(pair.feature));

    // If the clock is available then use it, otherwise don't.
    const clock = terria.timelineClock?.currentTime;

    // If there is a selected feature then use the feature location.
    let position = terria.selectedFeature?.position?.getValue(clock);

    // If position is invalid then don't use it.
    // This seems to be fixing the symptom rather then the cause, but don't know what is the true cause this ATM.
    if (
      position === undefined ||
      isNaN(position.x) ||
      isNaN(position.y) ||
      isNaN(position.z)
    ) {
      position = undefined;
    }

    if (!isDefined(position)) {
      // Otherwise use the location picked.
      position = terria.pickedFeatures?.pickPosition;
    }

    const locationElements = position ? (
      <li>{this.renderLocationItem(position)}</li>
    ) : null;

    return (
      <DragWrapper>
        <div
          className={panelClassName}
          aria-hidden={!viewState.featureInfoPanelIsVisible}
        >
          {!this.props.printView && (
            <div className={Styles.header}>
              <div
                className={classNames("drag-handle", Styles.btnPanelHeading)}
              >
                <span>{t("featureInfo.panelHeading")}</span>
                <button
                  type="button"
                  onClick={this.toggleCollapsed}
                  className={Styles.btnToggleFeature}
                >
                  {this.props.viewState.featureInfoPanelIsCollapsed ? (
                    <Icon glyph={Icon.GLYPHS.closed} />
                  ) : (
                    <Icon glyph={Icon.GLYPHS.opened} />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={this.close}
                className={Styles.btnCloseFeature}
                title={t("featureInfo.btnCloseFeature")}
              >
                <Icon glyph={Icon.GLYPHS.close} />
              </button>
            </div>
          )}
          <ul className={Styles.body}>
            {/*this.props.printView &&*/ locationElements}

            {
              // Is feature info visible
              !viewState.featureInfoPanelIsCollapsed &&
              viewState.featureInfoPanelIsVisible ? (
                // Are picked features loading -> show Loader
                isDefined(terria.pickedFeatures) &&
                terria.pickedFeatures.isLoading ? (
                  <li>
                    <Loader light />
                  </li>
                ) : // Do we have no features/catalog items to show?

                featureInfoCatalogItems.length === 0 ? (
                  <li className={Styles.noResults}>
                    {this.getMessageForNoResults()}
                  </li>
                ) : (
                  // Finally show feature info
                  featureInfoCatalogItems
                )
              ) : null
            }

            {/*!this.props.printView && locationElements*/}
            {
              // Add "filter by location" buttons if supported
              filterableCatalogItems.map((pair) =>
                TimeFilterMixin.isMixedInto(pair.catalogItem) &&
                pair.feature ? (
                  <button
                    key={pair.catalogItem.uniqueId}
                    type="button"
                    onClick={this.filterIntervalsByFeature.bind(
                      this,
                      pair.catalogItem,
                      pair.feature
                    )}
                    className={Styles.satelliteSuggestionBtn}
                  >
                    {t("featureInfo.satelliteSuggestionBtn", {
                      catalogItemName: pair.catalogItem.name
                    })}
                  </button>
                ) : null
              )
            }
          </ul>
        </div>
      </DragWrapper>
    );
  }
}

interface IWhereAmIProps {
  whereAmI?: string;
  whereAmIDetailed?: string;
  viewState: ViewState;
  t: TFunction;
}

const WhereAmI: React.VoidFunctionComponent<IWhereAmIProps> = ({
  whereAmI,
  whereAmIDetailed,
  viewState,
  t
}) => {
  return (
    <>
      <div className={Styles.location}>
        <span>{t("featureInfo.whereAmI")}</span>
        <TextSpan small>{whereAmI}</TextSpan>
      </div>
      {whereAmIDetailed && (
        <div
          className={Styles.location}
          style={{ flexDirection: "row-reverse" }}
        >
          <Button
            primary
            onClick={() => {
              viewState.terria.notificationState.addNotificationToQueue({
                title: t("featureInfo.positionDetails"),
                message: whereAmIDetailed ?? ""
              });
            }}
            css={`
              display: flex;
              align-items: center;
              border-radius: 2px;
            `}
          >
            {t("featureInfo.details")}
          </Button>
        </div>
      )}
      <StyledHr />
    </>
  );
};

const WhereAmITranslated = withTranslation()(WhereAmI);

function getFeatureMapByCatalogItems(terria: Terria) {
  const featureMap = new Map<string, TerriaFeature[]>();
  const catalogItems = new Set<MappableMixin.Instance>(); // Will contain a list of all unique catalog items.

  if (!isDefined(terria.pickedFeatures)) {
    return { featureMap, catalogItems: Array.from(catalogItems) };
  }

  terria.pickedFeatures.features.forEach((feature) => {
    const catalogItem = determineCatalogItem(terria.workbench, feature);
    if (catalogItem?.uniqueId) {
      catalogItems.add(catalogItem);
      if (featureMap.has(catalogItem.uniqueId))
        featureMap.get(catalogItem.uniqueId)?.push(feature);
      else featureMap.set(catalogItem.uniqueId, [feature]);
    }
  });

  return { featureMap, catalogItems: Array.from(catalogItems) };
}

export function determineCatalogItem(
  workbench: Workbench,
  feature: TerriaFeature
) {
  if (
    MappableMixin.isMixedInto(feature._catalogItem) &&
    workbench.items.includes(feature._catalogItem)
  ) {
    return feature._catalogItem;
  }

  // Expand child members of composite catalog items.
  // This ensures features from each child model are treated as belonging to
  // that child model, not the parent composite model.
  const items = flatten(workbench.items.map(recurseIntoMembers)).filter(
    MappableMixin.isMixedInto
  );
  return items.find((item) => featureBelongsToCatalogItem(feature, item));
}

function recurseIntoMembers(catalogItem: BaseModel): BaseModel[] {
  if (catalogItem instanceof CompositeCatalogItem) {
    return flatten(catalogItem.memberModels.map(recurseIntoMembers));
  }
  return [catalogItem];
}

export { FeatureInfoPanel };
export default withTranslation()(withViewState(FeatureInfoPanel));
