import { action, makeObservable } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import AbstractConstructor from "../../Core/AbstractConstructor";
import CommonStrata from "../../Models/Definition/CommonStrata";
import Model from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import LocationSearchProviderTraits from "../../Traits/SearchProviders/LocationSearchProviderTraits";
import SearchProviderMixin from "./SearchProviderMixin";

type LocationSearchProviderModel = Model<LocationSearchProviderTraits>;

function LocationSearchProviderMixin<
  T extends AbstractConstructor<LocationSearchProviderModel>
>(Base: T) {
  abstract class LocationSearchProviderMixin extends SearchProviderMixin(Base) {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get hasLocationSearchProviderMixin() {
      return true;
    }

    @action
    toggleOpen(stratumId: CommonStrata = CommonStrata.user) {
      this.setTrait(stratumId, "isOpen", !this.isOpen);
    }

    @action
    showWarning() {}
  }

  return LocationSearchProviderMixin;
}

interface MapCenter {
  longitude: number;
  latitude: number;
}

export function getMapCenter(terria: Terria): MapCenter {
  const view = terria.currentViewer.getCurrentCameraView();
  if (view.position !== undefined) {
    const cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(
      view.position
    );
    return {
      longitude: CesiumMath.toDegrees(cameraPositionCartographic.longitude),
      latitude: CesiumMath.toDegrees(cameraPositionCartographic.latitude)
    };
  } else {
    const center = Rectangle.center(view.rectangle);
    return {
      longitude: CesiumMath.toDegrees(center.longitude),
      latitude: CesiumMath.toDegrees(center.latitude)
    };
  }
}

namespace LocationSearchProviderMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof LocationSearchProviderMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasLocationSearchProviderMixin;
  }
}

export default LocationSearchProviderMixin;
