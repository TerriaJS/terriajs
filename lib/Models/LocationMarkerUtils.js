import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import defined from "terriajs-cesium/Source/Core/defined";
import Entity from "terriajs-cesium/Source/DataSources/Entity.js";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";
import sampleTerrain from "terriajs-cesium/Source/Core/sampleTerrain";
import prettifyCoordinates from "../Map/prettifyCoordinates";
var i18next = require("i18next").default;

import markerIcon from "../../wwwroot/images/map-pin.png";

const LOCATION_MARKER_DATA_SOURCE_NAME = "TerriaJS Location Marker Points";

/**
 * Adds a location marker to the map with the position supplied in the result, adding a data source to terria if one hasn't
 * already been added, and removing all previously added markers in that data source. This data source is stored in
 * terria.locationMarker.
 */
export function addMarker(terria, result) {
  if (!terria.locationMarker) {
    terria.locationMarker = new CustomDataSource(
      LOCATION_MARKER_DATA_SOURCE_NAME
    );
  }

  if (!terria.dataSources.contains(terria.locationMarker)) {
    terria.dataSources.add(terria.locationMarker);
  }

  terria.locationMarker.entities.removeAll();

  const cartographicPosition = Cartographic.fromDegrees(
    result.location.longitude,
    result.location.latitude
  );

  const displayCoords = prettifyCoordinates(
    result.location.longitude,
    result.location.latitude,
    { digits: 5 }
  );

  const firstPointEntity = new Entity({
    name: result.name,
    position: Ellipsoid.WGS84.cartographicToCartesian(cartographicPosition),
    description: `<table><tr><td>${i18next.t("featureInfo.latLon")}</td><td>${
      displayCoords.latitude
    }, ${displayCoords.longitude}</td></tr></table>`,
    billboard: {
      image: markerIcon,
      scale: 0.5,
      eyeOffset: new Cartesian3(0.0, 0.0, 50.0),
      verticalOrigin: VerticalOrigin.BOTTOM
    }
  });

  if (
    terria.cesium &&
    terria.cesium.scene &&
    terria.cesium.scene.globe &&
    terria.cesium.scene.globe.terrainProvider
  ) {
    correctEntityHeight(
      firstPointEntity,
      cartographicPosition,
      terria.cesium.scene.globe.terrainProvider,
      15
    );
  }

  terria.locationMarker.entities.add(firstPointEntity);
}

/**
 * Gets the most detailed height from terrainProvider at currentCartographicPosition and updates entity position.
 * It starts querying at levelHint and makes its way down to level zero.
 */
function correctEntityHeight(
  entity,
  currentCartographicPosition,
  terrainProvider,
  levelHint
) {
  sampleTerrain(terrainProvider, levelHint, [currentCartographicPosition]).then(
    function(updatedPositions) {
      if (updatedPositions[0].height !== undefined) {
        entity.position = Ellipsoid.WGS84.cartographicToCartesian(
          updatedPositions[0]
        );
      } else if (levelHint > 0) {
        correctEntityHeight(
          entity,
          currentCartographicPosition,
          terrainProvider,
          levelHint - 1
        );
      }
    }
  );
}

/** Removes a marker previously added in {@link #addMarker}. */
export function removeMarker(terria) {
  terria.dataSources.remove(terria.locationMarker);
  terria.locationMarker = undefined;
}

/** Determines whether the location marker is visible previously added in {@link #addMarker}. */
export function markerVisible(terria) {
  return defined(terria.locationMarker);
}

/**
 * The name given to the data source created by {@link #addMarker}.
 */
export { LOCATION_MARKER_DATA_SOURCE_NAME };
