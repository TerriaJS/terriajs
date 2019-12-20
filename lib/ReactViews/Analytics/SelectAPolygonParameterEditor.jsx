import CesiumMath from "terriajs-cesium/Source/Core/Math";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import featureDataToGeoJson from "../../Map/featureDataToGeoJson";
import GeoJsonCatalogItem from "../../Models/GeoJsonCatalogItem";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import MapInteractionMode from "../../Models/MapInteractionMode";
import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import PropTypes from "prop-types";
import Styles from "./parameter-editors.scss";
import when from "terriajs-cesium/Source/ThirdParty/when";
import createReactClass from "create-react-class";
import { withTranslation } from "react-i18next";

const SelectAPolygonParameterEditor = createReactClass({
  mixins: [ObserveModelMixin],

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
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
    const { t } = this.props;
    return (
      <div>
        <input className={Styles.field} type="text" value={this.state.value} />
        <button
          type="button"
          onClick={this.selectExistingPolygonOnMap}
          className={Styles.btnSelector}
        >
          {t("analytics.selectExistingPolygon")}
        </button>
      </div>
    );
  }
});

/**
 * Prompts the user to select a point on the map.
 */
export function selectOnMap(terria, viewState, parameter) {
  // Cancel any feature picking already in progress.
  terria.pickedFeatures = undefined;

  const pickPolygonMode = new MapInteractionMode({
    message:
      '<div>Select existing polygon<div style="font-size:12px"><p><i>If there are no polygons to select, add a layer that provides polygons.</i></p></div></div>',
    onCancel: function() {
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
    }
  });
  terria.mapInteractionModeStack.push(pickPolygonMode);

  knockout
    .getObservable(pickPolygonMode, "pickedFeatures")
    .subscribe(function(pickedFeatures) {
      when(pickedFeatures.allFeaturesAvailablePromise, function() {
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
                properties: feature.properties,
                geometry: {
                  coordinates: [[positions]],
                  type: "MultiPolygon"
                }
              };
            }

            if (defined(geojson)) {
              const catalogItem = new GeoJsonCatalogItem(terria);
              catalogItem.data = geojson;
              return catalogItem;
            }
          })
          .filter(item => defined(item));
        const promises = catalogItems.map(item => item.load());
        return when.all(promises).then(() => catalogItems);
      }).then(function(catalogItems) {
        parameter.value = catalogItems.map(item => item._readyData);
        terria.mapInteractionModeStack.pop();
        viewState.openAddData();
      });
    });

  viewState.explorerPanelIsVisible = false;
}

export function getDisplayValue(value) {
  if (!defined(value) || value === "") {
    return "";
  }
  return value
    .map(function(featureData) {
      return featureData.id;
    })
    .join(", ");
}

export default withTranslation()(SelectAPolygonParameterEditor);
