"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import FeatureInfoCatalogItem from "./FeatureInfoCatalogItem.jsx";
import DragWrapper from "../DragWrapper.jsx";
import Loader from "../Loader.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import i18next from "i18next";
import { withTranslation } from "react-i18next";
import Icon from "../Icon.jsx";
import {
  LOCATION_MARKER_DATA_SOURCE_NAME,
  addMarker,
  removeMarker,
  markerVisible
} from "../../Models/LocationMarkerUtils";
import prettifyCoordinates from "../../Map/prettifyCoordinates";
import raiseErrorToUser from "../../Models/raiseErrorToUser";

import Styles from "./feature-info-panel.scss";
import classNames from "classnames";

export const FeatureInfoPanel = createReactClass({
  displayName: "FeatureInfoPanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    printView: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  ref: null,

  getInitialState() {
    return {
      left: null,
      right: null,
      top: null,
      bottom: null
    };
  },

  componentDidMount() {
    const { t } = this.props;
    const createFakeSelectedFeatureDuringPicking = true;
    const terria = this.props.terria;
    this._pickedFeaturesSubscription = knockout
      .getObservable(terria, "pickedFeatures")
      .subscribe(() => {
        const pickedFeatures = terria.pickedFeatures;
        if (!defined(pickedFeatures)) {
          terria.selectedFeature = undefined;
        } else {
          if (createFakeSelectedFeatureDuringPicking) {
            const fakeFeature = new Entity({
              id: t("featureInfo.pickLocation")
            });
            fakeFeature.position = pickedFeatures.pickPosition;
            terria.selectedFeature = fakeFeature;
          } else {
            terria.selectedFeature = undefined;
          }
          if (defined(pickedFeatures.allFeaturesAvailablePromise)) {
            pickedFeatures.allFeaturesAvailablePromise.then(() => {
              if (this.props.viewState.featureInfoPanelIsVisible === false) {
                // Panel is closed, refrain from setting selectedFeature
                return;
              }

              // We only show features that are associated with a catalog item, so make sure the one we select to be
              // open initially is one we're actually going to show.
              const featuresShownAtAll = pickedFeatures.features.filter(x =>
                defined(determineCatalogItem(terria.nowViewing, x))
              );
              terria.selectedFeature = featuresShownAtAll.filter(
                featureHasInfo
              )[0];
              if (
                !defined(terria.selectedFeature) &&
                featuresShownAtAll.length > 0
              ) {
                // Handles the case when no features have info - still want something to be open.
                terria.selectedFeature = featuresShownAtAll[0];
              }
            });
          }
        }
      });
  },

  componentWillUnmount() {
    if (defined(this._pickedFeaturesSubscription)) {
      this._pickedFeaturesSubscription.dispose();
      this._pickedFeaturesSubscription = undefined;
    }
  },

  renderFeatureInfoCatalogItems(catalogItems, featureCatalogItemPairs) {
    return catalogItems
      .filter(catalogItem => defined(catalogItem))
      .map((catalogItem, i) => {
        // From the pairs, select only those with this catalog item, and pull the features out of the pair objects.
        const features = featureCatalogItemPairs
          .filter(pair => pair.catalogItem === catalogItem)
          .map(pair => pair.feature);
        return (
          <FeatureInfoCatalogItem
            key={i}
            viewState={this.props.viewState}
            catalogItem={catalogItem}
            features={features}
            terria={this.props.terria}
            onToggleOpen={this.toggleOpenFeature}
            printView={this.props.printView}
          />
        );
      });
  },

  close() {
    this.props.viewState.featureInfoPanelIsVisible = false;

    // give the close animation time to finish before unselecting, to avoid jumpiness
    setTimeout(() => {
      this.props.terria.pickedFeatures = undefined;
      this.props.terria.selectedFeature = undefined;
    }, 200);
  },

  toggleCollapsed(event) {
    this.props.viewState.featureInfoPanelIsCollapsed = !this.props.viewState
      .featureInfoPanelIsCollapsed;
  },

  toggleOpenFeature(feature) {
    const terria = this.props.terria;
    if (feature === terria.selectedFeature) {
      terria.selectedFeature = undefined;
    } else {
      terria.selectedFeature = feature;
    }
  },

  getMessageForNoResults() {
    const { t } = this.props;
    if (this.props.terria.nowViewing.hasItems) {
      // feature info shows up becuase data has been added for the first time
      if (this.props.viewState.firstTimeAddingData) {
        this.props.viewState.firstTimeAddingData = false;
        return t("featureInfo.clickMap");
      }
      // if clicking on somewhere that has no data
      return t("featureInfo.noDataAvailable");
    } else {
      return t("featureInfo.clickToAddData");
    }
  },

  addManualMarker(longitude, latitude) {
    const { t } = this.props;
    addMarker(this.props.terria, {
      name: t("featureInfo.userSelection"),
      location: {
        latitude: latitude,
        longitude: longitude
      }
    });
  },

  pinClicked(longitude, latitude) {
    if (!markerVisible(this.props.terria)) {
      this.addManualMarker(longitude, latitude);
    } else {
      removeMarker(this.props.terria);
    }
  },

  locationUpdated(longitude, latitude) {
    if (
      defined(latitude) &&
      defined(longitude) &&
      markerVisible(this.props.terria)
    ) {
      removeMarker(this.props.terria);
      this.addManualMarker(longitude, latitude);
    }
  },

  filterIntervalsByFeature(catalogItem, feature) {
    try {
      catalogItem.filterIntervalsByFeature(
        feature,
        this.props.terria.pickedFeatures
      );
    } catch (e) {
      raiseErrorToUser(this.props.terria, e);
    }
  },

  renderLocationItem(cartesianPosition) {
    const catographic = Ellipsoid.WGS84.cartesianToCartographic(
      cartesianPosition
    );
    const latitude = CesiumMath.toDegrees(catographic.latitude);
    const longitude = CesiumMath.toDegrees(catographic.longitude);
    const pretty = prettifyCoordinates(longitude, latitude);
    this.locationUpdated(longitude, latitude);

    const that = this;
    const pinClicked = function() {
      that.pinClicked(longitude, latitude);
    };

    const locationButtonStyle = markerVisible(this.props.terria)
      ? Styles.btnLocationSelected
      : Styles.btnLocation;

    return (
      <div className={Styles.location}>
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
      </div>
    );
  },

  render() {
    const { t } = this.props;
    const terria = this.props.terria;
    const viewState = this.props.viewState;

    const {
      catalogItems,
      featureCatalogItemPairs
    } = getFeaturesGroupedByCatalogItems(this.props.terria);
    const featureInfoCatalogItems = this.renderFeatureInfoCatalogItems(
      catalogItems,
      featureCatalogItemPairs
    );
    const panelClassName = classNames(Styles.panel, {
      [Styles.isCollapsed]: viewState.featureInfoPanelIsCollapsed,
      [Styles.isVisible]: viewState.featureInfoPanelIsVisible,
      [Styles.isTranslucent]: viewState.explorerPanelIsVisible
    });

    const filterableCatalogItems = catalogItems
      .filter(
        catalogItem =>
          defined(catalogItem) && catalogItem.canFilterIntervalsByFeature
      )
      .map(catalogItem => {
        const features = featureCatalogItemPairs.filter(
          pair => pair.catalogItem === catalogItem
        );
        return {
          catalogItem: catalogItem,
          feature: defined(features[0]) ? features[0].feature : undefined
        };
      })
      .filter(pair => defined(pair.feature));

    let position;
    if (
      defined(terria.selectedFeature) &&
      defined(terria.selectedFeature.position)
    ) {
      // If the clock is avaliable then use it, otherwise don't.
      let clock;
      if (defined(terria.clock)) {
        clock = terria.clock.currentTime;
      }

      // If there is a selected feature then use the feature location.
      position = terria.selectedFeature.position.getValue(clock);

      // If position is invalid then don't use it.
      // This seems to be fixing the symptom rather then the cause, but don't know what is the true cause this ATM.
      if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        position = undefined;
      }
    }
    if (!defined(position)) {
      // Otherwise use the location picked.
      if (
        defined(terria.pickedFeatures) &&
        defined(terria.pickedFeatures.pickPosition)
      ) {
        position = terria.pickedFeatures.pickPosition;
      }
    }

    const locationElements = (
      <If condition={position}>
        <li>{this.renderLocationItem(position)}</li>
      </If>
    );
    this.ref = React.createRef();
    return (
      <DragWrapper ref={this.ref}>
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
            {this.props.printView && locationElements}
            <Choose>
              <When
                condition={
                  viewState.featureInfoPanelIsCollapsed ||
                  !viewState.featureInfoPanelIsVisible
                }
              />
              <When
                condition={
                  defined(terria.pickedFeatures) &&
                  terria.pickedFeatures.isLoading
                }
              >
                <li>
                  <Loader />
                </li>
              </When>
              <When
                condition={
                  !featureInfoCatalogItems ||
                  featureInfoCatalogItems.length === 0
                }
              >
                <li className={Styles.noResults}>
                  {this.getMessageForNoResults()}
                </li>
              </When>
              <Otherwise>{featureInfoCatalogItems}</Otherwise>
            </Choose>
            {!this.props.printView && locationElements}
            {filterableCatalogItems.map(pair => (
              <button
                key={pair.catalogItem.id}
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
            ))}
          </ul>
        </div>
      </DragWrapper>
    );
  }
});

/**
 * Returns an object of {catalogItems, featureCatalogItemPairs}.
 */
function getFeaturesGroupedByCatalogItems(terria) {
  if (!defined(terria.pickedFeatures)) {
    return { catalogItems: [], featureCatalogItemPairs: [] };
  }
  const features = terria.pickedFeatures.features;
  const featureCatalogItemPairs = []; // Will contain objects of {feature, catalogItem}.
  const catalogItems = []; // Will contain a list of all unique catalog items.

  features.forEach(feature => {
    // Why was this here? Surely changing the feature objects is not a good side-effect?
    // if (!defined(feature.position)) {
    //     feature.position = terria.pickedFeatures.pickPosition;
    // }
    const catalogItem = determineCatalogItem(terria.nowViewing, feature);
    featureCatalogItemPairs.push({
      catalogItem: catalogItem,
      feature: feature
    });
    if (catalogItems.indexOf(catalogItem) === -1) {
      // Note this works for undefined too.
      catalogItems.push(catalogItem);
    }
  });

  return { catalogItems, featureCatalogItemPairs };
}

/**
 * Figures out what the catalog item for a feature is.
 *
 * @param nowViewing {@link NowViewing} to look in the items for.
 * @param feature Feature to match
 * @returns {CatalogItem}
 */
function determineCatalogItem(nowViewing, feature) {
  if (!defined(nowViewing)) {
    // So that specs do not need to define a nowViewing.
    return undefined;
  }

  if (feature._catalogItem) {
    return feature._catalogItem;
  }

  // "Data sources" (eg. czml, geojson, kml, csv) have an entity collection defined on the entity
  // (and therefore the feature).
  // Then match up the data source on the feature with a now-viewing item's data source.
  //
  // Gpx, Ogr, WebFeatureServiceCatalogItem, ArcGisFeatureServerCatalogItem, WebProcessingServiceCatalogItem
  // all have a this._geoJsonItem, which we also need to check.
  let result;
  let i;
  let item;
  if (
    defined(feature.entityCollection) &&
    defined(feature.entityCollection.owner)
  ) {
    const dataSource = feature.entityCollection.owner;

    if (dataSource.name === LOCATION_MARKER_DATA_SOURCE_NAME) {
      return {
        name: i18next.t("featureInfo.locationMarker")
      };
    }

    for (i = nowViewing.items.length - 1; i >= 0; i--) {
      item = nowViewing.items[i];
      if (item.dataSource === dataSource) {
        result = item;
        break;
      }
    }
    return result;
  }

  // If there is no data source, but there is an imagery layer (eg. ArcGIS),
  // we can match up the imagery layer on the feature with a now-viewing item.
  if (defined(feature.imageryLayer)) {
    const imageryLayer = feature.imageryLayer;
    for (i = nowViewing.items.length - 1; i >= 0; i--) {
      if (nowViewing.items[i].imageryLayer === imageryLayer) {
        result = nowViewing.items[i];
        break;
      }
    }
    return result;
  }
}

/**
 * Determines whether the passed feature has properties or a description.
 */
function featureHasInfo(feature) {
  return defined(feature.properties) || defined(feature.description);
}

export default withTranslation()(FeatureInfoPanel);
