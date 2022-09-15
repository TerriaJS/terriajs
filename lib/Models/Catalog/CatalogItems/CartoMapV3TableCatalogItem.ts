import { featureCollection, Geometry, GeometryCollection } from "@turf/helpers";
import i18next from "i18next";
import { observable, runInAction } from "mobx";
import URI from "urijs";
import JsonValue, {
  isJsonObject,
  isJsonStringArray,
  JsonObject
} from "../../../Core/Json";
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
  geoJsonUrls: string[] = [];

  protected async forceLoadMetadata() {
    let response: JsonObject | undefined;

    /** If cartoQuery is defined - use Query API (https://api-docs.carto.com/#8f2020d9-edf3-4b50-ae58-9edeaa34613c)
     */
    if (this.cartoQuery) {
      const url = new URI(this.baseUrl)
        .path("")
        .path(`v3/maps/${this.connectionName}/query`);

      response = await loadJson(
        url.toString(),
        {
          Authorization: `Bearer ${this.accessToken}`
        },
        { q: this.cartoQuery, geo_column: this.cartoGeoColumn }
      );
    }
    // If cartoTableName is defined - use Table API (https://api-docs.carto.com/#6a05d4d7-c6a1-4635-a8de-c91fa5e77fda)
    else if (this.cartoTableName) {
      const url = new URI(this.baseUrl)
        .path("")
        .path(`v3/maps/${this.connectionName}/table`)
        .query({
          name: this.cartoTableName,
          columns: this.cartoColumns?.join(","),
          geo_column: this.cartoGeoColumn
        });

      response = await loadJson(url.toString(), {
        Authorization: `Bearer ${this.accessToken}`
      });
    } else {
      throw new TerriaError({
        title: "Invalid Carto V3 config",
        message: "`cartoQuery` or `cartoTableName` must be defined"
      });
    }

    // Do something with file size here?
    // response.size (in bytes)

    let geoJsonUrls: string[] = [];
    // const mvtTileJsonUrls: string[] = response.tilejson?.url ?? [];
    if (
      response &&
      isJsonObject(response.geojson) &&
      isJsonStringArray(response.geojson.url)
    ) {
      geoJsonUrls = response.geojson.url;
    }

    if (geoJsonUrls.length === 0) {
      throw TerriaError.from("No GeoJSON found.");
    }

    runInAction(() => (this.geoJsonUrls = geoJsonUrls));
  }

  protected async forceLoadGeojsonData() {
    if (this.geoJsonUrls.length === 0)
      throw TerriaError.from("No GeoJSON URL found for Carto table");

    let jsonData: JsonValue | undefined = undefined;

    // Download all geoJson files
    const geojsonResponses = await Promise.all(
      this.geoJsonUrls.map(async (url) => {
        jsonData = await loadJson(url, {
          Authorization: `Bearer ${this.accessToken}`
        });

        if (jsonData === undefined) {
          throw new TerriaError({
            title: "Failed to load GeoJSON",
            message: `Failed to load GeoJSON URL ${url}`
          });
        }

        if (
          isJsonObject(jsonData, false) &&
          typeof jsonData.type === "string"
        ) {
          // Actual geojson
          const fc = toFeatureCollection(jsonData);
          if (fc) return fc;
        }

        throw new TerriaError({
          title: "Failed to load GeoJSON",
          message: `Invalid response from GeoJSON URL ${url}:\n\n
          \`\`\`
          ${JSON.stringify(jsonData)}
          \`\`\``
        });
      })
    );

    // Merge all geojson responses into a combined feature collection
    const combinedFeatureCollection = featureCollection<
      Geometry | GeometryCollection
    >([]);

    geojsonResponses.forEach((fc) => {
      for (let i = 0; i < fc.features.length; i++) {
        combinedFeatureCollection.features.push(fc.features[i]);
      }
    });

    return combinedFeatureCollection;
  }
}
