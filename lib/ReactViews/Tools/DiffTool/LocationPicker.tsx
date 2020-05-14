import { action, observable, reaction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import LatLonHeight from "../../../Core/LatLonHeight";
import PickedFeatures from "../../../Map/PickedFeatures";
import { addMarker, removeMarker } from "../../../Models/LocationMarkerUtils";
import MapInteractionMode from "../../../Models/MapInteractionMode";
import Terria from "../../../Models/Terria";

const Loader = require("../../Loader");

interface PropsType {
  terria: Terria;
  location?: LatLonHeight;
  messages: {
    beforePick: string;
    afterPick: string;
  };
  onPick: (
    pickedFeatures: PickedFeatures,
    pickedLocation: LatLonHeight
  ) => void;
}

@observer
export default class LocationPicker extends React.Component<PropsType> {
  @observable private pickMode?: MapInteractionMode;
  @observable private currentPick?: PickedFeatures;
  @observable private pickDisposer?: () => void;

  @action
  setupPicker() {
    const { terria, location, messages, onPick } = this.props;
    this.pickMode = new MapInteractionMode({
      message: messages.beforePick
    });
    addInteractionModeToMap(terria, this.pickMode);
    if (location) showMarker(terria, location);

    this.pickDisposer = reaction(
      () => this.pickMode!.pickedFeatures,
      action((newPick: PickedFeatures | undefined) => {
        if (newPick === undefined || newPick.pickPosition === undefined) {
          return;
        }

        this.pickMode!.message = () => this.props.messages.afterPick;
        this.pickMode!.customUi = () => (
          <Loader message={`Querying ${location ? "new" : ""} position...`} />
        );

        const position = cartesianToDegrees(newPick.pickPosition);
        showMarker(this.props.terria, position);

        this.currentPick = newPick;
        newPick.allFeaturesAvailablePromise?.then(() => {
          if (newPick === this.currentPick) {
            onPick(newPick, position);
          }
        });
      })
    );
  }

  @action
  destroyPicker() {
    const { terria } = this.props;
    if (this.pickMode) {
      removeInteractionModeFromMap(terria, this.pickMode);
    }
    removeMarker(terria);
    this.pickMode = undefined;
    this.currentPick = undefined;
    this.pickDisposer?.();
    this.pickDisposer = undefined;
  }

  componentDidMount() {
    this.setupPicker();
  }

  componentDidUpdate() {
    this.destroyPicker();
    this.setupPicker();
  }

  componentWillUnmount() {
    this.destroyPicker();
  }

  render() {
    return null;
  }
}

function addInteractionModeToMap(terria: Terria, mode: MapInteractionMode) {
  terria.mapInteractionModeStack.push(mode);
}

function removeInteractionModeFromMap(
  terria: Terria,
  mode: MapInteractionMode
) {
  const [currentMode] = terria.mapInteractionModeStack.slice(-1);
  if (currentMode === mode) {
    terria.mapInteractionModeStack.pop();
  }
}

function showMarker(terria: Terria, location: LatLonHeight) {
  addMarker(terria, { name: "User selection", location });
}

function cartesianToDegrees(cartesian: Cartesian3) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
  return {
    longitude: CesiumMath.toDegrees(carto.longitude),
    latitude: CesiumMath.toDegrees(carto.latitude)
  };
}
