import dateFormat from "dateformat";
import { groupBy } from "lodash";
import { computed, observable, runInAction } from "mobx";
import { createTransformer } from "mobx-utils";
import URI from "urijs";
import loadJson from "../Core/loadJson";
import AutoRefreshingMixin from "../ModelMixins/AutoRefreshingMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import ApiTableCatalogItemTraits, {
  ApiTraits
} from "../Traits/ApiTableCatalogItemTraits";
import CreateModel from "./CreateModel";
import Model from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

type PositionForIdMap = Map<string, { latitude: string; longitude: string }>;

const automaticTableStylesStratumName = TableAutomaticStylesStratum.stratumName;
/**
 * THE API AND TRAITS OF THIS EXPERIMENTAL CATALOG ITEM SHOULD BE CONSIDERED IN
 * ALPHA. EXPECT BREAKING CHANGES.
 *
 * This is a generic, one-size-fits-most catalog item for deriving tables from
 * external APIs. Currently only supports JSON APIs, and doesn't support region
 * mapping. Also currently only supports a single API to get values from, and a
 * single API to get positions from.
 */
export class ApiTableCatalogItem extends AutoRefreshingMixin(
  TableMixin(CatalogMemberMixin(CreateModel(ApiTableCatalogItemTraits)))
) {
  static readonly type = "api-table";
  @observable protected positionApisResponses: any[] = [];
  @observable protected valueApisResponses: any[][] = [];
  @observable protected hasData: boolean = false;

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  @computed get possibleLatitudeColumns() {
    return ["latitude", "lat", this.activeTableStyle.latitudeColumn?.name];
  }

  @computed get possibleLongitudeColumns() {
    return ["longitude", "lon", this.activeTableStyle.longitudeColumn?.name];
  }

  @computed get latitudeApi(): Model<ApiTraits> | undefined {
    return this.apis.find(
      api =>
        this.findKeyToColumnMappingForColumn(
          api,
          this.possibleLatitudeColumns
        ) !== undefined
    );
  }

  @computed get longitudeApi(): Model<ApiTraits> | undefined {
    return this.apis.find(
      api =>
        this.findKeyToColumnMappingForColumn(
          api,
          this.possibleLongitudeColumns
        ) !== undefined
    );
  }

  @computed get latitudeKey(): string {
    return (
      this.findKeyToColumnMappingForColumn(
        this.latitudeApi!,
        this.possibleLatitudeColumns
      )?.keyInApiResponse ?? "latitude"
    );
  }

  @computed get longitudeKey(): string {
    return (
      this.findKeyToColumnMappingForColumn(
        this.longitudeApi!,
        this.possibleLongitudeColumns
      )?.keyInApiResponse ?? "longitude"
    );
  }

  @computed get valueApis(): Model<ApiTraits>[] {
    return this.apis.filter(
      api =>
        api.apiUrl !== this.latitudeApi?.apiUrl &&
        api.apiUrl !== this.longitudeApi?.apiUrl
    );
  }

  @computed get positionApis(): Model<ApiTraits>[] {
    return Array.from(new Set([this.latitudeApi!, this.longitudeApi!]));
  }

  @computed get valueApiUrls(): string[] {
    return this.valueApis.map(api => this.addQueryParams(api));
  }

  @computed get positionApiUrls(): string[] {
    return this.positionApis.map(api => this.addQueryParams(api));
  }

  @computed
  get positionApiResponseIsLoaded(): boolean {
    return this.positionApisResponses.length > 0;
  }

  @computed
  get valueApisResponsesAreLoaded(): boolean {
    return this.valueApisResponses.length > 0;
  }

  @computed
  get positionForId(): PositionForIdMap {
    const positionForId: PositionForIdMap = new Map();
    if (this.positionApis.length === 1) {
      const response = this.positionApisResponses[0];
      response.forEach((position: any) => {
        positionForId.set(position[this.idKey!], {
          latitude: position[this.latitudeKey],
          longitude: position[this.longitudeKey]
        });
      });
    } else if (this.positionApis.length === 2) {
      if (
        this.positionApisResponses[0].length !==
        this.positionApisResponses[1].length
      ) {
        throw new Error(
          "Error reading responses from position APIs: responses from " +
            "latitude and longitude APIs must be the same length"
        );
      }
      for (let i = 0; i < this.positionApisResponses[0].length; i++) {
        // These correspond to the same position because each element of
        // positionApisResponses is sorted by id key
        const latitudeResponse = this.positionApisResponses[0][i];
        const longitudeResponse = this.positionApisResponses[1][i];

        if (latitudeResponse[this.idKey!] !== longitudeResponse[this.idKey!]) {
          throw new Error(
            "Error reading responses from position APIs: latitude and " +
              "longitude API responses with the same index have different keys"
          );
        }

        positionForId.set(latitudeResponse[this.idKey!], {
          latitude: latitudeResponse[this.latitudeKey],
          longitude: longitudeResponse[this.longitudeKey]
        });
      }
    } else {
      throw new Error(
        "Error reading responses from position APIs: there must be exactly 1 " +
          "or 2 position APIs, but there were " +
          this.positionApis.length
      );
    }

    return positionForId;
  }

  @computed
  get apiDataColumnMajor() {
    return this.apiResponseToTable({
      hasData: this.hasData,
      valueApis: (this.valueApis as unknown) as ApiTraits[],
      valueApiResponses: this.valueApisResponses,
      positionForId: this.positionForId
    });
  }

  loadDataFromValueApis() {
    return Promise.all(
      this.valueApiUrls.map(url => loadJson(proxyCatalogItemUrl(this, url)))
    ).then((data: any[]) => {
      runInAction(() => {
        // Merge all responses with the same id (and timestamp, if applicable).
        // Each of these merged responses will become a row in the table.

        // First, group all responses wth the same id
        const flatData = data.reduce((curr, prev) => curr.concat(prev), []);
        const groupedData = groupBy(flatData, obj => {
          const keyArgs = [obj[this.idKey!], obj[this.dateTimeKey!]];
          return keyArgs.join(".");
        });
        this.valueApisResponses = Object.keys(groupedData).map(key => {
          // Then, merge all responses with that key into a single object
          const mergedResponse = groupedData[key].reduce(
            (prev, curr) => Object.assign(prev, curr),
            {}
          );
          return mergedResponse;
        });
      });
    });
  }

  loadDataFromPositionApis() {
    return Promise.all(
      this.positionApiUrls.map(url => loadJson(proxyCatalogItemUrl(this, url)))
    ).then((data: any[][]) => {
      runInAction(() => {
        for (let i = 0; i < data.length; i++) {
          // We sort the position API responses by id key so it's easier to find
          // the latitude and longitude with the same id
          data[i] = data[i].sort((a, b) => {
            const keyA = new Date(a[this.idKey!]);
            const keyB = new Date(b[this.idKey!]);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          });
        }
        this.positionApisResponses = data;
      });
    });
  }

  // TODO: memoized version is never being used. either fix that, or get rid of
  // createTransformer
  protected makeTableStructure = createTransformer(
    (options: { valueApis: ApiTraits[]; addHeaders: boolean }) => {
      const { valueApis, addHeaders } = options;
      // Add an array for each column
      let values: string[][];
      let latitudeColumnIdx: number;
      let longitudeColumnIdx: number;

      values = valueApis
        .map(api =>
          api.keyToColumnMapping.map(mapping =>
            addHeaders ? [mapping.columnName!] : []
          )
        )
        .reduce((prev, curr) => prev.concat(curr), []);
      latitudeColumnIdx = values.push(addHeaders ? ["latitude"] : []) - 1;
      longitudeColumnIdx = values.push(addHeaders ? ["longitude"] : []) - 1;
      return { values, latitudeColumnIdx, longitudeColumnIdx };
    }
  );

  // TODO: memoized version is never being used. either fix that, or get rid of
  // createTransformer
  protected apiResponseToTable = createTransformer(
    (options: {
      valueApiResponses: any[];
      positionForId: PositionForIdMap;
      hasData: boolean;
      readonly valueApis: ApiTraits[];
    }) => {
      const { valueApiResponses, positionForId, hasData, valueApis } = options;
      const {
        values,
        latitudeColumnIdx,
        longitudeColumnIdx
      } = this.makeTableStructure({
        valueApis: valueApis,
        addHeaders: !hasData
      });

      if (
        !this.positionApiResponseIsLoaded ||
        !this.valueApisResponsesAreLoaded
      ) {
        return values;
      }

      // Fill in column values from the API response
      // Store where the columns for each API start
      let startColumnIdx = 0;
      this.valueApis.forEach(api => {
        valueApiResponses.forEach(response => {
          api.keyToColumnMapping.forEach((mapping, mappingIdx) => {
            // Append the new value to the correct column
            const columnIdx = startColumnIdx + mappingIdx;
            let cellValue = response[mapping.keyInApiResponse!];
            if (cellValue === undefined) {
              cellValue = "";
            }
            values[columnIdx].push(`${cellValue}`);

            // Add the latitude and longitude columns if we haven't already
            if (values[longitudeColumnIdx].length < values[columnIdx].length) {
              const id = response[this.idKey!];
              const position = positionForId.get(id);
              values[latitudeColumnIdx].push(position?.latitude ?? "");
              values[longitudeColumnIdx].push(position?.longitude ?? "");
            }
          });
        });
        startColumnIdx += api.keyToColumnMapping.length;
      });
      return values;
    }
  );

  protected findKeyToColumnMappingForColumn(
    api: Model<ApiTraits>,
    possibleColumnNames: (string | undefined)[]
  ) {
    return api.keyToColumnMapping.find(mapping => {
      let name = mapping.columnName?.toLowerCase().trim();
      return name === undefined ? false : possibleColumnNames.includes(name);
    });
  }

  protected async forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected async forceLoadTableData(): Promise<string[][] | undefined> {
    // TODO: this isn't a reactive context, and so this will trigger a full
    // recompute. Fix this.
    Promise.all([
      this.loadDataFromPositionApis(),
      this.loadDataFromValueApis()
    ]).then(() => {
      runInAction(() => {
        this.append(this.apiDataColumnMajor);
        this.hasData = true;
      });
    });
    return undefined;
  }

  refreshData(): void {
    this.loadDataFromValueApis().then(() => {
      runInAction(() => {
        this.append(this.apiDataColumnMajor);
      });
    });
  }

  protected addQueryParams(api: Model<ApiTraits>): string {
    const uri = new URI(api.apiUrl);

    const substituteDateTimesInQueryParam = (param: string) => {
      if (param.startsWith("DATE!")) {
        const dateFormatString = param.slice(param.indexOf("!") + 1);
        const now = new Date();
        return dateFormat(now, dateFormatString);
      }
      return param;
    };

    // Add common query parameters
    let useUpdateParams = this.hasData && this.updateQueryParameters.length > 0;
    const commonQueryParameters = useUpdateParams
      ? this.updateQueryParameters
      : this.queryParameters;
    commonQueryParameters.forEach(query => {
      uri.addQuery(query.name!, substituteDateTimesInQueryParam(query.value!));
    });

    // Add API-specific query parameters
    useUpdateParams = this.hasData && api.updateQueryParameters.length > 0;
    const specificQueryParameters = useUpdateParams
      ? api.updateQueryParameters
      : api.queryParameters;
    specificQueryParameters.forEach(query => {
      uri.addQuery(query.name!, substituteDateTimesInQueryParam(query.value!));
    });

    return uri.toString();
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
