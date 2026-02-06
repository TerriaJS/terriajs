import { computed, action } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import SearchableCatalogItemTraits from "../Traits/TraitsClasses/SearchableCatalogItemTraits";
import SearchResult from "../Models/SearchProviders/SearchResult";
import createZoomToFunction from "../Map/Vector/zoomRectangleFromPoint";

import { Geometry } from "@turf/helpers";
import TerriaFeature from "../Models/Feature/Feature";
import { JsonObject } from "../Core/Json";

export interface SearchableData {
  searchField: string;
  latitude: number;
  longitude: number;
  geometry?: Geometry;
}

type MixinModel = Model<SearchableCatalogItemTraits>;

function SearchableCatalogItemMixin<T extends Constructor<MixinModel>>(
  Base: T
) {
  abstract class SearchableCatalogItemMixin extends Base {
    @computed
    get hasSearchableCatalogItemMixin() {
      return true;
    }

    abstract doSearch(text: string): Promise<SearchableData[]>;

    async searchWithinItemData(text: string): Promise<SearchResult[]> {
      const bboxSize = 0.005;
      const time = 2.0;

      const elements = await this.doSearch(text);

      if (!elements || elements.length === 0) return Promise.resolve([]);

      const results = elements.map((element) => {
        return new SearchResult({
          name: element.searchField,
          isImportant: false,
          clickAction: action(() => {
            if (element.geometry) {
              const newEntity = new TerriaFeature({});
              newEntity.data = element.geometry as unknown as JsonObject;
              this.terria.cesium?._highlightFeature(newEntity);
            }
            this.terria.currentViewer.zoomTo(
              createZoomToFunction(
                element.latitude,
                element.longitude,
                bboxSize
              ),
              time
            );
          }),
          location: { latitude: element.latitude, longitude: element.longitude }
        });
      });

      return results;
    }
  }
  return SearchableCatalogItemMixin;
}

namespace SearchableCatalogItemMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof SearchableCatalogItemMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasSearchableCatalogItemMixin;
  }

  export const stratumName = "searchableCatalogItemStratum";
  StratumOrder.addLoadStratum(stratumName);
}

export default SearchableCatalogItemMixin;
