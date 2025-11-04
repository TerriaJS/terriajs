import i18next from "i18next";
import { computed, makeObservable } from "mobx";
import { FeatureCollectionWithCrs } from "../../../Core/GeoJson";
import isDefined from "../../../Core/isDefined";
import loadBlob from "../../../Core/loadBlob";
import { parseGeoPackage } from "../../../Core/parseGeoPackage";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import GeoPackageCatalogItemTraits from "../../../Traits/TraitsClasses/GeoPackageCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import HasLocalData from "../../HasLocalData";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export function isGeoPackageFile(fileName: string): boolean {
  return /\.gpkg$/i.test(fileName);
}

class GeoPackageCatalogItem
  extends GeoJsonMixin(CreateModel(GeoPackageCatalogItemTraits))
  implements HasLocalData
{
  static readonly type = "gpkg";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GeoPackageCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.geoPackage.name");
  }

  protected _file?: File;

  setFileInput(file: File) {
    this._file = file;
  }

  @computed get hasLocalData(): boolean {
    return isDefined(this._file);
  }

  protected async forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
    let blob: Blob | undefined;

    // Load from file
    if (this._file) {
      blob = this._file;
    }
    // Load from URL
    else if (this.url) {
      if (!isGeoPackageFile(this.url)) {
        throw TerriaError.from(
          "Invalid URL: Only GeoPackage files are supported (the extension must be `.gpkg`)"
        );
      }
      blob = await loadBlob(proxyCatalogItemUrl(this, this.url));
    }

    if (!blob) {
      throw TerriaError.from(
        "Failed to load GeoPackage - no URL or file has been defined"
      );
    }

    // Parse the GeoPackage
    try {
      const result = await parseGeoPackage(blob, this.layerName);

      // If result is an array (multiple layers), this shouldn't happen in single-layer mode
      // but handle it gracefully
      if (Array.isArray(result)) {
        if (result.length === 0) {
          throw TerriaError.from(
            "The GeoPackage file contains no feature layers."
          );
        }

        // If multiple layers and no layerName specified, return the first one
        if (!this.layerName) {
          console.warn(
            `GeoPackage contains ${result.length} layers. Loading the first layer: "${result[0].name}". ` +
              `To load a specific layer, set the "layerName" property.`
          );
          return result[0].data;
        }

        // This shouldn't happen as parseGeoPackage should throw if layerName not found
        const layer = result.find((r) => r.name === this.layerName);
        if (!layer) {
          throw TerriaError.from(
            `Layer "${this.layerName}" not found in GeoPackage.`
          );
        }
        return layer.data;
      }

      // Single layer or specific layer requested
      return result as FeatureCollectionWithCrs;
    } catch (error) {
      throw TerriaError.from(error, {
        title: "Error loading GeoPackage",
        message:
          "An error occurred while loading the GeoPackage file. The file may be corrupted or contain unsupported features."
      });
    }
  }
}

export default GeoPackageCatalogItem;
