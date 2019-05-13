import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import TableTraits from "../Traits/TableTraits";
import { computed, observable } from "mobx";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import TableColumnTraits from "../Traits/TableColumnTraits";
import { createTransformer } from "mobx-utils";
import TableColumn from "../Table/TableColumn";
import createStratumInstance from "../Models/createStratumInstance";

export default function TableMixin<T extends Constructor<Model<TableTraits>>>(Base: T) {
  abstract class TableMixin extends Base {
    /**
     * The raw data table in column-major format, i.e. the outer array is an
     * array of columns.
     */
    @observable
    dataColumnMajor: string[][] | undefined;

    @computed
    get columnTraits(): readonly ModelPropertiesFromTraits<TableColumnTraits>[] {
      const table = this.dataColumnMajor;
      if (table === undefined) {
        return [];
      }

      const columnTraits = this.columns || [];
      return table.map(tableColumn => {
        const columnName = tableColumn[0];
        return (
          columnTraits.find(traits => traits.name === columnName) ||
          createStratumInstance(TableColumnTraits)
        );
      });
    }

    private readonly getTableColumn = createTransformer((index: number) => {
      return new TableColumn(this, index);
    });
  }

  return TableMixin;
}
