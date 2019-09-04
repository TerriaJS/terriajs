import { computed } from "mobx";
import CsvCatalogItem from "../Models/CsvCatalogItem";
import LoadableStratum from "../Models/LoadableStratum";
import StratumFromTraits from "../Models/StratumFromTraits";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import TableColumnType from "./TableColumnType";

export default class TableTimeVaryingStratum extends LoadableStratum(
  CsvCatalogItemTraits
) {
  constructor(readonly catalogItem: CsvCatalogItem) {
    super();
  }

  @computed
  get discreteTimes(): StratumFromTraits<DiscreteTimeTraits>[] {
    const timeColumn =
      this.catalogItem.activeTableStyle.timeColumn ||
      this.catalogItem.findFirstColumnByType(TableColumnType.time);
    let result: StratumFromTraits<DiscreteTimeTraits>[] = [];
    if (timeColumn) {
      result = timeColumn.values.map(time => ({
        time,
        tag: undefined
      }));
    }
    return result;
  }
}
