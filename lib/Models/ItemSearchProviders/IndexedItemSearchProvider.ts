import i18next from "i18next";
import fromPairs from "lodash-es/fromPairs";
import zip from "lodash-es/zip";
import MiniSearch, { Options as MiniSearchOptions } from "minisearch";
import Papa from "papaparse";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import URI from "urijs";
import { assertArray } from "../../Core/Json";
import loadJson5 from "../../Core/loadJson5";
import loadText from "../../Core/loadText";
import makeRealPromise from "../../Core/makeRealPromise";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "../ItemSearchProvider";
import {
  enumIndexSearchFunction,
  Index,
  IndexRoot,
  numericIndexSearchFunction,
  parseIndexRoot,
  SearchFn,
  textIndexSearchFunction
} from "./Index";

const t = i18next.t.bind(i18next);

type Parameter = ItemSearchParameter & { index: Index };

export default class IndexedItemSearchProvider extends ItemSearchProvider {
  indexRootUrl: string;
  indexRoot?: IndexRoot;
  data?: { header: string[]; rows: string[][] };

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
      [...indexes.entries()].map(([propertyId, index]) => [
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
          name: index.name || propertyId,
          range: index.range
        };
      case "enum":
        return {
          type: "enum",
          id: propertyId,
          name: index.name || propertyId,
          values: [...index.values.entries()].map(([id, { count }]) => ({
            id,
            count
          }))
        };
      case "text":
        return {
          type: "text",
          id: propertyId,
          name: index.name || propertyId
        };
    }
  }

  async load() {
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
    return this.loadIndex(parameter.index, value).then(searchFn =>
      searchFn(value)
    );
  }

  async getOrLoadData() {
    if (this.data) return this.data;
    if (!this.indexRoot?.dataUrl) {
      throw new Error(`indexRoot is not loaded`);
    }
    const dataUrl = this.toAbsoluteUrl(this.indexRoot.dataUrl);
    const [header, ...rows] = await loadCsv(dataUrl, {
      dynamicTyping: true
    });
    this.data = { header, rows };
    return this.data;
  }

  async loadIndex(index: Index, valueHint: any): Promise<SearchFn> {
    switch (index.type) {
      case "numeric":
        if (!index.idValuePairs) {
          const indexUrl = this.toAbsoluteUrl(index.url);
          index.idValuePairs = loadCsv(indexUrl, { dynamicTyping: true });
        }
        return numericIndexSearchFunction(index);
      case "enum":
        assertArray(valueHint);
        const enumValueIds = valueHint;
        enumValueIds.forEach(enumValueId => {
          const enumValueIndex = index.values.get(enumValueId);
          if (!enumValueIndex)
            throw new Error(`Invalid enum value id ${enumValueId}`);
          if (!enumValueIndex.ids) {
            const enumValueIndexUrl = this.toAbsoluteUrl(enumValueIndex.url);
            enumValueIndex.ids = loadCsv(enumValueIndexUrl, {
              dynamicTyping: true
            }).then(rows =>
              // unwrap the row and get the single id column
              rows.map((row: number[]) => row[0])
            );
          }
        });
        return enumIndexSearchFunction(index, enumValueIds);
      case "text":
        if (!index.miniSearchIndex) {
          // Consider using webworker for JSON parsing if it becomes a bottleneck.
          const indexUrl = this.toAbsoluteUrl(index.url);
          index.miniSearchIndex = loadText(indexUrl)
            .then((text: string) => JSON.parse(text))
            .then((json: any) =>
              MiniSearch.loadJS(
                json.index as any,
                (json.options as any) as MiniSearchOptions
              )
            );
        }
        return textIndexSearchFunction(index);
    }
  }

  lookupDataForId(
    { header, rows }: { header: string[]; rows: string[][] },
    id: number
  ): Record<string, string> {
    const row = rows[id];
    if (!row) throw new Error(`No data record found for item id: ${id}`);
    return fromPairs(zip(header, row));
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
    let { latitude, longitude, radius, ...properties } = record;
    const _latitude = parseFloat(latitude);
    const _longitude = parseFloat(longitude);
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
