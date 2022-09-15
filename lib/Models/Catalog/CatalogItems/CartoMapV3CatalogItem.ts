import { featureCollection, Geometry, GeometryCollection } from "@turf/helpers";
import i18next from "i18next";
import { computed, observable, runInAction } from "mobx";
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
import CartoMapV3CatalogItemTraits from "../../../Traits/TraitsClasses/CartoMapV3CatalogItemTraits";
import { GeoJsonTraits } from "../../../Traits/TraitsClasses/GeoJsonTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/TableStyleTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";

class CartoMapV3Stratum extends LoadableStratum(GeoJsonTraits) {
  static stratumName = "cartoMapV3Stratum";
  constructor(readonly catalogItem: CartoMapV3CatalogItem) {
    super();
  }

  static load(item: CartoMapV3CatalogItem) {
    return new CartoMapV3Stratum(item);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new CartoMapV3Stratum(newModel as CartoMapV3CatalogItem) as this;
  }

  // Hide "cartodb_id" style
  @computed get styles() {
    return [
      createStratumInstance(TableStyleTraits, {
        id: "cartodb_id",
        hidden: true
      })
    ];
  }
}

StratumOrder.addLoadStratum(CartoMapV3Stratum.stratumName);

export default class CartoMapV3CatalogItem extends GeoJsonMixin(
  CreateModel(CartoMapV3CatalogItemTraits)
) {
  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);

    if (this.strata.get(CartoMapV3Stratum.stratumName) === undefined) {
      runInAction(() => {
        this.strata.set(
          CartoMapV3Stratum.stratumName,
          new CartoMapV3Stratum(this)
        );
      });
    }
  }

  static readonly type = "carto-v3";
  get type() {
    return CartoMapV3CatalogItem.type;
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
