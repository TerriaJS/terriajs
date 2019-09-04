import { runInAction } from "mobx";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import TableMixin from "../ModelMixins/TableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import TableTimeVaryingStratum from "../Table/TableTimeVaryingStratum";
import CsvCatalogItemTraits from "../Traits/CsvCatalogItemTraits";
import CreateModel from "./CreateModel";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

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
const tableTimeVaryingStratumName = "tableTimeVaryingStratumName";

export default class CsvCatalogItem extends AsyncMappableMixin(
  DiscretelyTimeVaryingMixin(
    TableMixin(UrlMixin(CatalogMemberMixin(CreateModel(CsvCatalogItemTraits))))
  )
) {
  static get type() {
    return "csv";
  }

  constructor(id: string, terria: Terria) {
    super(id, terria);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
    this.strata.set(
      tableTimeVaryingStratumName,
      new TableTimeVaryingStratum(this)
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
StratumOrder.addLoadStratum(tableTimeVaryingStratumName);
