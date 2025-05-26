import { computed, makeObservable } from "mobx";
import { FEATURE_ID_PROP } from "../ModelMixins/GeojsonMixin";
import TableMixin from "../ModelMixins/TableMixin";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import { FeatureInfoTemplateTraits } from "../Traits/TraitsClasses/FeatureInfoTraits";
import TableTraits from "../Traits/TraitsClasses/Table/TableTraits";

export default class TableFeatureInfoStratum extends LoadableStratum(
  TableTraits
) {
  static stratumName = "tableFeatureInfo";
  constructor(readonly catalogItem: TableMixin.Instance) {
    super();
    makeObservable(this);
  }

  static load(item: TableMixin.Instance): TableFeatureInfoStratum {
    return new TableFeatureInfoStratum(item);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new TableFeatureInfoStratum(newModel as TableMixin.Instance) as this;
  }

  @computed
  get featureInfoTemplate() {
    let template = '<table class="cesium-infoBox-defaultTable">';

    template += this.catalogItem.tableColumns
      ?.filter((col) => col.name !== FEATURE_ID_PROP)
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
