import { action, computed, runInAction } from "mobx";
import CreateModel from "./CreateModel";
import TableMixin from "../ModelMixins/TableMixin";
import isDefined from "../Core/isDefined";
import loadWithXhr from "../Core/loadWithXhr";
import filterOutUndefined from "../Core/filterOutUndefined";
import loadJson from "../Core/loadJson";
import loadText from "../Core/loadText";
import CsvCatalogItem from "./CsvCatalogItem";
import CommonStrata from "./CommonStrata";
import CatalogFunctionJobMixin from "../ModelMixins/CatalogFunctionJobMixin";
import YDYRCatalogFunctionJobTraits from "../Traits/YDYRCatalogFunctionJobTraits";
import { ALGORITHMS, DATASETS } from "./YDYRCatalogFunction";
import { MapItem } from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";

export default class YDYRCatalogFunctionJob extends CatalogFunctionJobMixin(
  CreateModel(YDYRCatalogFunctionJobTraits)
) {
  @computed
  get mapItems(): MapItem[] {
    return [];
  }

  protected async forceLoadMapItems(): Promise<void> {}

  // why is this here?
  readonly typeName = "YourDataYourRegions Job";

  static readonly type = "ydyr-job";
  get type() {
    return YDYRCatalogFunctionJob.type;
  }

  async forceLoadMetadata() {
    await super.forceLoadMetadata();
  }

  get apiUrl() {
    return `https://ydyr.info/api/v1/`;
  }

  /**
   * Performs the Execute request for the WPS process
   *
   * If `executeWithHttpGet` is true, a GET request is made
   * instead of the default POST request.
   */
  @action
  async invoke() {
    if (!isDefined(this.parameters)) {
      throw "Parameters have not been set";
    }

    if (!isDefined(this.parameters!["Input Layer"])) {
      throw "The input layer must be defined";
    }

    const tableCatalogItem = this.terria.workbench.items
      .filter(TableMixin.isMixedInto)
      .filter(item => item.uniqueId === this.parameters!["Input Layer"])[0];

    if (!isDefined(tableCatalogItem)) {
      throw `Layer ${
        this.parameters!["Input Layer"]
      } is not a valid layer in the workbench`;
    }

    if (
      !isDefined(this.parameters["Region Column"]) ||
      !isDefined(this.parameters["Data Column"]) ||
      !isDefined(this.parameters["Output Geography"])
    ) {
      throw `The region column, data column and output geography must be defined`;
    }

    const regionColumn = this.parameters["Region Column"] as string;
    const dataColumn = this.parameters["Data Column"] as string;
    const outputGeography = this.parameters["Output Geography"] as string;

    const data = {
      ids: tableCatalogItem?.findColumnByName(regionColumn)?.values,
      values: tableCatalogItem?.findColumnByName(dataColumn)?.valuesAsNumbers
        .values
    };

    if (!data.ids?.length || !data.values?.length) {
      throw `The column selected has no valid data values`;
    }

    // Remove rows with null values
    const invalidRows: number[] = filterOutUndefined(
      data.values.map((val, idx) => (val === null ? idx : undefined))
    );

    data.ids = data.ids.filter((id, idx) => !invalidRows.includes(idx));
    data.values = data.values.filter(
      (value, idx) => !invalidRows.includes(idx)
    );

    const params = {
      data,
      data_column: dataColumn,
      geom_column: regionColumn,
      side_data: DATASETS.find(d => d.title === outputGeography)?.sideData,
      dst_geom: DATASETS.find(d => d.title === outputGeography)?.geographyName,
      src_geom:
        tableCatalogItem?.activeTableStyle.regionColumn?.regionType?.regionType,
      averaged_counts: false,
      algorithms: ALGORITHMS.filter(alg => this.parameters![alg[0]]).map(
        alg => alg[0]
      )
    };

    const jobId = await loadWithXhr({
      url: proxyCatalogItemUrl(this, `${this.apiUrl}disaggregate.json`),
      method: "POST",
      data: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json"
      },
      responseType: "json"
    });

    if (typeof jobId !== "string") {
      throw `The YDYR server didn't provide a valid job id.`;
    }

    this.setTrait(CommonStrata.user, "jobId", jobId);

    //   switch(createJobReponse.status) {
    //     case 202:
    //       createJobReponse.response
    //       break
    //     case 500:
    //       break
    //     default:
    //       break
    //   }

    //   if(r.status === 202) {
    //     // then the request was accepted
    //     r.json().then(j => poller(j));
    // } else if(r.status === 500) {
    //     // server error
    //     r.json().then(e => error({
    //         title: (e && e.title) || 'Server Error',
    //         detail: 'Job failed to submit' +
    //             ((e && e.detail) ? (': ' + e.detail) : '')}));
    // } else {
    //     const subber = s => {
    //         if(s.includes('is not valid under any of the given schemas')) {
    //             return 'invalid JSON data';
    //         }
    //         return s.length < 100 ? s : (s.substring(0, 100) + '...');
    //     }

    //     r.json()
    //       .then(e => error({
    //         title: (e && e.title) || 'Server Error',
    //         detail: 'Unexpected status (' + r.status.toString() + ') ' +
    //             'when submitting job' +
    //                 ((e && e.detail) ? (': ' + subber(e.detail)) : '')}))
    //       .catch(e => error({
    //         title: (e && e.title) || 'Error parsing JSON response',
    //         detail: `Received ${r.status} response code and failed to parse response as JSON`
    //       }));
    // }
  }

  async pollForResults() {
    console.log("POLLING");
    // if (!isDefined(this.auth)) {
    //   return;
    // }

    if (!isDefined(this.jobId)) {
      console.log("NO JOB ID");
      return true;
    }

    const status = await loadJson(
      proxyCatalogItemUrl(this, `${this.apiUrl}status/${this.jobId}`),
      {
        "Cache-Control": "no-cache"
      }
    );

    if (typeof status !== "string") {
      console.log(status);
      this.setTrait(CommonStrata.user, "resultId", status.key);
      return true;
    } else {
      // resultPendingCatalogItem?.setTrait(
      //   CommonStrata.user,
      //   "description",
      //   status
      // );
      console.log(status);
      return false;
    }
  }

  async downloadResults() {
    // if (!isDefined(this.auth)) {
    //   return;
    // }
    // resultPendingCatalogItem.setTrait(
    //   CommonStrata.user,
    //   "description",
    //   "Job has finished, downloading CSV data"
    // );

    if (!isDefined(this.resultId)) {
      return;
    }

    const csv = await loadText(
      proxyCatalogItemUrl(
        this,
        `${this.apiUrl}download/${this.resultId}?format=csv`
      ),
      {
        "Cache-Control": "no-cache"
      }
    );
    const item = new CsvCatalogItem(`${this.uniqueId}-result`, this.terria);
    runInAction(() => {
      item.setTrait(CommonStrata.user, "name", "YDYR results");
      item.setTrait(CommonStrata.user, "csvString", csv);
    });
    await item.loadMapItems();

    this.terria.workbench.add(item);
  }
}
