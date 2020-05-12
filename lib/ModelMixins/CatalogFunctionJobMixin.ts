import CatalogMemberMixin from "./CatalogMemberMixin";
import AutoRefreshingMixin from "./AutoRefreshingMixin";
import AsyncChartableMixin from "./AsyncChartableMixin";
import AsyncMappableMixin from "./AsyncMappableMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import { runInAction, action } from "mobx";
import CatalogFunctionJobTraits from "../Traits/CatalogFunctionJobTraits";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CreateModel from "../Models/CreateModel";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import isDefined from "../Core/isDefined";

const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

type CatalogFunctionJobMixin = Model<CatalogFunctionJobTraits>;

function CatalogFunctionJobMixin<
  T extends Constructor<CatalogFunctionJobMixin>
>(Base: T) {
  abstract class CatalogFunctionJobMixin extends AsyncChartableMixin(
    AsyncMappableMixin(AutoRefreshingMixin(CatalogMemberMixin(Base)))
  ) {
    protected init = false;

    readonly refreshInterval = 1;

    loadPromise = Promise.resolve();

    protected forceLoadMetadata() {
      const now = new Date();
      const timestamp = sprintf(
        "%04d-%02d-%02dT%02d:%02d:%02d",
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );

      const id = `${this.name} ${timestamp}`;

      if (isDefined(this.parameters)) {
        const inputsSection =
          '<table class="cesium-infoBox-defaultTable">' +
          Object.keys(this.parameters).reduce((previousValue, key) => {
            return (
              previousValue +
              "<tr>" +
              '<td style="vertical-align: middle">' +
              key +
              "</td>" +
              "<td>" +
              this.parameters![key] +
              "</td>" +
              "</tr>"
            );
          }, "") +
          "</table>";

        runInAction(() => {
          // CatalogFunctionJobJob!.setTrait(
          //   CommonStrata.user,
          //   "description",
          //   `This is the result of invoking the ${this.name} process or service at ${timestamp} with the input parameters below.`
          // );

          this.setTrait(CommonStrata.user, "info", [
            createStratumInstance(InfoSectionTraits, {
              name: "Inputs",
              content: inputsSection
            })
          ]);
        });
      }

      return this.loadPromise;
    }

    @action
    protected setOnError(errorMessage?: string) {
      this.setTrait(
        CommonStrata.user,
        "shortReport",
        `${this.type ||
          this
            .type} invocation failed. More details are available on the Info panel.`
      );

      const errorInfo = createStratumInstance(InfoSectionTraits, {
        name: "Error Details",
        content: errorMessage || "The reason for failure is unknown."
      });
      const info = this.getTrait(CommonStrata.user, "info");
      if (isDefined(info)) {
        info.push(errorInfo);
      }
    }

    get hasCatalogFunctionJobMixin() {
      return true;
    }
  }

  return CatalogFunctionJobMixin;
}

namespace CatalogFunctionJobMixin {
  export interface CatalogFunctionJobMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionJobMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionJobMixin {
    return model && model.hasCatalogFunctionJobMixin;
  }
}

export default CatalogFunctionJobMixin;
