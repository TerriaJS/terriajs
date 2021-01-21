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

type SearchProviderMixin = Model<SearchProviderTraits>;

function SearchProviderMixin<T extends Constructor<SearchProviderMixin>>(
  Base: T
) {
  abstract class SearchProviderMixin extends Base {
    abstract get type(): string;
    @observable isOpen = this.openByDefault;

    @action
    toggleOpen() {
      this.isOpen = !this.isOpen;
    }

    @action
    search(searchText: string): SearchProviderResults {
      const result = new SearchProviderResults(this);
      result.resultsCompletePromise = fromPromise(
        this.doSearch(searchText, result)
      );
      return result;
    }

    protected abstract doSearch(
      searchText: string,
      results: SearchProviderResults
    ): Promise<void>;

    shouldRunSearch(searchText: string) {
      if (
        searchText === undefined ||
        /^\s*$/.test(searchText) ||
        (this.minCharacters && searchText.length < this.minCharacters) ||
        (this.minCharacters === undefined &&
          searchText.length <
            this.terria.configParameters.searchBar.minCharacters)
      ) {
        return false;
      }
      return true;
    }

    get hasSearchProviderMixin() {
      return true;
    }
  }
  return SearchProviderMixin;
}

namespace SearchProviderMixin {
  export interface SearchProviderMixin
    extends InstanceType<ReturnType<typeof SearchProviderMixin>> {}
  export function isMixedInto(model: any): model is SearchProviderMixin {
    return model && model.hasSearchProviderMixin;
  }
}

export default SearchProviderMixin;

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
