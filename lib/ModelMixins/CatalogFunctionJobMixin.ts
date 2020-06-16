import CatalogMemberMixin from "./CatalogMemberMixin";
import AutoRefreshingMixin from "./AutoRefreshingMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import {
  runInAction,
  action,
  reaction,
  computed,
  observable,
  IObservableArray,
  onBecomeObserved
} from "mobx";
import CatalogFunctionJobTraits from "../Traits/CatalogFunctionJobTraits";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import isDefined from "../Core/isDefined";
import AsyncMappableMixin from "./AsyncMappableMixin";
import runLater from "../Core/runLater";

type CatalogFunctionJobMixin = Model<CatalogFunctionJobTraits>;

function CatalogFunctionJobMixin<
  T extends Constructor<CatalogFunctionJobMixin>
>(Base: T) {
  abstract class CatalogFunctionJobMixin extends AutoRefreshingMixin(
    CatalogMemberMixin(Base)
  ) {
    constructor(...args: any[]) {
      super(...args);

      // If this is showing in workbench, make sure result layers are also in workbench
      onBecomeObserved(this, "mapItems", () => {
        runLater(() =>
          this.results.forEach(
            result =>
              this.terria.workbench.contains(result) ||
              runInAction(() => this.terria.workbench.add(result))
          )
        );
      });

      // Handle changes in job status
      reaction(
        () => this.jobStatus,
        async () => {
          // Download results when finished
          if (this.jobStatus === "finished" && !this.downloadedResults) {
            this.downloadedResults = true;
            this.results = (await this.downloadResults()) || [];
            this.results.forEach(result => {
              this.terria.workbench.add(result);
              this.terria.catalog.userAddedDataGroup.add(
                CommonStrata.user,
                result
              );
            });
            // Poll for results when running
          } else if (this.jobStatus === "running" && !this.refreshEnabled) {
            runInAction(() =>
              this.setTrait(CommonStrata.user, "refreshEnabled", true)
            );
          }
        }
      );

      // Update logs
      reaction(
        () => this.logs.map(log => log),
        () => {
          this.updateLogsShortReport();
        }
      );

      // Propagate show to result layer's show
      reaction(
        () => this.show,
        () => {
          this.results.forEach(result => {
            if (AsyncMappableMixin.isMixedInto(result)) {
              result.setTrait(CommonStrata.user, "show", this.show);
            }
            this.terria.workbench.add(result);
          });
        }
      );
    }

    protected results: CatalogMemberMixin.CatalogMemberMixin[] = [];

    @observable private downloadedResults = false;
    private pollingForResults = false;

    protected logs: IObservableArray<string> = observable([]);

    /**
     *
     * @returns true for FINISHED, false for RUNNING (will then call pollForResults)
     */
    abstract async invoke(): Promise<boolean>;

    /**
     * Called every refreshInterval - return indicates whether job has finished (true = finished)
     */
    abstract async pollForResults(): Promise<boolean>;

    abstract async downloadResults(): Promise<
      CatalogMemberMixin.CatalogMemberMixin[] | void
    >;

    /**
     * This function adapts AutoRefreshMixin's refreshData with this Mixin's pollForResults - adding the boolean return value which triggers refresh disable
     */
    refreshData() {
      if (this.jobStatus !== "running") {
        runInAction(() =>
          this.setTrait(CommonStrata.user, "jobStatus", "running")
        );
      }
      if (this.pollingForResults) {
        return;
      }

      this.pollingForResults = true;

      this.pollForResults()
        .then(finished => {
          if (finished) {
            runInAction(() => {
              this.setTrait(CommonStrata.user, "jobStatus", "finished");
              this.setTrait(CommonStrata.user, "refreshEnabled", false);
            });
          }
          this.pollingForResults = false;
        })
        .catch(error => {
          runInAction(() => {
            this.setTrait(CommonStrata.user, "jobStatus", "error");
            this.setTrait(CommonStrata.user, "refreshEnabled", false);
            this.logs.push(error);
          });
          this.pollingForResults = false;

          console.log(error);
        });
    }

    loadPromise = Promise.resolve();

    protected forceLoadMetadata() {
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

    @computed
    get shortReport() {
      let content = "";
      if (this.jobStatus === "inactive") {
        content = "Job is inactive";
      } else if (this.jobStatus === "running") {
        content = "Job is running...";
      } else if (this.jobStatus === "finished") {
        if (this.downloadedResults) {
          content = "Job is finished";
        } else {
          content = "Job is finished, downloading results...";
        }
      } else {
        content = "An error has occurred";
      }
      return content;
    }

    @action
    updateLogsShortReport() {
      if (this.logs.length === 0) {
        return;
      }

      let report = this.shortReportSections.find(
        report => report.name === "Job Logs"
      );

      if (!isDefined(report)) {
        report = this.addObject(
          CommonStrata.user,
          "shortReportSections",
          "Job Logs"
        );
        if (!isDefined(report)) {
          return;
        }
      }

      report.setTrait(CommonStrata.user, "content", this.logs.join("\n"));
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
