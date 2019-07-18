import { runInAction } from "mobx";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableColumnType from "../Table/TableColumnType";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import TableColorStyleTraits from "../Traits/TableColorStyleTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";

// Types of CSVs:
// - Points - Latitude and longitude columns or address
// - Regions - Region column
// - Chart - No spatial reference at all
// - Other geometry - e.g. a WKT column

// Types of time varying:
// - ID+time column -> point moves, region changes (continuously?) over time
// - points, no ID, time -> "blips" with a duration (perhaps provided by another column)
//

const automaticTableStylesStratumName = "automaticTableStyles";

export default class CsvCatalogItem extends AsyncMappableMixin(
  TableMixin(UrlMixin(CatalogMemberMixin(CreateModel(CsvCatalogItemTraits))))
) {
  static get type() {
    return "csv";
  }

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  get type() {
    return CsvCatalogItem.type;
  }

  protected get loadMapItemsPromise(): Promise<void> {
    return this.loadTableMixin()
      .then(() => {
        if (this.csvString !== undefined) {
          return Csv.parseString(this.csvString, true);
        } else if (this.url !== undefined) {
          return Csv.parseUrl(proxyCatalogItemUrl(this, this.url, "1d"), true);
        } else {
          throw new TerriaError({
            sender: this,
            title: "No CSV available",
            message:
              "The CSV catalog item cannot be loaded because it was not configured " +
              "with a `url` or `csvString` property."
          });
        }
      })
      .then(dataColumnMajor => {
        runInAction(() => {
          this.dataColumnMajor = dataColumnMajor;
        });
      });
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
