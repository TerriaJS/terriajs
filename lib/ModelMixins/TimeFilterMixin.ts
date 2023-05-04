import { action, computed, observable, onBecomeObserved } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import LatLonHeight from "../Core/LatLonHeight";
import runLater from "../Core/runLater";
import {
  ProviderCoords,
  ProviderCoordsMap
} from "../Map/PickedFeatures/PickedFeatures";
import CommonStrata from "../Models/Definition/CommonStrata";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import Model from "../Models/Definition/Model";
import TimeFilterTraits, {
  TimeFilterCoordinates
} from "../Traits/TraitsClasses/TimeFilterTraits";
import DiscretelyTimeVaryingMixin from "./DiscretelyTimeVaryingMixin";
import MappableMixin, { ImageryParts } from "./MappableMixin";
import TimeVarying from "./TimeVarying";

/**
 * A Mixin for filtering the dates for which imagery is available at a location
 * picked by the user
 *
 * When `timeFilterPropertyName` is set, we look for a property of that name in
 * the feature query response at the picked location. The property value should be
 * an array of dates for which imagery is available at the location. This
 * Mixin is used to implement the Location filter feature for Satellite
 * Imagery.
 */
function TimeFilterMixin<T extends Constructor<Model<TimeFilterTraits>>>(
  Base: T
) {
  abstract class TimeFilterMixin extends DiscretelyTimeVaryingMixin(Base) {
    @observable _currentTimeFilterFeature?: Entity;

    constructor(...args: any[]) {
      super(...args);

      // Try to resolve the timeFilterFeature from the co-ordinates that might
      // be stored in the traits. We only have to resolve the time filter
      // feature once to get the list of times.
      const disposeListener = onBecomeObserved(this, "mapItems", () => {
        runLater(
          action(async () => {
            if (!MappableMixin.isMixedInto(this)) {
              disposeListener();
              return;
            }

            const coords = coordinatesFromTraits(this.timeFilterCoordinates);
            if (coords) {
              this.setTimeFilterFromLocation(coords);
            }
            disposeListener();
          })
        );
      });
    }

    @action
    async setTimeFilterFromLocation(coordinates: {
      position: LatLonHeight;
      tileCoords: ProviderCoords;
    }): Promise<boolean> {
      const propertyName = this.timeFilterPropertyName;
      if (propertyName === undefined || !MappableMixin.isMixedInto(this)) {
        return false;
      }

      const resolved = await resolveFeature(
        this,
        propertyName,
        coordinates.position,
        coordinates.tileCoords
      );

      if (resolved) {
        this.setTimeFilterFeature(resolved.feature, resolved.providers);
        return true;
      }
      return false;
    }

    get hasTimeFilterMixin() {
      return true;
    }

    @computed
    get canFilterTimeByFeature(): boolean {
      return this.timeFilterPropertyName !== undefined;
    }

    @computed
    private get imageryUrls() {
      if (!MappableMixin.isMixedInto(this)) return [];
      return filterOutUndefined(
        this.mapItems.map(
          // @ts-ignore
          (mapItem) => ImageryParts.is(mapItem) && mapItem.imageryProvider.url
        )
      );
    }

    @computed
    get featureTimesAsJulianDates() {
      if (
        this._currentTimeFilterFeature === undefined ||
        this._currentTimeFilterFeature.properties === undefined ||
        this.timeFilterPropertyName === undefined
      ) {
        return;
      }

      const featureTimes = this._currentTimeFilterFeature.properties[
        this.timeFilterPropertyName
      ]?.getValue(this.currentTime);

      if (!Array.isArray(featureTimes)) {
        return;
      }

      return filterOutUndefined(
        featureTimes.map((s) => {
          try {
            return s === undefined ? undefined : JulianDate.fromIso8601(s);
          } catch {
            return undefined;
          }
        })
      );
    }

    @computed
    get discreteTimesAsSortedJulianDates() {
      const featureTimes = this.featureTimesAsJulianDates;
      if (featureTimes === undefined) {
        return super.discreteTimesAsSortedJulianDates;
      }

      return super.discreteTimesAsSortedJulianDates?.filter((dt) =>
        featureTimes.some((d) => d.equals(dt.time))
      );
    }

    @computed
    get timeFilterFeature() {
      return this._currentTimeFilterFeature;
    }

    @action
    setTimeFilterFeature(feature: Entity, providerCoords?: ProviderCoordsMap) {
      if (!MappableMixin.isMixedInto(this) || providerCoords === undefined)
        return;
      this._currentTimeFilterFeature = feature;

      if (!this.currentTimeAsJulianDate) {
        return;
      }
      if (!feature.position) {
        return;
      }

      const position = feature.position.getValue(this.currentTimeAsJulianDate);
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
      const featureImageryUrl = this.imageryUrls.find(
        (url) => providerCoords[url]
      );
      const tileCoords = featureImageryUrl && providerCoords[featureImageryUrl];
      if (!tileCoords) return;

      this.setTrait(
        CommonStrata.user,
        "timeFilterCoordinates",
        createStratumInstance(TimeFilterCoordinates, {
          tile: tileCoords,
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          height: cartographic.height
        })
      );
    }

    @action
    removeTimeFilterFeature() {
      this._currentTimeFilterFeature = undefined;
      this.setTrait(CommonStrata.user, "timeFilterCoordinates", undefined);
    }
  }

  return TimeFilterMixin;
}

namespace TimeFilterMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof TimeFilterMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasTimeFilterMixin;
  }
}

/**
 * Return the feature at position containing the time filter property.
 */
const resolveFeature = action(async function (
  model: MappableMixin.Instance & TimeVarying,
  propertyName: string,
  position: LatLonHeight,
  tileCoords: ProviderCoords
) {
  const { latitude, longitude, height } = position;
  const { x, y, level } = tileCoords;
  const providers: ProviderCoordsMap = {};
  model.mapItems.forEach((mapItem) => {
    if (ImageryParts.is(mapItem)) {
      // @ts-ignore
      providers[mapItem.imageryProvider.url] = { x, y, level };
    }
  });
  const viewer = model.terria.mainViewer.currentViewer;
  const features = await viewer.getFeaturesAtLocation(
    { latitude, longitude, height },
    providers
  );

  const feature = (features || []).find((feature) => {
    if (!feature.properties) {
      return false;
    }

    const prop = feature.properties[propertyName];
    const times = prop?.getValue(model.currentTimeAsJulianDate);
    return Array.isArray(times) && times.length > 0;
  });

  if (feature) {
    return { feature, providers };
  }
});

function coordinatesFromTraits(traits: Model<TimeFilterCoordinates>) {
  const {
    latitude,
    longitude,
    height,
    tile: { x, y, level }
  } = traits;
  if (latitude === undefined || longitude === undefined) return;
  if (x === undefined || y === undefined || level === undefined) return;
  return {
    position: { latitude, longitude, height },
    tileCoords: { x, y, level }
  };
}

export default TimeFilterMixin;
