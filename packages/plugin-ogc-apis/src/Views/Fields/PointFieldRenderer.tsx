import { Feature } from "geojson";
import { reaction, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import { ViewState } from "terriajs-plugin-api";
import MapInteractionMode from "terriajs/lib/Models/MapInteractionMode";
import { toLatLonDegrees } from "../../Core/toLatLonDegrees";

export async function pickPoint({
  viewState,
  message
}: {
  viewState: ViewState;
  message: string;
}): Promise<Cartesian3> {
  return new Promise((resolve) => {
    const terria = viewState.terria;
    let disposeReaction: (() => void) | undefined;

    const closePickMode = () => {
      disposeReaction?.();
      disposeReaction = undefined;
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
    };

    const mapInteractionMode = new MapInteractionMode({
      message,
      onCancel: () => closePickMode()
    });

    runInAction(() => {
      terria.pickedFeatures = undefined;
      viewState.explorerPanelIsVisible = false;
      terria.mapInteractionModeStack.push(mapInteractionMode);
    });

    disposeReaction = reaction(
      () => mapInteractionMode?.pickedFeatures?.pickPosition,
      (pickPosition) => {
        if (pickPosition) {
          closePickMode();
          resolve(pickPosition);
        }
      }
    );
  });
}

export function pointFeature(cartographic: Cartographic): Feature {
  const coordinates = toLatLonDegrees(cartographic);
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates
    },
    properties: {}
  };
}
