import {
  computed,
  makeObservable,
  observable,
  override,
  runInAction
} from "mobx";
import {
  BaseModel,
  CatalogMemberFactory,
  CatalogMemberMixin,
  CommonStrata,
  CreateModel,
  MappableMixin,
  TerriaError
} from "terriajs-plugin-api";
import isDefined from "terriajs/lib/Core/isDefined";
import { JsonObject } from "terriajs/lib/Core/Json";
import CatalogFunctionJobMixin from "terriajs/lib/ModelMixins/CatalogFunctionJobMixin";
import createStratumInstance from "terriajs/lib/Models/Definition/createStratumInstance";
import LoadableStratum from "terriajs/lib/Models/Definition/LoadableStratum";
import { ModelConstructorParameters } from "terriajs/lib/Models/Definition/Model";
import StratumOrder from "terriajs/lib/Models/Definition/StratumOrder";
import upsertModelFromJson from "terriajs/lib/Models/Definition/upsertModelFromJson";
import ModelReference from "terriajs/lib/Traits/ModelReference";
import { InfoSectionTraits } from "terriajs/lib/Traits/TraitsClasses/CatalogMemberTraits";
import OgcProcessCatalogFunctionJobTraits from "../../../Traits/OgcProcessCatalogFunctionJobTraits";
import {
  client,
  failureStatus,
  OgcProcess,
  OgcProcessJob,
  OgcProcessJobResults,
  pendingStatus,
  successStatus
} from "./OgcProcess";
import OgcProcessCatalogFunction from "./OgcProcessCatalogFunction";
import OgcProcessSettings from "./OgcProcessSettings";

/**
 * @internal
 */
export default class OgcProcessCatalogFunctionJob extends CatalogFunctionJobMixin(
  CreateModel(OgcProcessCatalogFunctionJobTraits)
) {
  // TODO: ideally CatalogFunctionJobMixin should not automatically include MappableMixin
  // OgcProcessFunctionJob at least for now has no mappable inputs
  // and so we want to disable the preview map and add-to-map button in about-data view

  static readonly type = "ogc-process-job";

  private isRefreshingData = false;

  @observable
  public refreshAttempts = 0;

  get type() {
    return OgcProcessCatalogFunctionJob.type;
  }

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);

    this.strata.set(DefaultsStratum.stratumName, new DefaultsStratum());
  }

  protected async _invoke(): Promise<boolean> {
    return false;
  }

  async pollForResults(): Promise<boolean> {
    return true;
  }

  async downloadResults(): Promise<CatalogMemberMixin.Instance[] | void> {
    (await this.loadMembers()).raiseError(this.terria);
    return this.memberModels.filter(CatalogMemberMixin.isMixedInto);
  }

  protected async forceLoadMetadata() {
    if (!this.url || !this.jobId || !this.processId) {
      throw new TerriaError({
        message: `OgcProcessFunctionJob not set up correctly: Missing 'url', 'jobId' or 'processId'`
      });
    }

    const [jobMetadata, processMetadata] = await Promise.all([
      client.getJob(this, this.url, this.jobId),
      this.getProcessMetadata(this.url, this.processId)
    ]);

    const stratum = new MetadataStratum(this, jobMetadata, processMetadata);
    runInAction(() => {
      this.strata.set(MetadataStratum.stratumName, stratum);
    });
  }

  protected async forceLoadMembers() {
    if (!this.url || !this.jobId || !this.processId) {
      throw new TerriaError({
        message: `OgcProcessFunctionJob not set up correctly: Missing 'url', 'jobId' or 'processId'`
      });
    }

    if (this.jobStatus !== "finished") {
      return;
    }

    const [jobResults, processMetadata] = await Promise.all([
      client.getJobResults(this, this.url, this.jobId),
      this.getProcessMetadata(this.url, this.processId)
    ]);

    runInAction(() => {
      const resultsStratum = new ResultsStratum(
        this,
        jobResults,
        processMetadata
      );
      this.strata.set(ResultsStratum.stratumName, resultsStratum);
      const error = resultsStratum.createOutputMembers().error;
      if (error) {
        throw error;
      }
    });
  }

  private async getProcessMetadata(
    url: string,
    processId: string
  ): Promise<OgcProcess | undefined> {
    const result = OgcProcessCatalogFunction.getOrCreateModel(
      this.terria,
      this.processGroupId ?? url,
      processId,
      url
    );

    const processCatalogFunction = result.raiseError(this.terria);
    return processCatalogFunction?.getCachedProcessMetadata();
  }

  @override
  async refreshData() {
    if (this.isRefreshingData) {
      return;
    }

    this.isRefreshingData = true;
    this.refreshAttempts += 1;
    try {
      await this.forceLoadMetadata();
      if (this.jobStatus === "finished") {
        await this.loadMembers();

        // If this job itself is in workbench then automatically add the
        // results too when they become available. Otherwise, the job is only
        // being previewed from the catalog explorer, then we should do
        // nothing.
        if (this.terria.workbench.contains(this)) {
          this.memberModels.forEach((member) => {
            if (MappableMixin.isMixedInto(member)) {
              this.terria.workbench.add(member);
            }
          });
        }
      }
    } finally {
      runInAction(() => {
        this.isRefreshingData = false;
      });
    }
  }
}

class DefaultsStratum extends LoadableStratum(
  OgcProcessCatalogFunctionJobTraits
) {
  static stratumName = "ogcProcessJobDefaultsStratum";

  public duplicateLoadableStratum(newModel: BaseModel): this {
    return new DefaultsStratum(
      newModel as OgcProcessCatalogFunctionJob
    ) as this;
  }

  public get refreshInterval() {
    return 5;
  }

  get disableZoomTo() {
    return true;
  }

  get disablePreview() {
    // Disable preview map in about-data view until we have some way to show
    // visualize the job inputs
    return true;
  }
}

StratumOrder.addLoadStratum(DefaultsStratum.stratumName);

class MetadataStratum extends LoadableStratum(
  OgcProcessCatalogFunctionJobTraits
) {
  static readonly stratumName = "ogcProcessJobMetadataStratum";

  job: OgcProcessCatalogFunctionJob;
  jobMetadata: OgcProcessJob;
  processMetadata: OgcProcess | undefined;

  constructor(
    job: OgcProcessCatalogFunctionJob,
    jobMetadata: OgcProcessJob,
    processMetadata: OgcProcess | undefined
  ) {
    super();
    this.job = job;
    this.jobMetadata = jobMetadata;
    this.processMetadata = processMetadata;
  }

  public duplicateLoadableStratum(newModel: BaseModel): this {
    return new MetadataStratum(
      newModel as OgcProcessCatalogFunctionJob,
      this.jobMetadata,
      this.processMetadata
    ) as this;
  }

  /**
   * Name appearing in workbench, about data title etc.
   */
  @computed
  public get name() {
    const processName = this.processMetadata?.title?.concat(": ");
    return `${processName}${this.job.jobId}`;
  }

  /**
   * Name appearing in catalog tree.
   */
  @computed
  public get nameInCatalog() {
    return this.job.jobId;
  }

  @computed
  public get description() {
    return "Showing results for job.";
  }

  @computed
  public get refreshEnabled() {
    return (
      (this.job.jobStatus !== "finished" || !this.job.downloadedResults) &&
      this.job.refreshAttempts < OgcProcessSettings.maxJobRefreshAttempts
    );
  }

  @computed
  public get info() {
    return [
      this.processMetadata?.title
        ? createStratumInstance(InfoSectionTraits, {
            name: "Workflow",
            content: this.processLink
          })
        : undefined,
      createStratumInstance(InfoSectionTraits, this.jobDetails)
    ].filter(isDefined);
  }

  @computed
  public get infoSectionOrder(): string[] {
    return this.info.map((item) => item.name).filter(isDefined);
  }

  @computed
  private get processLink(): string | undefined {
    const { processGroupId, processId } = this.job;
    const title = this.processMetadata?.title;
    if (processGroupId && processId && title) {
      return `<processlink process-group-id="${processGroupId}" process-id="${processId}">${title}</processlink>`;
    }
  }

  @computed
  private get jobDetails() {
    const row = (name: string, value: string | number) =>
      `<dt style="font-weight:bold;">${name}:</dt><dd>${value}</dd>`;

    // TODO: this is an ugly way to show some formatted text - any other ideas?
    const metadata = this.jobMetadata;
    const rows = Object.keys(OgcProcessJob.shape).map((name) => {
      const value =
        name === "status"
          ? this.prettyStatus
          : metadata[name as keyof OgcProcessJob];

      const capitalisedName = name[0].toLocaleUpperCase() + name.slice(1);
      return value ? row(capitalisedName, value) : "";
    });

    const content = `<dl style="display:grid; grid-template-columns: max-content max-content; gap: 4px 8px;">${rows.join("")}</dl>`;
    return {
      name: "Job details",
      content
    };
  }

  @computed
  public get shortReport() {
    return this.prettyStatus;
  }

  // TODO: this should probably be done via translation strings
  @computed
  private get prettyStatus(): string {
    const status = this.jobMetadata.status;
    const symbol = successStatus.includes(status as any)
      ? "<span>✅</span>"
      : failureStatus.includes(status as any)
        ? "<span>❌</span>"
        : pendingStatus.includes(status as any)
          ? "<span>⚙️</span>"
          : "";
    const ellipsis = pendingStatus.includes(status as any) ? "..." : "";
    return `${symbol} Job ${status}${ellipsis}`;
  }

  @computed
  public get jobStatus() {
    const status = this.jobMetadata.status;
    return successStatus.includes(status as any)
      ? ("finished" as const)
      : failureStatus.includes(status as any)
        ? "error"
        : pendingStatus.includes(status as any)
          ? "running"
          : "inactive";
  }
}

StratumOrder.addLoadStratum(MetadataStratum.stratumName);

class ResultsStratum extends LoadableStratum(
  OgcProcessCatalogFunctionJobTraits
) {
  static stratumName = "ogcProcessJobResultsStratum";

  private job: OgcProcessCatalogFunctionJob;
  private results: Record<string, unknown>;
  private processMetadata: OgcProcess | undefined;

  @observable
  _memberIds: ModelReference[] = [];

  constructor(
    job: OgcProcessCatalogFunctionJob,
    results: OgcProcessJobResults,
    processMetadata: OgcProcess | undefined
  ) {
    super();
    this.job = job;
    this.results = results;
    this.processMetadata = processMetadata;

    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ResultsStratum(
      newModel as OgcProcessCatalogFunctionJob,
      this.results,
      this.processMetadata
    ) as this;
  }

  private createOutputDefinitions(): JsonObject[] {
    return Object.entries(this.results)
      .map(([outputName, outputValue]) => {
        const outputDefinition = this.processMetadata?.outputs[outputName];
        const terriaDefinition =
          OgcProcessSettings.OutputMapper.toOutputDefinition(
            outputValue,
            outputDefinition
          );

        if (!terriaDefinition) {
          return;
        }

        return {
          ...terriaDefinition,
          id: `${this.job.uniqueId}/${outputName}`,
          name: this.processMetadata?.outputs[outputName].title ?? outputName,
          description: this.processMetadata?.outputs[outputName].description
        };
      })
      .filter(isDefined);
  }

  /**
   * @internal
   */
  public createOutputMembers(): {
    members: BaseModel[];
    error?: TerriaError;
  } {
    const outputDefinitions = this.createOutputDefinitions();
    const errors: TerriaError[] = [];
    const members = outputDefinitions
      .map((terriaDefinition) =>
        upsertModelFromJson(
          CatalogMemberFactory,
          this.job.terria,
          this.job.uniqueId ?? "",
          CommonStrata.definition,
          terriaDefinition
        ).pushErrorTo(errors)
      )
      .filter(isDefined);

    runInAction(() => {
      this._memberIds = members.map((m) => m.uniqueId).filter(isDefined);
    });

    return {
      members,
      error: TerriaError.combine(errors, {
        message: "There were errors when loading results"
      })
    };
  }

  @computed
  get members(): ModelReference[] {
    return this._memberIds;
  }

  get downloadedResults() {
    return true;
  }
}

StratumOrder.addLoadStratum(ResultsStratum.stratumName);
