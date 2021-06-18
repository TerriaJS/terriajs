import { observer } from "mobx-react";
import React from "react";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import PickedFeatures from "../../Map/PickedFeatures";
import TimeFilterMixin from "../../ModelMixins/TimeFilterMixin";
import { Comparable } from "../../Models/Comparable";
import doesImageryFeatureBelongToItem from "../../Models/doesImageryFeatureBelongToCatalogItem";
import Feature from "../../Models/Feature";
import ViewState from "../../ReactViewModels/ViewState";
import { TimeFilterCoordinates } from "../../Traits/TimeFilterTraits";
import LocationPicker from "./LocationPicker";

type PropsType = {
  viewState: ViewState;
  leftItem?: Comparable;
  rightItem?: Comparable;
};

/**
 * A component that controls the time filters for the left & right items.
 * Does nothing, if neither the left or right items are time filterable.
 */
const LocationDateFilter: React.FC<PropsType> = observer(props => {
  const leftItem: TimeFilterMixin.Instance | undefined =
    TimeFilterMixin.isMixedInto(props.leftItem) &&
    props.leftItem.canFilterTimeByFeature
      ? props.leftItem
      : undefined;
  const rightItem: TimeFilterMixin.Instance | undefined =
    TimeFilterMixin.isMixedInto(props.rightItem) &&
    props.rightItem.canFilterTimeByFeature
      ? props.rightItem
      : undefined;

  if (leftItem === undefined && rightItem === undefined) {
    // Not time filterable items, nothing to do.
    return null;
  }

  const location = locationFromTimeFilterCoordinates(
    leftItem
      ? leftItem.timeFilterCoordinates
      : rightItem
      ? rightItem.timeFilterCoordinates
      : undefined
  );

  const setLocationFromPick = (pickedFeatures: PickedFeatures | undefined) => {
    // Find a feature from the pickedFeatures matching left or right item
    const feature =
      (leftItem &&
        pickedFeatures?.features?.find(f =>
          doesImageryFeatureBelongToItem(f as Feature, leftItem)
        )) ??
      (rightItem &&
        pickedFeatures?.features?.find(f =>
          doesImageryFeatureBelongToItem(f as Feature, rightItem)
        ));

    // If we have a match set the time filter otherwise clear it
    if (feature && pickedFeatures?.providerCoords) {
      leftItem?.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
      rightItem?.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
    } else {
      leftItem?.removeTimeFilterFeature();
      rightItem?.removeTimeFilterFeature();
    }
  };

  return (
    <LocationPicker
      viewState={props.viewState}
      location={location}
      onPick={setLocationFromPick}
    />
  );
});

/**
 * Converts TimeFilterCoordinates to a Cartesian value
 */
function locationFromTimeFilterCoordinates(
  timeFilterCoordinates: TimeFilterCoordinates | undefined
): Cartesian3 | undefined {
  const longitude = timeFilterCoordinates?.longitude;
  const latitude = timeFilterCoordinates?.latitude;
  if (longitude === undefined || latitude === undefined) {
    return undefined;
  } else {
    return Cartographic.toCartesian(
      Cartographic.fromDegrees(longitude, latitude)
    );
  }
}

export default LocationDateFilter;
