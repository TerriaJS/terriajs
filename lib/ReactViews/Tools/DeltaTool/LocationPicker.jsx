import PropTypes from "prop-types";
import React, { useEffect } from "react";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import {
  addMarker,
  removeMarker
} from "../../../Models/LocationMarkerUtils.js";
import MapInteractionMode from "../../../Models/MapInteractionMode";
import Loader from "../../Loader";

/**
 * Allows user to pick a point on the map
 */
function LocationPicker({ terria, messages, location, onPick }) {
  useEffect(() => {
    let currentPick;
    const pickPointMode = new MapInteractionMode({
      message: messages.beforePick
    });
    terria.mapInteractionModeStack.push(pickPointMode);

    showMarker(location);

    const subscription = knockout
      .getObservable(pickPointMode, "pickedFeatures")
      .subscribe(thisPick => {
        currentPick = thisPick;
        pickPointMode.customUi = /* eslint-disable-line react/display-name */ function() {
          return (
            <Loader message={`Querying ${location ? "new" : ""} position...`} />
          );
        };

        pickPointMode.message = () => messages.afterPick;

        const position = cartesianToDegrees(thisPick.pickPosition);
        showMarker(position);

        currentPick.allFeaturesAvailablePromise.then(() => {
          if (currentPick === thisPick) {
            onPick(thisPick, position);
          }
        });
      });
    return () => {
      // disposer
      currentPick = undefined;
      subscription.dispose();
      stopInteractionMode(pickPointMode);
      removeMarker(terria);
    };
  });

  const showMarker = location => {
    if (location) {
      addMarker(terria, { name: "User selection", location });
    }
  };

  const stopInteractionMode = pickPointMode => {
    const [currentMode] = terria.mapInteractionModeStack.slice(-1);
    if (currentMode === pickPointMode) {
      terria.mapInteractionModeStack.pop();
    }
  };

  return null;
}

LocationPicker.propTypes = {
  terria: PropTypes.object.isRequired,
  messages: PropTypes.object.isRequired,
  location: PropTypes.object,
  onPick: PropTypes.func.isRequired
};

LocationPicker.displayName = "LocationPicker";

function cartesianToDegrees(cartesian) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
  return {
    longitude: CesiumMath.toDegrees(carto.longitude),
    latitude: CesiumMath.toDegrees(carto.latitude)
  };
}

export default LocationPicker;
