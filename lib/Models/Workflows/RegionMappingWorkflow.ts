import { action, computed } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import TableMixin from "../../ModelMixins/TableMixin";
import Icon from "../../Styled/Icon";
import CommonStrata from "../Definition/CommonStrata";
import SelectableDimensionWorkflow, {
  SelectableDimensionWorkflowGroup
} from "../Workflows/SelectableDimensionWorkflow";

export default class RegionMappingWorkflow
  implements SelectableDimensionWorkflow {
  static type = "region-mapping";

  constructor(readonly item: TableMixin.Instance) {}

  get name() {
    return `Region Mapping`;
  }

  get icon() {
    return Icon.GLYPHS.layers;
  }

  get footer() {
    return {
      buttonText: "Reset to default region mapping",
      onClick: action(() => {
        this.getTableColumnTraits(CommonStrata.user)?.strata.delete(
          CommonStrata.user
        );
      })
    };
  }

  @computed get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    return [
      {
        type: "group",
        id: "Region Mapping",
        selectableDimensions: filterOutUndefined([
          {
            type: "select",
            id: "table-style",
            name: "Variable",
            selectedId: this.item.activeTableStyle.id,
            allowUndefined: true,
            options: this.item.tableStyles.map(style => ({
              id: style.id,
              name: style.title
            })),
            setDimensionValue: (stratumId, value) => {
              this.item.setTrait(stratumId, "activeStyle", value);
            }
          },
          this.item.regionColumnDimensions,
          this.item.regionProviderDimensions
        ])
      }
    ];
  }

  /** Get `TableColumnTraits` for the active table style `regionColumn` (so we can call `setTraits`) */
  getTableColumnTraits(stratumId: string) {
    if (!this.item.activeTableStyle.regionColumn?.name) return;

    return (
      this.item.columns?.find(
        col => col.name === this.item.activeTableStyle.regionColumn!.name
      ) ??
      this.item.addObject(
        stratumId,
        "columns",
        this.item.activeTableStyle.regionColumn!.name
      )
    );
  }
}
