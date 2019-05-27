import createStratumInstance from "../Models/createStratumInstance";
import CsvCatalogItem from "../Models/CsvCatalogItem";
import LoadableStratum from "../Models/LoadableStratum";
import StratumFromTraits from "../Models/StratumFromTraits";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableColumnType from "./TableColumnType";
import LegendTraits, { LegendItemTraits } from "../Traits/LegendTraits";
import { computed } from "mobx";

export default class TableAutomaticStylesStratum extends LoadableStratum(
  CsvCatalogItemTraits
) {
  constructor(readonly catalogItem: CsvCatalogItem) {
    super();
  }

  get defaultStyle(): StratumFromTraits<TableStyleTraits> {
    // Use the default style to select the spatial key (lon/lat, region, none i.e. chart)
    // for all styles.
    const longitudeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.longitude
    );
    const latitudeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.latitude
    );
    const regionColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.region
    );

    return createStratumInstance(TableStyleTraits, {
      longitudeColumn:
        longitudeColumn && latitudeColumn ? longitudeColumn.name : undefined,
      latitudeColumn:
        longitudeColumn && latitudeColumn ? latitudeColumn.name : undefined,
      regionColumn: regionColumn ? regionColumn.name : undefined
    });
  }

  get styles(): StratumFromTraits<TableStyleTraits>[] {
    // Create a style to color by every scalar and enum.
    const columns = this.catalogItem.tableColumns.filter(
      column =>
        column.type === TableColumnType.scalar ||
        column.type === TableColumnType.enum
    );

    return columns.map((column, i) =>
      createStratumInstance(TableStyleTraits, {
        id: column.name,
        color: createStratumInstance(TableColorStyleTraits, {
          colorColumn: column.name,
          legend: new TableAutomaticLegendStratum(this.catalogItem, i)
        })
      })
    );
  }
}

class TableAutomaticLegendStratum extends LoadableStratum(LegendTraits) {
  constructor(readonly catalogItem: CsvCatalogItem, readonly index: number) {
    super();
  }

  @computed
  get legendFromActiveStyle(): StratumFromTraits<LegendTraits> | undefined {
    const tableStyle = this.catalogItem.activeTableStyle;
    if (tableStyle === undefined) {
      return undefined;
    }

    return tableStyle.createColorLegend();
  }

  @computed
  get url() {
    if (this.legendFromActiveStyle === undefined) {
      return undefined;
    }
    return this.legendFromActiveStyle.url;
  }

  @computed
  get urlMimeType() {
    if (this.legendFromActiveStyle === undefined) {
      return undefined;
    }
    return this.legendFromActiveStyle.urlMimeType;
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    if (this.legendFromActiveStyle === undefined) {
      return [];
    }
    return this.legendFromActiveStyle.items || [];
  }
}
