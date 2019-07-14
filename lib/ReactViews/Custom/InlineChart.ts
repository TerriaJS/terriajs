import { runInAction } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import TableMixin from "../../ModelMixins/TableMixin";
import CreateModel from "../../Models/CreateModel";
import Csv from "../../Table/Csv";
import TableTraits from "../../Traits/TableTraits";

export default class InlineChart extends TableMixin(CreateModel(TableTraits)) {
  async loadFromCsvString(csvString: string): Promise<void> {
    await this.loadTableMixin();
    const data = await Csv.parseString(csvString, true);
    runInAction(() => {
      this.dataColumnMajor = data;
    });
  }

  loadFromJsonString(jsonString: string): Promise<void> {
    return Promise.reject(new DeveloperError("Not Implemented yet"));
  }
}
