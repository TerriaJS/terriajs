"use strict";

import classNames from "classnames";
import { autorun, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../../Core/filterOutUndefined";
import CommonStrata from "../../Models/CommonStrata";
import GeoJsonCatalogItem from "../../Models/GeoJsonCatalogItem";
import Mappable from "../../Models/Mappable";
import Terria from "../../Models/Terria";
import TerriaViewer from "../../ViewModels/TerriaViewer";
import Styles from "./data-preview-map.scss";

/**
 * Leaflet-based preview map that sits within the preview.
 */

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {Mappable} previewed
 * @prop {boolean} showMap
 *
 */

/**
 *
 * @extends {React.Component<Props>}
 */
@observer
class DataPreviewMap extends React.Component {
  @observable
  isZoomedToExtent = false;

  /**
   * @type {TerriaViewer}
   * @readonly
   */
  previewViewer;

  /**
   * @type {string}
   */
  @observable
  previewBadgeText = "";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    previewed: PropTypes.object,
    showMap: PropTypes.bool
  };

  constructor(props) {
    super(props);

    /**
     * @param {HTMLElement | null} container
     */
    this.containerRef = container => {
      if (container === null) {
        this.previewViewer.attached && this.previewViewer.detach();
      } else {
        this.initPreview(container);
      }
    };
    this.previewViewer = new TerriaViewer(
      this.props.terria,
      computed(() => {
        // Can previewed be undefined?
        return filterOutUndefined([
          this.props.previewed,
          this.boundingRectangleCatalogItem
        ]);
      })
    );
    autorun(() => {
      if (this.props.showMap && this.props.previewed !== undefined) {
        this.previewBadgeText = "PREVIEW LOADING...";
        this.props.previewed.loadMapItems().then(() => {
          this.previewBadgeText = "DATA PREVIEW";
        });
      }
    });
    runInAction(() => {
      this.previewViewer.viewerMode = "leaflet";
    });
    // Not yet implemented
    // previewViewer.hideTerriaLogo = true;
    // previewViewer.homeView = terria.homeView;
    // previewViewer.initialView = terria.homeView;
  }

  /**
   * @param {HTMLElement} container
   */
  initPreview(container) {
    console.log(
      "Initialising preview map. This might be expensive, so this should only show up when the preview map disappears and reappears"
    );
    runInAction(() => {
      // Change this to choose positron if it's available
      if (this.previewViewer.baseMap === undefined) {
        this.previewViewer.baseMap =
          this.props.terria.baseMaps.length > 0
            ? this.props.terria.baseMaps[0].mappable
            : undefined;
      }
    });
    if (this.previewViewer.attached) {
      this.previewViewer.detach();
    }
    this.previewViewer.attach(container);

    // Implement zooming to extent on click
    // Have to disable map interactions first
    this.isZoomedToExtent = false;
    // Following 2 shouldn't be needed in new architecture
    // this.lastPreviewedCatalogItem = undefined;
    // this.removePreviewFromMap = undefined;

    // this._unsubscribeErrorHandler = this.terriaPreview.error.addEventListener(
    //   e => {
    //     if (
    //       e.sender === this.props.previewedCatalogItem ||
    //       (e.sender &&
    //         e.sender.nowViewingCatalogItem ===
    //           this.props.previewedCatalogItem)
    //     ) {
    //       this._errorPreviewingCatalogItem = true;
    //       this.setState({
    //         previewBadgeText: "NO PREVIEW AVAILABLE"
    //       });
    //     }
    //   }
    // );

    //       // disable preview map interaction
    //       const map = this.terriaViewer.terria.leaflet.map;
    //       map.touchZoom.disable();
    //       map.doubleClickZoom.disable();
    //       map.scrollWheelZoom.disable();
    //       map.boxZoom.disable();
    //       map.keyboard.disable();
    //       map.dragging.disable();
  }

  componentWillUnmount() {
    this.previewViewer.detach();

    if (this._unsubscribeErrorHandler) {
      this._unsubscribeErrorHandler();
      this._unsubscribeErrorHandler = undefined;
    }
  }

  @computed
  get boundingRectangleCatalogItem() {
    if (this.props.previewed.rectangle === undefined) {
      return undefined;
    }

    let west = this.props.previewed.rectangle.west;
    let south = this.props.previewed.rectangle.south;
    let east = this.props.previewed.rectangle.east;
    let north = this.props.previewed.rectangle.north;

    if (!this.isZoomedToExtent) {
      // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
      // the home view, so that it is actually visible.
      const minimumFraction = 0.05;
      const homeView = this.previewViewer.defaultExtent;
      const minimumWidth =
        CesiumMath.toDegrees(homeView.width) * minimumFraction;
      if (east - west < minimumWidth) {
        const center = (east + west) * 0.5;
        west = center - minimumWidth * 0.5;
        east = center + minimumWidth * 0.5;
      }

      const minimumHeight =
        CesiumMath.toDegrees(homeView.height) * minimumFraction;
      if (north - south < minimumHeight) {
        const center = (north + south) * 0.5;
        south = center - minimumHeight * 0.5;
        north = center + minimumHeight * 0.5;
      }
    }

    const rectangleCatalogItem = new GeoJsonCatalogItem(
      "__preview-data-extent",
      this.props.terria
    );
    rectangleCatalogItem.setTrait(CommonStrata.user, "geoJsonData", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            stroke: "#08ABD5",
            "stroke-width": 2,
            "stroke-opacity": 1,
            fill: "#555555",
            "fill-opacity": 0
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [west, south],
                [west, north],
                [east, north],
                [east, south],
                [west, south]
              ]
            ]
          }
        }
      ]
    });
    rectangleCatalogItem.loadMapItems();
    return rectangleCatalogItem;
  }

  render() {
    return (
      <div className={Styles.map} onClick={this.clickMap}>
        <Choose>
          <When condition={this.props.showMap}>
            <div
              className={classNames(Styles.terriaPreview)}
              ref={this.containerRef}
            />
          </When>
          <Otherwise>
            <div
              className={classNames(Styles.terriaPreview, Styles.placeholder)}
            />
          </Otherwise>
        </Choose>

        <label className={Styles.badge}>{this.previewBadgeText}</label>
      </div>
    );
  }
}

export default DataPreviewMap;

// Unported code

//   componentWillUnmount() {
//     this.destroyPreviewMap();

//     if (this._unsubscribeErrorHandler) {
//       this._unsubscribeErrorHandler();
//       this._unsubscribeErrorHandler = undefined;
//     }
//   },

//   /* eslint-disable-next-line camelcase */
//   UNSAFE_componentWillReceiveProps(newProps) {
//     if (newProps.showMap && !this.props.showMap) {
//       this.initMap(newProps.previewedCatalogItem);
//     } else {
//       this.updatePreview(newProps.previewedCatalogItem);
//     }
//   },

//   updatePreview(previewedCatalogItem) {
//     if (this.lastPreviewedCatalogItem === previewedCatalogItem) {
//       return;
//     }

//     if (previewedCatalogItem) {
//       this.props.terria.analytics.logEvent(
//         "dataSource",
//         "preview",
//         previewedCatalogItem.name
//       );
//     }

//     this.lastPreviewedCatalogItem = previewedCatalogItem;

//     this.setState({
//       previewBadgeText: "DATA PREVIEW LOADING..."
//     });

//     this.isZoomedToExtent = false;
//     this.terriaPreview.currentViewer.zoomTo(this.terriaPreview.homeView);

//     if (defined(this.removePreviewFromMap)) {
//       this.removePreviewFromMap();
//       this.removePreviewFromMap = undefined;
//     }

//     if (defined(this.rectangleCatalogItem)) {
//       this.rectangleCatalogItem.isEnabled = false;
//     }

//     const previewed = previewedCatalogItem;
//     if (previewed && defined(previewed.type) && previewed.isMappable) {
//       const that = this;
//       return when(previewed.load())
//         .then(() => {
//           // If this item has a separate now viewing item, load it before continuing.
//           let nowViewingItem;
//           let loadNowViewingItemPromise;
//           if (defined(previewed.nowViewingCatalogItem)) {
//             nowViewingItem = previewed.nowViewingCatalogItem;
//             loadNowViewingItemPromise = when(nowViewingItem.load());
//           } else {
//             nowViewingItem = previewed;
//             loadNowViewingItemPromise = when();
//           }

//           return loadNowViewingItemPromise.then(() => {
//             // Now that the item is loaded, add it to the map.
//             // Unless we've started previewing something else in the meantime!
//             if (
//               !that._unsubscribeErrorHandler ||
//               previewed !== that.lastPreviewedCatalogItem
//             ) {
//               return;
//             }

//             if (defined(nowViewingItem.showOnSeparateMap)) {
//               if (
//                 defined(nowViewingItem.clock) &&
//                 defined(nowViewingItem.clock.currentTime)
//               ) {
//                 that.terriaPreview.clock.currentTime =
//                   nowViewingItem.clock.currentTime;
//               }

//               this._errorPreviewingCatalogItem = false;
//               that.removePreviewFromMap = nowViewingItem.showOnSeparateMap(
//                 that.terriaPreview.currentViewer
//               );

//               if (this._errorPreviewingCatalogItem) {
//                 this.setState({
//                   previewBadgeText: "NO PREVIEW AVAILABLE"
//                 });
//               } else if (that.removePreviewFromMap) {
//                 this.setState({
//                   previewBadgeText: "DATA PREVIEW"
//                 });
//               } else {
//                 this.setState({
//                   previewBadgeText: "NO PREVIEW AVAILABLE"
//                 });
//               }
//             } else {
//               this.setState({
//                 previewBadgeText: "NO PREVIEW AVAILABLE"
//               });
//             }

//             that.updateBoundingRectangle(previewed);
//           });
//         })
//         .otherwise(err => {
//           console.error(err);

//           this.setState({
//             previewBadgeText: "DATA PREVIEW ERROR"
//           });
//         });
//     }
//   },

//   clickMap() {
//     if (!defined(this.props.previewedCatalogItem)) {
//       return;
//     }

//     this.isZoomedToExtent = !this.isZoomedToExtent;

//     if (this.isZoomedToExtent) {
//       const catalogItem = defaultValue(
//         this.props.previewedCatalogItem.nowViewingCatalogItem,
//         this.props.previewedCatalogItem
//       );
//       if (defined(catalogItem.rectangle)) {
//         this.terriaPreview.currentViewer.zoomTo(catalogItem.rectangle);
//       }
//     } else {
//       this.terriaPreview.currentViewer.zoomTo(this.terriaPreview.homeView);
//     }

//     this.updateBoundingRectangle(this.props.previewedCatalogItem);
//   },
