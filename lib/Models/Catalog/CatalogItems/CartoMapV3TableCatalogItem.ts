import i18next from "i18next";
import { observable, runInAction } from "mobx";
import URI from "urijs";
import JsonValue, { isJsonObject } from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import TerriaError from "../../../Core/TerriaError";
import GeoJsonMixin, {
  toFeatureCollection
} from "../../../ModelMixins/GeojsonMixin";
import CartoMapV3TableCatalogItemTraits from "../../../Traits/TraitsClasses/CartoMapV3TableCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";

export default class CartoMapV3TableCatalogItem extends GeoJsonMixin(
  CreateModel(CartoMapV3TableCatalogItemTraits)
) {
  static readonly type = "carto-table";
  get type() {
    return CartoMapV3TableCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.geoJson.name");
  }

  @observable
  geojsonUrl: string | undefined = undefined;

  protected async forceLoadMetadata() {
    const url = new URI(this.baseUrl)
      .path("")
      .path(`v3/maps/${this.connectionName}/table`)
      .query({
        name: this.cartoTableName,
        columns: this.cartoColumns?.join(","),
        geo_column: this.cartoGeoColumn
      });

    const response = await loadJson(url.toString(), {
      Authorization: `Bearer ${this.accessToken}`
    });

    // const mvtTileJsonUrls: string[] = response.tilejson?.url ?? [];
    const geoJsonUrls: string[] = response.geojson?.url ?? [];

    if (geoJsonUrls.length > 1) {
      throw TerriaError.from(
        "Multiple URLs found - Terria only supports single a GeoJSON URL."
      );
    }

    // If geoJSON is over 100MB - use tile json
    if (geoJsonUrls.length > 0) {
      runInAction(() => (this.geojsonUrl = geoJsonUrls[0]));
    }

    throw TerriaError.from("No GeoJSON or TileJson found.");
  }

  protected async forceLoadGeojsonData() {
    if (!this.geojsonUrl)
      throw TerriaError.from("No GeoJSON URL found for Carto table");

    let jsonData: JsonValue | undefined = undefined;

    jsonData = await loadJson(this.geojsonUrl, {
      Authorization: `Bearer ${this.accessToken}`
    });

    if (jsonData === undefined) {
      throw TerriaError.from("Failed to load geojson");
    }

    if (isJsonObject(jsonData, false) && typeof jsonData.type === "string") {
      // Actual geojson
      const fc = toFeatureCollection(jsonData);
      if (fc) return fc;
    }

    throw TerriaError.from(
      "Invalid geojson data - only FeatureCollection and Feature are supported"
    );
  }
}
