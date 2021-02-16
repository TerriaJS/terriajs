import { action, observable } from "mobx";
import { fromPromise } from "mobx-utils";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Constructor from "../../Core/Constructor";
import Model, { BaseModel } from "../../Models/Model";
import SearchProviderResults from "../../Models/SearchProvider/SearchProviderResults";
import StratumFromTraits from "../../Models/StratumFromTraits";
import Terria from "../../Models/Terria";
import ModelTraits from "../../Traits/ModelTraits";
import SearchProviderTraits from "../../Traits/SearchProvider/SearchProviderTraits";
import CommonStrata from "../../Models/CommonStrata";
import LocationSearchProviderTraits from "../../Traits/SearchProvider/LocationSearchProviderTraits";
import SearchProviderMixin from "./SearchProviderMixin";

type LocationSearchProviderModel = Model<LocationSearchProviderTraits>;

function LocationSearchProviderMixin<
  T extends Constructor<LocationSearchProviderModel>
>(Base: T) {
  abstract class LocationSearchProviderMixin extends SearchProviderMixin(Base) {
    @action
    toggleOpen(stratumId: CommonStrata = CommonStrata.user) {
      this.setTrait(stratumId, "isOpen", !this.isOpen);
    }

    get hasLocationSearchProviderMixin() {
      return true;
    }
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
  export interface LocationSearchProviderMixin
    extends InstanceType<ReturnType<typeof LocationSearchProviderMixin>> {}
  export function isMixedInto(
    model: any
  ): model is LocationSearchProviderMixin {
    return model && model.hasLocationSearchProviderMixin;
  }
}

export default LocationSearchProviderMixin;
