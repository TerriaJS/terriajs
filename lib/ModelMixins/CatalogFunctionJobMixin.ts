import { action, computed, observable, reaction, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import LoadableStratum from "../Models/LoadableStratum";
import { MapItem } from "../Models/Mappable";
import Model, { BaseModel } from "../Models/Model";
import StratumOrder from "../Models/StratumOrder";
import CatalogFunctionJobTraits from "../Traits/CatalogFunctionJobTraits";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import AsyncMappableMixin from "./AsyncMappableMixin";
import AutoRefreshingMixin from "./AutoRefreshingMixin";
import CatalogMemberMixin from "./CatalogMemberMixin";

class FunctionJobStratum extends LoadableStratum(CatalogFunctionJobTraits) {
  constructor(
    readonly catalogFunctionJob: CatalogFunctionJobMixin.CatalogFunctionJobMixin
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new FunctionJobStratum(
      model as CatalogFunctionJobMixin.CatalogFunctionJobMixin
    ) as this;
  }

  @computed
  get shortReportSections() {
    if (this.catalogFunctionJob.logs.length === 0) return;
    return [
      {
        name: "Job Logs",
        content: this.catalogFunctionJob.logs.join("\n"),
        show: true
      }
    ];
  }

  @computed
  get shortReport() {
    let content = "";
    if (this.catalogFunctionJob.jobStatus === "inactive") {
      content = "Job is inactive";
    } else if (this.catalogFunctionJob.jobStatus === "running") {
      content = "Job is running...";
    } else if (this.catalogFunctionJob.jobStatus === "finished") {
      if (this.catalogFunctionJob.downloadedResults) {
        content = "Job is finished";
      } else {
        content = "Job is finished, downloading results...";
      }
    } else {
      content = "An error has occurred";
    }
    return content;
  }

  @computed
  get description() {
    return `This is the result of invoking ${this.catalogFunctionJob.name} with the input parameters below.`;
  }

  @computed
  get info() {
    if (isDefined(this.catalogFunctionJob.parameters)) {
      const inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        Object.keys(this.catalogFunctionJob.parameters).reduce(
          (previousValue, key) => {
            return (
              previousValue +
              "<tr>" +
              '<td style="vertical-align: middle">' +
              key +
              "</td>" +
              "<td>" +
              this.catalogFunctionJob.parameters![key] +
              "</td>" +
              "</tr>"
            );
          },
          ""
        ) +
        "</table>";

      return [
        createStratumInstance(InfoSectionTraits, {
          name: "Inputs",
          content: inputsSection
        })
      ];
    }
  }
}

type CatalogFunctionJobMixin = Model<CatalogFunctionJobTraits>;

function CatalogFunctionJobMixin<
  T extends Constructor<CatalogFunctionJobMixin>
>(Base: T) {
  abstract class CatalogFunctionJobMixin extends AutoRefreshingMixin(
    CatalogMemberMixin(Base)
  ) {
    private init = false;

    /**
     *
     * @returns true for FINISHED, false for RUNNING (will then call pollForResults)
     */
    protected abstract async _invoke(): Promise<boolean>;

    public async invoke() {
      this.setTrait(CommonStrata.user, "jobStatus", "running");
      try {
        const finished = await this._invoke();
        if (finished) {
          this.setTrait(CommonStrata.user, "jobStatus", "finished");
        } else {
          this.setTrait(CommonStrata.user, "refreshEnabled", true);
        }
      } catch (error) {
        this.setTrait(CommonStrata.user, "jobStatus", "error");
        throw error; // throw error to CatalogFunctionMixin
      }
    }

    private async onJobStatusChanged() {
      // Download results when finished
      if (
        this.jobStatus === "finished" &&
        !this._downloadedResults &&
        !this.downloadingResults
      ) {
        this.downloadingResults = true;
        try {
          this.results = (await this.downloadResults()) || [];
          this.results.forEach(result => {
            this.terria.workbench.add(result);
            this.terria.catalog.userAddedDataGroup.add(
              CommonStrata.user,
              result
            );
          });
          runInAction(() => (this._downloadedResults = true));

          this.downloadingResults = false;
        } catch (error) {
          this.downloadingResults = false;
          throw error;
        }
        // Poll for results when running
      } else if (this.jobStatus === "running" && !this.refreshEnabled) {
        runInAction(() =>
          this.setTrait(CommonStrata.user, "refreshEnabled", true)
        );
      }
    }

    /**
     * Job result CatalogMembers - set from calling {@link CatalogFunctionJobMixin#downloadResults}
     */
    public results: CatalogMemberMixin.CatalogMemberMixin[] = [];

    /**
     * Flag to make sure results aren't downloaded multiple times
     */
    private downloadingResults = false;

    /**
     * Flag if results have been downloaded. This is used to recover results after sharing a Catalog Function - eg if `jobStatus = "finished"` and `_downloadedResults = false`, then we download results!
     */
    @observable protected _downloadedResults = false;

    @computed
    get downloadedResults() {
      return this._downloadedResults;
    }

    /**
     * Called when `jobStatus` is `finished`, and `!_downloadedResults`
     * @returns catalog members to add to workbench
     */
    abstract async downloadResults(): Promise<
      CatalogMemberMixin.CatalogMemberMixin[] | void
    >;

    get refreshInterval() {
      return 2;
    }

    private pollingForResults = false;

    /**
     * Called every refreshInterval
     *
     * @return true if job has finished, false otherwise
     */
    async pollForResults(): Promise<boolean> {
      throw "pollForResults not implemented";
    }

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
            this.setOnError(error);
          });
          this.pollingForResults = false;
        });
    }

    @action
    protected setOnError(errorMessage?: string) {
      isDefined(errorMessage) &&
        this.setTrait(CommonStrata.user, "logs", [...this.logs, errorMessage]);
      this.setTrait(
        CommonStrata.user,
        "shortReport",
        `${this.typeName ||
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

    get mapItems(): MapItem[] {
      return [];
    }
    protected async forceLoadMapItems() {
      return this.loadMetadata();
    }

    protected async forceLoadMetadata() {
      if (!this.init) {
        this.init = true;

        // Add FunctionJobStratum to strata
        runInAction(() => {
          this.strata.set(
            FunctionJobStratum.name,
            new FunctionJobStratum(this)
          );
        });

        // Handle changes in job status
        await this.onJobStatusChanged();
        reaction(() => this.jobStatus, this.onJobStatusChanged.bind(this));

        // If this is showing in workbench, make sure result layers are also in workbench
        reaction(
          () => this.inWorkbench,
          inWorkbench => {
            if (inWorkbench) {
              this.results.forEach(
                result =>
                  this.terria.workbench.contains(result) ||
                  runInAction(() => this.terria.workbench.add(result))
              );
            }
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
      return;
    }

    get hasCatalogFunctionJobMixin() {
      return true;
    }
  }

  return CatalogFunctionJobMixin;
}

namespace CatalogFunctionJobMixin {
  StratumOrder.addLoadStratum(FunctionJobStratum.name);
  export interface CatalogFunctionJobMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionJobMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionJobMixin {
    return model && model.hasCatalogFunctionJobMixin;
  }
}

export default CatalogFunctionJobMixin;
