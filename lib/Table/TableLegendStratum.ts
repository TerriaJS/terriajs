import { uniq } from "lodash-es";
import { computed } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import { isMakiIcon } from "../Map/Icons/Maki/MakiIcons";
import { isDataSource } from "../ModelMixins/MappableMixin";
import TableMixin from "../ModelMixins/TableMixin";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import StratumOrder from "../Models/Definition/StratumOrder";
import LegendOwnerTraits from "../Traits/TraitsClasses/LegendOwnerTraits";
import LegendTraits from "../Traits/TraitsClasses/LegendTraits";
import { ColorStyleLegend } from "./ColorStyleLegend";
import { MergedStyleMapLegend } from "./MergedStyleMapLegend";
import { StyleMapLegend } from "./StyleMapLegend";

export class TableAutomaticLegendStratum extends LoadableStratum(
  LegendOwnerTraits
) {
  static stratumName = "table-legend";
  constructor(private readonly _item: TableMixin.Instance) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new TableAutomaticLegendStratum(
      newModel as TableMixin.Instance
    ) as this;
  }

  static load(item: TableMixin.Instance) {
    return new TableAutomaticLegendStratum(item);
  }

  @computed get colorStyleLegend() {
    return new ColorStyleLegend(this._item);
  }

  @computed get pointStyleMapLegend() {
    return new StyleMapLegend(
      this._item,
      this._item.activeTableStyle.pointStyleMap,
      (point, defaultLabel) => ({
        marker: isMakiIcon(point.marker) ? point.marker : undefined,
        imageUrl: isMakiIcon(point.marker) ? undefined : point.marker,
        imageHeight: 24,
        imageWidth: 24,
        title: point.legendTitle ?? defaultLabel
      })
    );
  }

  @computed get outlineStyleMapLegend() {
    return new StyleMapLegend(
      this._item,
      this._item.activeTableStyle.outlineStyleMap,
      (outline, defaultLabel) => {
        return {
          outlineWidth: outline.width,
          outlineColor: outline.color ?? this._item.terria.baseMapContrastColor,
          title: outline.legendTitle ?? defaultLabel
        };
      }
    );
  }

  @computed get showPointLegend() {
    return this._item.mapItems.find(
      d => isDataSource(d) && d.entities.values.length > 0
    );
  }

  @computed get mergedLegend() {
    const mergableStyleTypes = [
      this._item.activeTableStyle.colorMapType,
      this._item.activeTableStyle.pointStyleMap.styleMap.type,
      this._item.activeTableStyle.outlineStyleMap.styleMap.type
    ];

    const canMergeStyleTypes =
      mergableStyleTypes.every(
        type => type === "enum" || type === "constant"
      ) ||
      mergableStyleTypes.every(type => type === "bin" || type === "constant");

    const canMergeColumns =
      uniq(
        filterOutUndefined([
          this._item.activeTableStyle.colorColumn?.name,
          this._item.activeTableStyle.outlineStyleMap.column?.name,
          this._item.activeTableStyle.pointStyleMap.column?.name
        ])
      ).length <= 1;

    if (canMergeColumns && canMergeStyleTypes) {
      return new MergedStyleMapLegend(
        filterOutUndefined([
          this.colorStyleLegend,
          this.showPointLegend ? this.pointStyleMapLegend : undefined,
          this.outlineStyleMapLegend
        ])
      );
    }
  }

  @computed get legends(): StratumFromTraits<LegendTraits>[] {
    if (this._item.mapItems.length === 0) return [];

    if (this.mergedLegend) return [this.mergedLegend];

    return filterOutUndefined([
      this.colorStyleLegend,
      this.showPointLegend ? this.pointStyleMapLegend : undefined,
      this.outlineStyleMapLegend
    ]);
  }
}

StratumOrder.addLoadStratum(TableAutomaticLegendStratum.stratumName);
