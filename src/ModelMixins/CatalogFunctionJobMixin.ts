import {
  action,
  computed,
  observable,
  runInAction,
  makeObservable
} from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "../Models/Definition/CommonStrata";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import Model, { BaseModel } from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import CatalogFunctionJobTraits from "../Traits/TraitsClasses/CatalogFunctionJobTraits";
import { InfoSectionTraits } from "../Traits/TraitsClasses/CatalogMemberTraits";
import AutoRefreshingMixin from "./AutoRefreshingMixin";
import CatalogMemberMixin from "./CatalogMemberMixin";
import GroupMixin from "./GroupMixin";
import MappableMixin, { MapItem } from "./MappableMixin";

class FunctionJobStratum extends LoadableStratum(CatalogFunctionJobTraits) {
  constructor(readonly catalogFunctionJob: CatalogFunctionJobMixin.Instance) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new FunctionJobStratum(
      model as CatalogFunctionJobMixin.Instance
    ) as this;
  }

  @computed
  override get shortReportSections() {
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
  override get shortReport() {
    let content = "";
    if (this.catalogFunctionJob.jobStatus === "inactive") {
      content = "Job is inactive";
    } else if (this.catalogFunctionJob.jobStatus === "running") {
      content = "Job is running...";
      // If job is running, but not polling - then warn user to not leave the page
      if (!this.catalogFunctionJob.refreshEnabled) {
        content +=
          "\n\nPlease do not leave this page &mdash; or results may be lost";
      }
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
  override get description() {
    if (this.catalogFunctionJob.jobStatus === "finished")
      return `This is the result of invoking ${this.catalogFunctionJob.name} with the input parameters below.`;
  }

  @computed
  override get info() {
    if (
      isDefined(this.catalogFunctionJob.parameters) &&
      Object.values(this.catalogFunctionJob.parameters).length > 0
    ) {
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

StratumOrder.addLoadStratum(FunctionJobStratum.name);

type BaseType = Model<CatalogFunctionJobTraits>;

function CatalogFunctionJobMixin<T extends AbstractConstructor<BaseType>>(
  Base: T
) {
  abstract class CatalogFunctionJobMixin extends GroupMixin(
    AutoRefreshingMixin(MappableMixin(CatalogMemberMixin(Base)))
  ) {
    constructor(...args: any[]) {
      super(...args);

      makeObservable(this);

      // Add FunctionJobStratum to strata
      runInAction(() => {
        this.strata.set(FunctionJobStratum.name, new FunctionJobStratum(this));
      });
    }

    /**
     *
     * @returns true for FINISHED, false for RUNNING (will then call pollForResults)
     */
    abstract _protected_invoke(): Promise<boolean>;

    public async invoke() {
      this.setTrait(CommonStrata.user, "jobStatus", "running");
      try {
        const finished = await runInAction(() => this._protected_invoke());
        if (finished) {
          this.setTrait(CommonStrata.user, "jobStatus", "finished");
          await this._private_onJobFinish(true);
        } else {
          this.setTrait(CommonStrata.user, "refreshEnabled", true);
        }
      } catch (error) {
        this.setTrait(CommonStrata.user, "jobStatus", "error");
        // Note: we set raiseToUser argument as false here, as it is handled in CatalogFunctionMixin.submitJob()
        this._protected_setOnError(error, false);
        throw error;
      }
    }

    get refreshInterval() {
      return 2;
    }

    _private_pollingForResults = false;

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
    @action
    refreshData() {
      if (this._private_pollingForResults) {
        return;
      }

      this._private_pollingForResults = true;

      (async () => {
        try {
          const finished = await this.pollForResults();

          if (finished) {
            runInAction(() => {
              this.setTrait(CommonStrata.user, "jobStatus", "finished");
              this.setTrait(CommonStrata.user, "refreshEnabled", false);
            });
            await this._private_onJobFinish(true);
          }
          this._private_pollingForResults = false;
        } catch (error) {
          runInAction(() => {
            this.setTrait(CommonStrata.user, "jobStatus", "error");
            this.setTrait(CommonStrata.user, "refreshEnabled", false);
            this._protected_setOnError(error);
          });
          this._private_pollingForResults = false;
        }
      })();
    }

    _private_downloadingResults = false;

    /**
     * This handles downloading job results, it can be triggered three ways:
     * - `_invoke` returns true {@link CatalogFunctionJobMixin#invoke}
     * - `pollForResults` returns true {@link CatalogFunctionJobMixin#refreshData}
     * - on `loadMetadata` if `jobStatus` is "finished", and `!downloadedResults`  {@link CatalogFunctionJobMixin#forceLoadMetadata}
     */
    async _private_onJobFinish(addResultsToWorkbench = this.inWorkbench) {
      // Download results when finished
      if (
        this.jobStatus === "finished" &&
        !this.downloadedResults &&
        !this._private_downloadingResults
      ) {
        this._private_downloadingResults = true;
        this.results = (await this.downloadResults()) || [];
        this.results.forEach((result) => {
          if (MappableMixin.isMixedInto(result))
            result.setTrait(CommonStrata.user, "show", true);
          if (addResultsToWorkbench)
            this.terria.workbench
              .add(result)
              .then((r) => r.raiseError(this.terria));

          this.terria.addModel(result);
        });

        runInAction(() => {
          this.setTrait(
            CommonStrata.user,
            "members",
            filterOutUndefined(this.results.map((result) => result.uniqueId))
          );
          this.setTrait(CommonStrata.user, "downloadedResults", true);
        });
        this._private_downloadingResults = false;
      }
    }

    /**
     * Job result CatalogMembers - set from calling {@link CatalogFunctionJobMixin#downloadResults}
     */
    @observable
    public results: CatalogMemberMixin.Instance[] = [];

    /**
     * Called in {@link CatalogFunctionJobMixin#onJobFinish}
     * @returns catalog members to add to workbench
     */
    abstract downloadResults(): Promise<CatalogMemberMixin.Instance[] | void>;

    @action
    _protected_setOnError(error: unknown, raiseToUser: boolean = true) {
      const terriaError = TerriaError.from(error, {
        title: "Job failed",
        message: `An error has occurred while executing \`${this.name}\` job`,
        importance: -1
      });
      const errorMessage = terriaError.highestImportanceError.message;

      this.setTrait(CommonStrata.user, "logs", [...this.logs, errorMessage]);

      this.setTrait(
        CommonStrata.user,
        "shortReport",
        `${
          this.typeName || this.type
        } invocation failed. More details are available on the Info panel.`
      );

      const errorInfo = createStratumInstance(InfoSectionTraits, {
        name: `${this.typeName || this.type} invocation failed.`,
        content: errorMessage ?? "The reason for failure is unknown."
      });

      const info = this.getTrait(CommonStrata.user, "info");
      if (isDefined(info)) {
        info.push(errorInfo);
      } else {
        this.setTrait(CommonStrata.user, "info", [errorInfo]);
      }

      if (raiseToUser) this.terria.raiseErrorToUser(terriaError);
    }

    @computed
    get mapItems(): MapItem[] {
      return [];
    }
    override async _protected_forceLoadMapItems() {}

    override async _protected_forceLoadMetadata() {
      if (this.jobStatus === "finished" && !this.downloadedResults) {
        await this._private_onJobFinish();
      }
    }

    async _protected_forceLoadMembers() {}

    get hasCatalogFunctionJobMixin() {
      return true;
    }
  }

  return CatalogFunctionJobMixin;
}

namespace CatalogFunctionJobMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof CatalogFunctionJobMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCatalogFunctionJobMixin;
  }
}

export default CatalogFunctionJobMixin;
