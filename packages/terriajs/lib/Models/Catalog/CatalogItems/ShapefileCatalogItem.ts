import { FeatureCollection } from "geojson";
import i18next from "i18next";
import { action, computed, makeObservable } from "mobx";
import { FeatureCollectionWithFilename, parseZip } from "shpjs";
import { isJsonObject } from "../../../Core/Json";
import loadBlob, { isZip } from "../../../Core/loadBlob";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import ShapefileCatalogItemTraits from "../../../Traits/TraitsClasses/ShapefileCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import HasLocalData from "../../HasLocalData";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { fileApiNotSupportedError } from "./GeoJsonCatalogItem";

export function isJsonArrayOrDeepArrayOfObjects<T>(
  value: T | T[]
): value is T[] {
  return (
    Array.isArray(value) &&
    value.every(
      (child) => isJsonObject(child) || isJsonArrayOrDeepArrayOfObjects(child)
    )
  );
}

class ShapefileCatalogItem
  extends GeoJsonMixin(CreateModel(ShapefileCatalogItemTraits))
  implements HasLocalData
{
  static readonly type = "shp";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return ShapefileCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.shapefile.name");
  }

  @action
  setFileInput(file: File) {
    this.setTrait(
      CommonStrata.user,
      "url",
      URL.createObjectURL(file) + "#" + file.name
    );
  }

  @computed get hasLocalData(): boolean {
    return this.url?.startsWith("blob:") ?? false;
  }

  protected async forceLoadGeojsonData() {
    if (this.url) {
      if (this.hasLocalData || isZip(this.url)) {
        if (typeof FileReader === "undefined") {
          throw fileApiNotSupportedError(this.terria);
        }
        const blob = await loadBlob(proxyCatalogItemUrl(this, this.url));
        return await parseShapefile(blob);
      } else {
        throw TerriaError.from(
          "Invalid URL: Only zipped shapefiles are supported (the extension must be `.zip`)"
        );
      }
    }

    throw TerriaError.from(
      "Failed to load shapefile - no URL of file has been defined"
    );
  }
}

const mergeFeatureCollections = (items: FeatureCollectionWithFilename[]) => {
  const output: FeatureCollection = {
    type: "FeatureCollection",
    features: []
  };
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    for (let j = 0; j < item.features.length; j++) {
      output.features.push(item.features[j] as never);
    }
  }

  return output;
};

async function parseShapefile(blob: Blob): Promise<FeatureCollection> {
  const asAb = await blob.arrayBuffer();
  const json = await parseZip(asAb);
  if (isJsonArrayOrDeepArrayOfObjects(json)) {
    return mergeFeatureCollections(json);
  }
  return json as FeatureCollection;
}

export default ShapefileCatalogItem;
