import CatalogMemberMixin from "./CatalogMemberMixin";
import AutoRefreshingMixin from "./AutoRefreshingMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import { runInAction, action } from "mobx";
import CatalogFunctionJobTraits from "../Traits/CatalogFunctionJobTraits";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import isDefined from "../Core/isDefined";

type CatalogFunctionJobMixin = Model<CatalogFunctionJobTraits>;

function CatalogFunctionJobMixin<
  T extends Constructor<CatalogFunctionJobMixin>
>(Base: T) {
  abstract class CatalogFunctionJobMixin extends AutoRefreshingMixin(
    CatalogMemberMixin(Base)
  ) {
    protected init = false;

    abstract async invoke(): Promise<void>;

    /**
     * Called every refreshInterval - return indicates whether job has finished (true = finished)
     */
    abstract async pollForResults(): Promise<boolean>;

    /**
     * This function adapts AutoRefreshMixin's refreshData with this Mixin's pollForResults - adding the boolean return value which triggers refresh disable
     */
    refreshData() {
      this.pollForResults().then(finished => {
        if (finished) {
          runInAction(() =>
            this.setTrait(CommonStrata.user, "refreshEnabled", false)
          );
        }
      });
    }

    loadPromise = Promise.resolve();

    protected forceLoadMetadata() {
      if (this.jobStatus === "running" && !this.refreshEnabled) {
        runInAction(() =>
          this.setTrait(CommonStrata.user, "refreshEnabled", true)
        );
      }

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

        console.log(inputsSection);

        runInAction(() => {
          this.setTrait(
            CommonStrata.user,
            "description",
            `This is the result of invoking ${this.name} with the input parameters below.`
          );

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
