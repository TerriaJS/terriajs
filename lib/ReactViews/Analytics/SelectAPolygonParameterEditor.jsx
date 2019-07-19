import createReactClass from "create-react-class";
import { reaction } from "mobx";
import PropTypes from "prop-types";
import React from "react";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import when from "terriajs-cesium/Source/ThirdParty/when";
import featureDataToGeoJson from "../../Map/featureDataToGeoJson";
import CommonStrata from "../../Models/CommonStrata";
import GeoJsonCatalogItem from "../../Models/GeoJsonCatalogItem";
import MapInteractionMode from "../../Models/MapInteractionMode";
import Styles from "./parameter-editors.scss";

const SelectAPolygonParameterEditor = createReactClass({
  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object
  },

  setDisplayValue(e) {
    SelectAPolygonParameterEditor.setDisplayValue(e, this.props.parameter);
  },

  selectExistingPolygonOnMap() {
    this.selectAPolygonParameterEditorCore.selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter
    );
  },

  render() {
    return (
      <div>
        <input className={Styles.field} type="text" value={this.state.value} />
        <button
          type="button"
          onClick={this.selectExistingPolygonOnMap}
          className={Styles.btnSelector}
        >
          Select existing polygon
        </button>
      </div>
    );
  }
});

/**
 * Prompts the user to select a point on the map.
 */
SelectAPolygonParameterEditor.selectOnMap = function(
  terria,
  viewState,
  parameter
) {
  // Cancel any feature picking already in progress.
  terria.pickedFeatures = undefined;

  let pickedFeaturesSubscription;
  const pickPolygonMode = new MapInteractionMode({
    message:
      '<div>Select existing polygon<div style="font-size:12px"><p><i>If there are no polygons to select, add a layer that provides polygons.</i></p></div></div>',
    onCancel: function() {
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
      if (pickedFeaturesSubscription) {
        pickedFeaturesSubscription.dispose();
      }
    }
  });
  terria.mapInteractionModeStack.push(pickPolygonMode);

  reaction(
    () => pickPolygonMode.pickedFeatures,
    (pickedFeatures, reaction) => {
      pickedFeaturesSubscription = reaction;
      (pickedFeatures.allFeaturesAvailablePromise || Promise.resolve())
        .then(function() {
          if (!defined(pickedFeatures.pickPosition)) {
            return [];
          }

          const catalogItems = pickedFeatures.features
            .map(function(feature) {
              let geojson;
              if (feature.data) {
                geojson = featureDataToGeoJson(feature.data);
                if (
                  defined(geojson) &&
                  !defined(geojson.id) &&
                  defined(feature.id)
                ) {
                  geojson.id = feature.id;
                }
              } else if (defined(feature.polygon)) {
                const positions = feature.polygon.hierarchy
                  .getValue()
                  .positions.map(function(position) {
                    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
                      position
                    );
                    return [
                      CesiumMath.toDegrees(cartographic.longitude),
                      CesiumMath.toDegrees(cartographic.latitude)
                    ];
                  });

                geojson = {
                  id: feature.id,
                  type: "Feature",
                  properties: feature.properties.getValue(terria.timelineClock),
                  geometry: {
                    coordinates: [[positions]],
                    type: "MultiPolygon"
                  }
                };
              }

              if (defined(geojson)) {
                const catalogItem = new GeoJsonCatalogItem(
                  createGuid(),
                  terria
                );
                catalogItem.setTrait(CommonStrata.user, "geoJsonData", geojson);
                return catalogItem;
              }
            })
            .filter(item => defined(item));
          const promises = catalogItems.map(item => item.loadMapItems());
          return when.all(promises).then(() => catalogItems);
        })
        .then(function(catalogItems) {
          parameter.value = catalogItems.map(item => item.readyData);
          terria.mapInteractionModeStack.pop();
          viewState.openAddData();
          if (pickedFeaturesSubscription) {
            pickedFeaturesSubscription.dispose();
          }
        });
    }
  );

  viewState.explorerPanelIsVisible = false;
};

SelectAPolygonParameterEditor.getDisplayValue = function(value) {
  if (!defined(value) || value === "") {
    return "";
  }
  return value
    .map(function(featureData) {
      return featureData.id;
    })
    .join(", ");
};

module.exports = SelectAPolygonParameterEditor;
