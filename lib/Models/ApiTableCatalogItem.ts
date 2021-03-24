import loadJson from "../Core/loadJson";
import AutoRefreshingMixin from "../ModelMixins/AutoRefreshingMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import ApiTableCatalogItemTraits, {
  QueryParamTraits,
  ValueApiTraits
} from "../Traits/ApiTableCatalogItemTraits";
import CreateModel from "./CreateModel";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";
import URI from "urijs";
import Mustache from "mustache";
import { action, computed, observable, runInAction } from "mobx";
import dateFormat from "dateformat";
import { createTransformer } from "mobx-utils";
import { cloneDeep } from "lodash-es";

type PositionForIdMap = Map<string, { latitude: string; longitude: string }>;

const automaticTableStylesStratumName = TableAutomaticStylesStratum.stratumName;
export class ApiTableCatalogItem extends AutoRefreshingMixin(
  TableMixin(CatalogMemberMixin(CreateModel(ApiTableCatalogItemTraits)))
) {
  static readonly type = "api-table";
  @observable protected positionApiResponse: any[] = [];
  @observable protected valueApisResponses: any[][] = [];
  @observable protected hasData: boolean = false;

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  @computed get positionApiUrl(): string {
    return this.addQueryParams("position");
  }

  @computed get valueApiUrls(): string[] {
    return this.valueApis.map((api, idx) => this.addQueryParams("value", idx));
  }

  loadDataFromValueApis() {
    return Promise.all(
      this.valueApiUrls.map(url => loadJson(proxyCatalogItemUrl(this, url)))
    ).then((data: any[][]) => {
      runInAction(() => {
        this.valueApisResponses = data;
      });
    });
  }

  loadDataFromPositionApi() {
    return loadJson(proxyCatalogItemUrl(this, this.positionApiUrl)).then(
      data => {
        runInAction(() => {
          this.positionApiResponse = data;
        });
      }
    );
  }

  @computed
  get positionApiResponseIsLoaded(): boolean {
    return this.positionApiResponse.length > 0;
  }

  @computed
  get valueApisResponsesAreLoaded(): boolean {
    return this.valueApisResponses.length > 0;
  }

  @computed
  get positionForId(): PositionForIdMap {
    const positionForId: Map<
      string,
      { latitude: string; longitude: string }
    > = new Map();
    this.positionApiResponse.forEach(position => {
      positionForId.set(position[this.idKey!], {
        latitude: position[this.positionApi.latitudeKey!],
        longitude: position[this.positionApi.longitudeKey!]
      });
    });
    return positionForId;
  }

  protected makeTableStructure = createTransformer(
    (options: { valueApis: ValueApiTraits[]; addHeaders: boolean }) => {
      const { valueApis, addHeaders } = options;
      // Add an array for each column
      let values: string[][];
      let latitudeColumnIdx: number;
      let longitudeColumnIdx: number;
      if (addHeaders) {
        values = valueApis
          .map(api =>
            api.keyToColumnMapping.map(mapping => [mapping.columnName!])
          )
          .reduce((prev, curr) => prev.concat(curr), []);
        latitudeColumnIdx = values.push(["latitude"]) - 1;
        longitudeColumnIdx = values.push(["longitude"]) - 1;
      } else {
        values = valueApis
          .map(api => api.keyToColumnMapping.map(mapping => []))
          .reduce((prev, curr) => prev.concat(curr), []);
        latitudeColumnIdx = values.push([]) - 1;
        longitudeColumnIdx = values.push([]) - 1;
      }
      return { values, latitudeColumnIdx, longitudeColumnIdx };
    }
  );

  protected apiResponseToTable = createTransformer(
    (options: {
      valueApiResponses: any[][];
      positionForId: PositionForIdMap;
      hasData: boolean;
      readonly valueApis: ValueApiTraits[];
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

      this.valueApis.forEach((api, idx) => {
        valueApiResponses[idx].forEach(response => {
          api.keyToColumnMapping.forEach((mapping, columnIdx) => {
            let cellValue = response[mapping.keyInApiResponse!];
            if (cellValue === undefined) {
              cellValue = "";
            }
            values[columnIdx].push(`${cellValue}`);

            if (values[longitudeColumnIdx].length < values[columnIdx].length) {
              const id = response[this.idKey!];
              const position = positionForId.get(id);
              values[latitudeColumnIdx].push(position?.latitude ?? "");
              values[longitudeColumnIdx].push(position?.longitude ?? "");
            }
          });
        });
      });
      return values;
    }
  );

  @computed
  get apiDataColumnMajor() {
    return this.apiResponseToTable({
      hasData: this.hasData,
      valueApis: (this.valueApis as unknown) as ValueApiTraits[],
      valueApiResponses: this.valueApisResponses,
      positionForId: this.positionForId
    });
  }

  protected async forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected async forceLoadTableData(): Promise<string[][] | undefined> {
    Promise.all([
      this.loadDataFromPositionApi(),
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

  protected addQueryParams(
    whichApi: "position" | "value",
    index: number = -1
  ): string {
    if (whichApi === "value" && index < 0) {
      throw new Error("Value API index not specified");
    }
    const api =
      whichApi === "position" ? this.positionApi : this.valueApis[index];
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
