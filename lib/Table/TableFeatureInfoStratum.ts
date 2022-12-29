import TableMixin from "../ModelMixins/TableMixin";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import TableTraits from "../Traits/TraitsClasses/Table/TableTraits";
import { computed } from "mobx";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import { FeatureInfoTemplateTraits } from "../Traits/TraitsClasses/FeatureInfoTraits";
import StratumOrder from "../Models/Definition/StratumOrder";

export default class TableFeatureInfoStratum extends LoadableStratum(
  TableTraits
) {
  static stratumName = "tableFeatureInfo";
  constructor(readonly catalogItem: TableMixin.Instance) {
    super();
  }

  static load(item: TableMixin.Instance) {
    return new TableFeatureInfoStratum(item);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new TableFeatureInfoStratum(newModel as TableMixin.Instance) as this;
  }

  @computed
  get featureInfoTemplate() {
    let template = '<table class="cesium-infoBox-defaultTable">';

    template += this.catalogItem.tableColumns
      ?.map(
        (col) =>
          `<tr><td style="vertical-align: middle"><b>${col.title}</b></td><td>{{${col.name}}}</td></tr>`
      )
      .join("");

    // See tableFeatureInfoContext for how timeSeries chart is generated
    template += `</table>{{terria.timeSeries.chart}}`;

    return createStratumInstance(FeatureInfoTemplateTraits, {
      template,
      showFeatureInfoDownloadWithTemplate: true
    });
  }
}

StratumOrder.addLoadStratum(TableFeatureInfoStratum.stratumName);
