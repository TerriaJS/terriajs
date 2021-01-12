import i18next from "i18next";
import Papa from "papaparse";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import URI from "urijs";
import loadJson5 from "../../Core/loadJson5";
import loadText from "../../Core/loadText";
import makeRealPromise from "../../Core/makeRealPromise";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "../ItemSearchProvider";
import { Index, IndexRoot, parseIndexRoot } from "./Index";

const t = i18next.t.bind(i18next);

type Parameter = ItemSearchParameter & { index: Index };

/**
 * An ItemSearchProvider for searching an item using a pre-generated static index set.
 *
 */
export default class IndexedItemSearchProvider extends ItemSearchProvider {
  indexRootUrl: string;
  indexRoot?: IndexRoot;
  data?: Record<string, string>[];

  constructor(options: any) {
    super(options);
    const indexRootUrl = options?.indexRootUrl;
    if (typeof indexRootUrl !== "string")
      throw new Error(t("indexedItemSearchProvider.missingOptionIndexRootUrl"));
    this.indexRootUrl = indexRootUrl;
  }

  get parameters(): Map<string, Parameter> {
    const indexes = this.indexRoot?.indexes;
    if (!indexes) return new Map();
    return new Map(
      Object.entries(indexes).map(([propertyId, index]) => [
        propertyId,
        { ...this.buildParameterForIndex(propertyId, index), index }
      ])
    );
  }

  toAbsoluteUrl(url: string) {
    const uri = URI(url);
    return uri.is("absolute")
      ? url
      : uri.absoluteTo(this.indexRootUrl).toString();
  }

  buildParameterForIndex(
    propertyId: string,
    index: Index
  ): ItemSearchParameter {
    switch (index.type) {
      case "numeric":
        return {
          type: "numeric",
          id: propertyId,
          name: propertyId,
          range: index.range
        };
      case "enum":
        return {
          type: "enum",
          id: propertyId,
          name: propertyId,
          values: Object.entries(index.values).map(([id, { count }]) => ({
            id,
            count
          }))
        };
      case "text":
        return {
          type: "text",
          id: propertyId,
          name: propertyId
        };
    }
  }

  async initialize() {
    const indexRootUrl = this.indexRootUrl;
    const json = await loadJson5(indexRootUrl);
    try {
      this.indexRoot = parseIndexRoot(json);
    } catch (parseError) {
      console.warn(parseError);
      throw new Error(
        t("indexedItemSearchProvider.errorParsingIndexRoot", { indexRootUrl })
      );
    }
  }

  getIdPropertyName(): string {
    const idPropertyName = this.indexRoot?.idProperty;
    if (!idPropertyName) throw new Error(`indexRoot is not loaded`);
    return idPropertyName;
  }

  async describeParameters(): Promise<ItemSearchParameter[]> {
    return [...this.parameters.values()].map(({ index, ...rest }) => rest);
  }

  async search(parameterValues: Map<string, any>): Promise<ItemSearchResult[]> {
    const searchParameters = Promise.all(
      Array.from(parameterValues).map(async ([parameterId, value]) => {
        const parameter = this.parameters.get(parameterId);
        if (!parameter) throw new Error(`Unexpected parameter ${parameterId}`);
        const ids = await this.searchParameter(parameter, value);
        return ids;
      })
    );
    const data = await this.getOrLoadData();
    const idSets = await searchParameters;
    const matchingIds = intersectSets(idSets);
    const results = [...matchingIds].map(id =>
      this.buildResult(this.lookupDataForId(data, id), id)
    );
    return results;
  }

  searchParameter(parameter: Parameter, value: any): Promise<Set<number>> {
    const index = parameter.index;
    return index.load(this.indexRootUrl, value).then(() => index.search(value));
  }

  async getOrLoadData() {
    if (this.data) return this.data;
    if (!this.indexRoot?.dataUrl) {
      throw new Error(`indexRoot is not loaded`);
    }
    const dataUrl = this.toAbsoluteUrl(this.indexRoot.dataUrl);
    const rows = await loadCsv(dataUrl, {
      dynamicTyping: true,
      header: true
    });
    this.data = rows;
    return this.data;
  }

  lookupDataForId(
    rows: Record<string, string>[],
    id: number
  ): Record<string, string> {
    const row = rows[id];
    if (!row) throw new Error(`No data record found for item id: ${id}`);
    return row;
  }

  buildResult(
    record: Record<string, string>,
    dataIdx: number
  ): ItemSearchResult {
    if (!this.indexRoot) throw new Error(`indexRoot is not loaded`);
    const id = record[this.indexRoot.idProperty];
    if (!id) {
      throw new Error(
        `ID property not defined for data record at index ${dataIdx}`
      );
    }
    let { latitude, longitude, height, radius, ...properties } = record;
    const _latitude = parseFloat(latitude);
    const _longitude = parseFloat(longitude);
    // TODO: when height of the model is known, zoom to (lat,lon,height*2)
    // instead of the bounding sphere.
    const _height = parseFloat(height);
    const _radius = parseFloat(radius);
    if (isNaN(_latitude) || isNaN(_longitude) || isNaN(_radius)) {
      throw new Error(
        `No valid zoom point defined for data record at index ${dataIdx}`
      );
    }

    const center = Cartesian3.fromDegrees(_longitude, _latitude);
    const boundingSphere = new BoundingSphere(center, _radius);
    return {
      id,
      idPropertyName: this.indexRoot.idProperty,
      zoomToTarget: {
        boundingSphere
      },
      properties
    };
  }
}

function loadCsv(url: string, options?: Papa.ParseConfig): Promise<any[]> {
  return makeRealPromise<string>(loadText(url)).then(
    (text: string) =>
      new Promise((resolve, reject) =>
        Papa.parse(text, {
          worker: true,
          complete: result => resolve(result.data),
          error: error => reject(error),
          ...options
        })
      )
  );
}

export function intersectSets<T>(sets: Set<T>[]): Set<T> {
  if (sets.length === 0) return new Set();
  return sets
    .sort((a, b) => a.size - b.size)
    .reduce((a, b) => new Set([...a].filter(x => b.has(x))));
}
