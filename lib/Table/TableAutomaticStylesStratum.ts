import i18next from "i18next";
import { uniq } from "lodash-es";
import { computed, makeObservable } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import TableMixin from "../ModelMixins/TableMixin";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum, {
  LockedDownStratum
} from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import { ShortReportTraits } from "../Traits/TraitsClasses/CatalogMemberTraits";
import TableChartStyleTraits, {
  TableChartLineStyleTraits
} from "../Traits/TraitsClasses/Table/ChartStyleTraits";
import TableColorStyleTraits from "../Traits/TraitsClasses/Table/ColorStyleTraits";
import TablePointSizeStyleTraits from "../Traits/TraitsClasses/Table/PointSizeStyleTraits";
import TableStyleTraits from "../Traits/TraitsClasses/Table/StyleTraits";
import TableTimeStyleTraits from "../Traits/TraitsClasses/Table/TimeStyleTraits";
import TableTraits from "../Traits/TraitsClasses/Table/TableTraits";
import TableColumnType from "./TableColumnType";
import { ImageryParts } from "../ModelMixins/MappableMixin";
import { tags } from "mustache";

const DEFAULT_ID_COLUMN = "id";

interface TableCatalogItem
  extends InstanceType<ReturnType<typeof TableMixin>> {}

export default class TableAutomaticStylesStratum
  extends LoadableStratum(TableTraits)
  implements LockedDownStratum<TableTraits, TableAutomaticStylesStratum>
{
  static stratumName = "automaticTableStyles";
  constructor(protected readonly catalogItem: TableCatalogItem) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new TableAutomaticStylesStratum(
      newModel as TableCatalogItem
    ) as this;
  }

  @computed
  get rectangle() {
    return this.catalogItem.activeTableStyle.rectangle;
  }

  @computed
  get disableOpacityControl() {
    // disable opacity control for point tables - or if no mapItems
    return this.catalogItem.activeTableStyle.isPoints() ||
      this.catalogItem.mapItems.length === 0
      ? true
      : undefined;
  }

  @computed
  get disableSplitter() {
    return !this.catalogItem.mapItems.find(ImageryParts.is) ? true : undefined;
  }

  /**
   * Set default activeStyle to first style with a scalar color column (if none is found then find first style with enum, text and then region)
   * Ignores styles with `hidden: true`
   */
  @computed get activeStyle() {
    if (this.catalogItem.styles && this.catalogItem.styles.length > 0) {
      // Find default active style in this order:
      // - First scalar style
      // - First enum style
      // - First text style
      // - First region style

      const types = [
        TableColumnType.scalar,
        TableColumnType.enum,
        TableColumnType.text,
        TableColumnType.region
      ];

      const firstStyleOfEachType = types.map(
        (columnType) =>
          this.catalogItem.styles
            .filter((style) => !style.hidden)
            .find(
              (s) =>
                this.catalogItem.findColumnByName(s.color?.colorColumn)
                  ?.type === columnType
            )?.id
      );

      return filterOutUndefined(firstStyleOfEachType)[0];
    }
  }

  @computed
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

    const timeColumn = this.catalogItem.findFirstColumnByType(
      TableColumnType.time
    );

    // Set a default id column only when we also have a time column
    const idColumn =
      timeColumn && this.catalogItem.findColumnByName(DEFAULT_ID_COLUMN);

    if (
      regionColumn !== undefined ||
      (longitudeColumn !== undefined && latitudeColumn !== undefined)
    ) {
      return createStratumInstance(TableStyleTraits, {
        longitudeColumn:
          longitudeColumn && latitudeColumn ? longitudeColumn.name : undefined,
        latitudeColumn:
          longitudeColumn && latitudeColumn ? latitudeColumn.name : undefined,
        regionColumn: regionColumn ? regionColumn.name : undefined,
        time: createStratumInstance(TableTimeStyleTraits, {
          timeColumn: timeColumn?.name,
          idColumns: idColumn && [idColumn.name]
        })
      });
    }

    // This dataset isn't spatial, so see if we have a valid chart style
    if (this.defaultChartStyle) {
      return this.defaultChartStyle;
    }

    // Can't do much with this dataset.
    // Just add default legend
    return createStratumInstance(TableStyleTraits, {});
  }

  @computed
  protected get defaultChartStyle():
    | StratumFromTraits<TableStyleTraits>
    | undefined {
    const timeColumns = this.catalogItem.tableColumns.filter(
      (column) => column.type === TableColumnType.time
    );

    const scalarColumns = this.catalogItem.tableColumns.filter(
      (column) => column.type === TableColumnType.scalar
    );

    const hasTime = timeColumns.length > 0;

    if (scalarColumns.length >= (hasTime ? 1 : 2)) {
      return createStratumInstance(TableStyleTraits, {
        chart: createStratumInstance(TableChartStyleTraits, {
          xAxisColumn: hasTime ? timeColumns[0].name : scalarColumns[0].name,
          lines: scalarColumns.slice(hasTime ? 0 : 1).map((column, i) =>
            createStratumInstance(TableChartLineStyleTraits, {
              yAxisColumn: column.name,
              isSelectedInWorkbench: i === 0 // activate only the first chart line by default
            })
          )
        })
      });
    }
  }

  @computed
  get styles(): StratumFromTraits<TableStyleTraits>[] {
    // If no styles for scalar, enum - show styles using region columns
    const showRegionStyles = this.catalogItem.tableColumns.every(
      (column) =>
        column.type !== TableColumnType.scalar &&
        column.type !== TableColumnType.enum
    );

    const columnStyles = this.catalogItem.tableColumns.map((column, _i) =>
      createStratumInstance(TableStyleTraits, {
        id: column.name,
        color: createStratumInstance(TableColorStyleTraits, {
          colorColumn: column.name
        }),
        pointSize: createStratumInstance(TablePointSizeStyleTraits, {
          pointSizeColumn: column.name
        }),
        hidden:
          column.type !== TableColumnType.scalar &&
          column.type !== TableColumnType.enum &&
          (column.type !== TableColumnType.region || !showRegionStyles)
      })
    );

    return [
      ...columnStyles,

      // Create "User Style" traits for legend
      // This style is used by `TableStylingWorkflow` if no other styles are available
      createStratumInstance(TableStyleTraits, {
        id: "User Style",
        hidden: true
      })
    ];
  }

  @computed
  get disableDateTimeSelector() {
    if (
      this.catalogItem.mapItems.length === 0 ||
      !this.catalogItem.activeTableStyle.moreThanOneTimeInterval
    )
      return true;
  }

  @computed get showDisableTimeOption() {
    // Return nothing if no row groups or if time column doesn't have at least one interval
    if (
      this.catalogItem.activeTableStyle.rowGroups.length === 0 ||
      !this.catalogItem.activeTableStyle.moreThanOneTimeInterval
    )
      return undefined;

    // Return true if at least 50% of rowGroups only have one unique time interval (i.e. they don't change over time)
    let flat = 0;

    for (
      let i = 0;
      i < this.catalogItem.activeTableStyle.rowGroups.length;
      i++
    ) {
      const [_rowGroupId, rowIds] =
        this.catalogItem.activeTableStyle.rowGroups[i];
      // Check if there is only 1 unique date in this rowGroup
      const dates = rowIds
        .map((rowId) =>
          this.catalogItem.activeTableStyle.timeColumn?.valuesAsDates.values[
            rowId
          ]?.getTime()
        )
        .filter(isDefined);
      if (uniq(dates).length <= 1) flat++;
    }

    if (flat / this.catalogItem.activeTableStyle.rowGroups.length >= 0.5)
      return true;

    return undefined;
  }

  @computed
  get initialTimeSource() {
    return "start";
  }

  /** Return title of timeColumn if defined
   * This will be displayed on DateTimeSelectorSection in the workbench
   */
  @computed get timeLabel() {
    if (this.catalogItem.activeTableStyle.timeColumn) {
      return `${this.catalogItem.activeTableStyle.timeColumn.title}: `;
    }
  }

  @computed
  get discreteTimes() {
    if (!this.catalogItem.activeTableStyle.moreThanOneTimeInterval) return;
    const dates =
      this.catalogItem.activeTableStyle.timeColumn?.valuesAsDates.values;
    if (dates === undefined) {
      return;
    }

    // is it correct for discrete times to remove duplicates?
    // see discussion on https://github.com/TerriaJS/terriajs/pull/4577
    // duplicates will mess up the indexing problem as our `<DateTimePicker />`
    // will eliminate duplicates on the UI front, so given the datepicker
    // expects uniques, return uniques here
    const times = new Set<string>();

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (d) {
        times.add(d.toISOString());
      }
    }

    return { times: Array.from(times), tags: [] };
  }

  @computed
  get shortReport() {
    return this.catalogItem.mapItems.length === 0 &&
      this.catalogItem.chartItems.length === 0 &&
      !this.catalogItem.isLoading
      ? i18next.t("models.tableData.noData")
      : undefined;
  }

  /** Show "Regions: xxx" short report for region-mapping */
  @computed get shortReportSections() {
    const regionCol = this.catalogItem.activeTableStyle.regionColumn;

    const regionType = regionCol?.regionType;

    if (regionType && this.catalogItem.showingRegions) {
      return [
        createStratumInstance(ShortReportTraits, {
          name: `**Regions:** ${regionType.description}`
        })
      ];
    }
    return [];
  }

  /** Show chart by default - if not loading and no mappable items */
  @computed get showInChartPanel() {
    return (
      this.catalogItem.show &&
      !this.catalogItem.isLoading &&
      this.catalogItem.mapItems.length === 0
    );
  }
}
