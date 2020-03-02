import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import TimeFilterTraits, {
  TimeFilterCoordinates
} from "../Traits/TimeFilterTraits";
import DiscretelyTimeVaryingTraits from "../Traits/DiscretelyTimeVaryingTraits";
import { ProviderCoordsMap, ProviderCoords } from "../Map/PickedFeatures";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import createStratumInstance from "../Models/createStratumInstance";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import sortedIndexOf from "lodash/sortedIndexOf";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../Core/filterOutUndefined";
import CommonStrata from "../Models/CommonStrata";
import { computed, action, observable, onBecomeObserved } from "mobx";
import TimeVarying from "./TimeVarying";
import Mappable, { ImageryParts } from "../Models/Mappable";
import MappableTraits from "../Traits/MappableTraits";
import runLater from "../Core/runLater";
import LatLonHeight from "../Core/LatLonHeight";

type MixinModel = Model<
  TimeFilterTraits & DiscretelyTimeVaryingTraits & MappableTraits
> &
  TimeVarying;

/**
 * A Mixin for filtering the dates for which imagery is available at a location
 * picked by the user.
 *
 * When `timeFilterPropertyName` is set, we look for a property of that name in
 * the feature query response at the picked location. The property value should be set
 * to an array of dates for which imagery is available at the location. This
 * Mixin is used to implement the Location filter feature for Satellite
 * Imagery.
 */
function TimeFilterMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class TimeFilterMixin extends Base {
    @observable _currentTimeFilterFeature?: Entity;

    constructor(...args: any[]) {
      super(...args);

      // Try to resolve the timeFilterFeature from the co-ordinates that might
      // be stored in the traits. We only have to resolve the time filter
      // feature once to get the list of times.
      const disposeListener = onBecomeObserved(this, "mapItems", () => {
        runLater(
          action(async () => {
            if (!Mappable.is(this)) {
              disposeListener();
              return;
            }

            const coords = coordinatesFromTraits(this.timeFilterCoordinates);
            if (this.timeFilterPropertyName && coords) {
              const resolved = await resolveFeature(
                this,
                this.timeFilterPropertyName,
                coords.position,
                coords.tileCoords
              );
              if (resolved) {
                this.setTimeFilterFeature(resolved.feature, resolved.providers);
                disposeListener();
              }
            } else {
              disposeListener();
            }
          })
        );
      });
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
      if (!Mappable.is(this)) return [];
      return filterOutUndefined(
        this.mapItems.map(
          // @ts-ignore
          mapItem => ImageryParts.is(mapItem) && mapItem.imageryProvider.url
        )
      );
    }

    @computed
    get filteredDiscreteTimes(): ReadonlyArray<DiscreteTimeTraits> | undefined {
      if (
        this._currentTimeFilterFeature === undefined ||
        this._currentTimeFilterFeature.properties === undefined ||
        this.timeFilterPropertyName === undefined
      ) {
        return;
      }
      const featureTimesProperty = this._currentTimeFilterFeature.properties[
        this.timeFilterPropertyName
      ];

      if (featureTimesProperty === undefined) return;

      // Return the dates in the `featureTimesProperty`, but also ensure that
      // these dates are present in the full list of available dates for the item
      const featureTimes: any = featureTimesProperty.getValue(this.currentTime);
      if (!Array.isArray(featureTimes)) return;
      const sortedDiscreteTimes = this.discreteTimes.map(dt => dt.time).sort();
      return filterOutUndefined(
        featureTimes.map(time => {
          if (sortedIndexOf(sortedDiscreteTimes, time) >= 0)
            return createStratumInstance(DiscreteTimeTraits, { time });
          else return undefined;
        })
      );
    }

    @computed
    get timeFilterFeature() {
      return this._currentTimeFilterFeature;
    }

    @action
    setTimeFilterFeature(feature: Entity, providerCoords?: ProviderCoordsMap) {
      if (!Mappable.is(this) || providerCoords === undefined) return;
      this._currentTimeFilterFeature = feature;

      if (!this.currentTimeAsJulianDate) {
        return;
      }
      const position = feature.position.getValue(this.currentTimeAsJulianDate);
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
      const featureImageryUrl = this.imageryUrls.find(
        url => providerCoords[url]
      );
      const tileCoords = featureImageryUrl && providerCoords[featureImageryUrl];
      if (!tileCoords) return;

      this.setTrait(
        CommonStrata.user,
        "timeFilterCoordinates",
        createStratumInstance(TimeFilterCoordinates, {
          ...tileCoords,
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
  export interface TimeFilterMixin
    extends InstanceType<ReturnType<typeof TimeFilterMixin>> {}

  export function isMixedInto(model: any): model is TimeFilterMixin {
    return model && model.hasTimeFilterMixin;
  }
}

/**
 * Return the feature at position containing the time filter property.
 */
const resolveFeature = action(async function(
  model: Mappable & TimeVarying,
  propertyName: string,
  position: LatLonHeight,
  tileCoords: ProviderCoords
) {
  const { latitude, longitude, height } = position;
  const { x, y, level } = tileCoords;
  const providers: ProviderCoordsMap = {};
  model.mapItems.forEach(mapItem => {
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

  const feature = (features || []).find(feature => {
    const prop = feature.properties[propertyName];
    const times = prop.getValue(model.currentTimeAsJulianDate);
    return Array.isArray(times) && times.length > 0;
  });

  if (feature) {
    return { feature, providers };
  }
});

function coordinatesFromTraits(traits: Model<TimeFilterCoordinates>) {
  const { latitude, longitude, height, x, y, level } = traits;
  if (latitude === undefined || longitude === undefined) return;
  if (x === undefined || y === undefined || level === undefined) return;
  return {
    position: { latitude, longitude, height },
    tileCoords: { x, y, level }
  };
}

export default TimeFilterMixin;
