"use strict";

const CesiumMath = require("terriajs-cesium/Source/Core/Math");
// const ConsoleAnalytics = require("../../Core/ConsoleAnalytics");
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
// import Terria from "../../Models/Terria";
import TerriaViewer from "../../ViewModels/TerriaViewer";
const ViewerMode = require("../../Models/ViewerMode");
const when = require("terriajs-cesium/Source/ThirdParty/when");
import classNames from "classnames";

import Styles from "./data-preview-map.scss";
import GeoJsonCatalogItem from "../../Models/GeoJsonCatalogItem";
import CommonStrata from "../../Models/CommonStrata";
import { observer } from "mobx-react";
import Terria from "../../Models/Terria";
import Mappable from "../../Models/Mappable";
import { observable, runInAction, computed, trace, autorun } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";

/

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

  static propTypes = {
    terria: PropTypes.object.isRequired,
    previewed: PropTypes.object,
    showMap: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      previewBadgeText: "PREVIEW LOADING..."
    };
    this.container = undefined;
    this.containerRef = container => {
      if (container === null) {
        this.previewViewer._attached && this.previewViewer.detach();
      } else {
        this.initPreview(container);
      }
    };
    this.previewViewer = new TerriaViewer(
      this.props.terria,
      computed(() => {
        const l = filterOutUndefined([this.props.previewed]);
        console.log(`Previewing ${l[0] && l[0].name}`);
        return l;
      })
    );
    autorun(() => {
      console.log(
        `Changed preview map viewer mode to ${this.previewViewer.viewerMode}`
      );
    });
    runInAction(() => {
      this.previewViewer.viewerMode = "leaflet";
    });
    // Not yet implemented
    // previewViewer.hideTerriaLogo = true;
    // previewViewer.homeView = terria.homeView;
    // previewViewer.initialView = terria.homeView;
  }

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
    if (this.previewViewer._attached) {
      this.previewViewer.detach();
    }
    this.previewViewer.attach(container);

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
  }

  componentWillUnmount() {
    this.previewViewer.detach();

    if (this._unsubscribeErrorHandler) {
      this._unsubscribeErrorHandler();
      this._unsubscribeErrorHandler = undefined;
    }
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

        <label className={Styles.badge}>{this.state.previewBadgeText}</label>
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

//   updateBoundingRectangle(catalogItem) {
//     if (defined(this.rectangleCatalogItem)) {
//       this.rectangleCatalogItem.isEnabled = false;
//       this.rectangleCatalogItem = undefined;
//     }

//     catalogItem = defaultValue(catalogItem.nowViewingCatalogItem, catalogItem);

//     if (!defined(catalogItem) || !defined(catalogItem.rectangle)) {
//       return;
//     }

//     let west = catalogItem.rectangle.west;
//     let south = catalogItem.rectangle.south;
//     let east = catalogItem.rectangle.east;
//     let north = catalogItem.rectangle.north;

//     if (!this.isZoomedToExtent) {
//       // When zoomed out, make sure the dataset rectangle is at least 5% of the width and height
//       // the home view, so that it is actually visible.
//       const minimumFraction = 0.05;
//       const homeView = this.terriaPreview.homeView.rectangle;

//       const minimumWidth = (homeView.east - homeView.west) * minimumFraction;
//       if (east - west < minimumWidth) {
//         const center = (east + west) * 0.5;
//         west = center - minimumWidth * 0.5;
//         east = center + minimumWidth * 0.5;
//       }

//       const minimumHeight = (homeView.north - homeView.south) * minimumFraction;
//       if (north - south < minimumHeight) {
//         const center = (north + south) * 0.5;
//         south = center - minimumHeight * 0.5;
//         north = center + minimumHeight * 0.5;
//       }
//     }

//     west = CesiumMath.toDegrees(west);
//     south = CesiumMath.toDegrees(south);
//     east = CesiumMath.toDegrees(east);
//     north = CesiumMath.toDegrees(north);

//     this.rectangleCatalogItem = new GeoJsonCatalogItem(
//       "_preview-data-extent",
//       this.terria
//     );
//     this.rectangleCatalogItem.setTrait(CommonStrata.user, "geoJsonData", {
//       type: "FeatureCollection",
//       features: [
//         {
//           type: "Feature",
//           properties: {
//             stroke: "#08ABD5",
//             "stroke-width": 2,
//             "stroke-opacity": 1,
//             fill: "#555555",
//             "fill-opacity": 0
//           },
//           geometry: {
//             type: "Polygon",
//             coordinates: [
//               [
//                 [west, south],
//                 [west, north],
//                 [east, north],
//                 [east, south],
//                 [west, south]
//               ]
//             ]
//           }
//         }
//       ]
//     });
//     this.previewViewer.workbench.push(this.rectangleCatalogItem);
//     this.rectangleCatalogItem.isEnabled = true;
//   },

//   mapIsReady(mapContainer) {
//     if (mapContainer) {
//       this.mapElement = mapContainer;

//       if (this.props.showMap) {
//         this.initMap(this.props.previewedCatalogItem);
//       }
//     }
//   },

//   destroyPreviewMap() {
//     this.terriaViewer && this.terriaViewer.destroy();
//     if (this.mapElement) {
//       this.mapElement.innerHTML = "";
//     }
//   },

//   initMap(previewedCatalogItem) {
//     if (this.mapElement) {
//       this.terriaViewer = TerriaViewer.create(this.terriaPreview, {
//         mapContainer: this.mapElement
//       });

//       // disable preview map interaction
//       const map = this.terriaViewer.terria.leaflet.map;
//       map.touchZoom.disable();
//       map.doubleClickZoom.disable();
//       map.scrollWheelZoom.disable();
//       map.boxZoom.disable();
//       map.keyboard.disable();
//       map.dragging.disable();

//       this.updatePreview(previewedCatalogItem);
//     }
//   }
// };
