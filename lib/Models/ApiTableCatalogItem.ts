import dateFormat from "dateformat";
import { groupBy } from "lodash";
import { computed, observable, runInAction } from "mobx";
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
  @observable private apiResponses: any[] = [];
  @observable private hasData: boolean = false;

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  @computed
  get apiDataIsLoaded(): boolean {
    return this.apiResponses.length > 0;
  }

  protected loadDataFromApis() {
    const apisWithUrl = this.apis.filter(api => api.apiUrl);
    const apiUrls = apisWithUrl.map(api =>
      proxyCatalogItemUrl(this, api.apiUrl!)
    );
    return Promise.all(
      apisWithUrl.map(async (api, idx) => {
        const data = await loadJson(apiUrls[idx]);
        return Promise.resolve({
          data,
          api
        });
      })
    ).then((values: { data: any[]; api: Model<ApiTraits> }[]) => {
      runInAction(() => {
        // Make map of ids to values that are constant for that id
        const perIdData: Map<string, any> = new Map(
          values
            .filter(val => val.api.kind === "PER_ID") // per id only
            .map(val => val.data) // throw away api, keep data
            .reduce((curr, prev) => curr.concat(prev), []) // flatten
            // make id/data pair for perIdData map
            .map(data => [data[this.idKey!], data])
        );

        // Merge all responses with the same id (and timestamp, if applicable),
        // Each of these merged responses will become a row in the table.
        const perRowData = values
          .filter(val => val.api.kind === "PER_ROW")
          .map(val => val.data)
          .reduce((curr, prev) => curr.concat(prev), []);

        // Group all responses wth the same id
        const groupedData = groupBy(perRowData, this.idKey);

        this.apiResponses = Object.keys(groupedData).map(key => {
          // Then, merge all responses with that key into a single object
          const mergedResponse = groupedData[key].reduce(
            (prev, curr) => Object.assign(prev, curr),
            {}
          );

          // Add per id data for this response
          Object.assign(
            mergedResponse,
            perIdData.get(mergedResponse[this.idKey!])
          );
          return mergedResponse;
        });
      });
    });
  }

  protected makeTableColumns(addHeaders: boolean) {
    return this.apis
      .map(api =>
        api.keyToColumnMapping.map(mapping =>
          addHeaders ? [mapping.columnName!] : []
        )
      )
      .reduce((prev, curr) => prev.concat(curr), []);
  }

  protected apiResponseToTable() {
    const columnMajorTable = this.makeTableColumns(!this.hasData);

    if (!this.apiDataIsLoaded) {
      // No data yet, just return the headers
      return columnMajorTable;
    }
    // Fill in column values from the API response
    let startColumnIdx = 0; // Store where the columns for each API start
    this.apis.forEach(api => {
      this.apiResponses.forEach(response => {
        api.keyToColumnMapping.forEach((mapping, mappingIdx) => {
          // Get cell value
          let cellValue = response[mapping.keyInApiResponse!];
          if (cellValue === undefined) {
            cellValue = "";
          }
          // Append the new value to the correct column
          const columnIdx = startColumnIdx + mappingIdx;
          columnMajorTable[columnIdx].push(`${cellValue}`);
        });
      });
      startColumnIdx += api.keyToColumnMapping.length;
    });
    return columnMajorTable;
  }

  protected async forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected async forceLoadTableData(): Promise<string[][] | undefined> {
    return this.loadDataFromApis()
      .then(() => {
        runInAction(() => {
          this.append(this.apiResponseToTable());
          this.hasData = true;
        });
      })
      .then(() => undefined);
  }

  refreshData(): void {
    this.loadDataFromApis().then(() => {
      runInAction(() => {
        this.append(this.apiResponseToTable());
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
