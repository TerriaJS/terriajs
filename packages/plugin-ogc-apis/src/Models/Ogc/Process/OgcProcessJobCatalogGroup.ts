import { computed, makeObservable, observable, runInAction } from "mobx";
import {
  BaseModel,
  CatalogMemberFactory,
  CatalogMemberMixin,
  CommonStrata,
  CreateModel,
  Model,
  TerriaError
} from "terriajs-plugin-api";
import { JsonObject } from "terriajs/lib/Core/Json";
import Result from "terriajs/lib/Core/Result";
import GroupMixin from "terriajs/lib/ModelMixins/GroupMixin";
import hasTraits from "terriajs/lib/Models/Definition/hasTraits";
import LoadableStratum from "terriajs/lib/Models/Definition/LoadableStratum";
import { ModelConstructorParameters } from "terriajs/lib/Models/Definition/Model";
import StratumOrder from "terriajs/lib/Models/Definition/StratumOrder";
import upsertModelFromJson from "terriajs/lib/Models/Definition/upsertModelFromJson";
import ModelReference from "terriajs/lib/Traits/ModelReference";
import UrlTraits from "terriajs/lib/Traits/TraitsClasses/UrlTraits";
import capitalize from "../../../Core/capitalize";
import OgcProcessJobCatalogGroupTraits from "../../../Traits/OgcProcessJobCatalogGroupTraits";
import { client, jobStatus, OgcProcessJobSummary } from "./OgcProcess";
import OgcProcessJobReference from "./OgcProcessJobReference";

const defaultJobsNamespace = "ogc-process-jobs";

/**
 * @internal
 */
export default class OgcProcessJobCatalogGroup extends GroupMixin(
  CatalogMemberMixin(CreateModel(OgcProcessJobCatalogGroupTraits))
) {
  static readonly type = "ogc-process-job-group";

  get type() {
    return OgcProcessJobCatalogGroup.type;
  }

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  protected async forceLoadMembers(): Promise<void> {
    const url = this.url ?? this.processGroup?.url;
    if (!url) {
      throw new TerriaError({ message: "Job group is not set up correctly." });
    }

    const groupByType = this.groupByType ?? "flat";
    if (groupByType === "flat") {
      const jobSummaries = await client.listJobSummaries(this, url, {
        queryParameters: this.queryParameters
      });
      runInAction(() =>
        this.strata.set(
          JobListStratum.stratumName,
          new JobListStratum(this, jobSummaries.jobs)
        )
      );
    } else if (groupByType === "process" || groupByType === "status") {
      const jobGroupStratum = new JobGroupStratum(this, url);
      await jobGroupStratum.loadJobGroups(groupByType);
      this.strata.set(JobGroupStratum.stratumName, jobGroupStratum);
    } else {
      throw new TerriaError({
        message: `Invalid process group type: ${groupByType}`
      });
    }
  }

  @computed
  private get processGroup(): Model<UrlTraits> | undefined {
    const processGroup = this.processGroupId
      ? this.terria.getModelById(BaseModel, this.processGroupId)
      : undefined;
    return hasTraits(processGroup, UrlTraits, "url")
      ? (processGroup as Model<UrlTraits>)
      : undefined;
  }
}

class JobGroupStratum extends LoadableStratum(OgcProcessJobCatalogGroupTraits) {
  static readonly stratumName = "ogcProcessJobGroupStratum";

  private readonly group: OgcProcessJobCatalogGroup;
  private readonly apiUrl: string;

  @observable
  _members: ModelReference[] = [];

  constructor(group: OgcProcessJobCatalogGroup, apiUrl: string) {
    super();

    this.group = group;
    this.apiUrl = apiUrl;
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new JobGroupStratum(
      newModel as OgcProcessJobCatalogGroup,
      this.apiUrl
    ) as this;
  }

  async loadJobGroups(
    groupByType: "process" | "status"
  ): Promise<Result<unknown>> {
    const url = this.apiUrl;
    if (!url) {
      throw new TerriaError({ message: "Job group is not set up correctly." });
    }

    if (groupByType === "process") {
      return Result.combine(await this.loadProcesses(url), {});
    } else if (groupByType === "status") {
      return Result.combine(await this.loadStatusGroups(url), {});
    }

    return Result.error({
      message: `Invalid process group type: ${groupByType}`
    });
  }

  private async loadProcesses(
    url: string
  ): Promise<Result<BaseModel | undefined>[]> {
    const processes = await client.listProcessSummaries(this.group, url);
    return processes.processes.map((p) => {
      return this.createMember({
        localId: p.id,
        name: p.title,
        description: p.description,
        url,
        queryParameters: {
          processID: p.id
        }
      });
    });
  }

  private async loadStatusGroups(
    url: string
  ): Promise<Result<BaseModel | undefined>[]> {
    return jobStatus.map((status) =>
      this.createMember({
        localId: status,
        name: capitalize(status),
        description: `${capitalize(status)} jobs`,
        url: url,
        queryParameters: {
          status
        }
      })
    );
  }

  private createMember(desc: {
    localId: string;
    url: string;
    name: string | undefined;
    description: string | undefined;
    queryParameters: JsonObject;
  }): Result<BaseModel | undefined> {
    const result = upsertModelFromJson(
      CatalogMemberFactory,
      this.group.terria,
      this.group.uniqueId ?? "/",
      CommonStrata.definition,
      {
        ...desc,
        queryParameters: {
          ...this.group.queryParameters,
          ...desc.queryParameters
        },
        type: OgcProcessJobCatalogGroup.type,
        processGroupId: this.group.processGroupId
      }
    );

    const value = result.ignoreError();
    if (value?.uniqueId) {
      this._members.push(value.uniqueId);
    }
    return result;
  }

  get members() {
    return this._members;
  }
}

StratumOrder.addLoadStratum(JobGroupStratum.stratumName);

class JobListStratum extends LoadableStratum(OgcProcessJobCatalogGroupTraits) {
  static readonly stratumName = "ogcProcessJobListStratum";

  private readonly jobSummaries: OgcProcessJobSummary[];
  private readonly group: OgcProcessJobCatalogGroup;

  constructor(
    group: OgcProcessJobCatalogGroup,
    jobSummaries: OgcProcessJobSummary[]
  ) {
    super();
    this.group = group;
    this.jobSummaries = jobSummaries;
    this.createMembersForJobs();
    makeObservable(this);
  }

  public duplicateLoadableStratum(newModel: BaseModel): this {
    return new JobListStratum(
      newModel as OgcProcessJobCatalogGroup,
      this.jobSummaries
    ) as this;
  }

  private createMembersForJobs() {
    this.jobSummaries.forEach((summary) => {
      return upsertModelFromJson(
        CatalogMemberFactory,
        this.group.terria,
        this.group.uniqueId ?? "",
        CommonStrata.definition,
        {
          type: OgcProcessJobReference.type,
          id: this.makeNamespacedId(summary.jobID),
          jobId: summary.jobID,
          processId: summary.processID,
          processGroupId: this.group.processGroupId,
          name: summary.jobID
        }
      );
    });
  }

  @computed
  get members() {
    return this.jobSummaries.map((job) => this.makeNamespacedId(job.jobID));
  }

  private makeNamespacedId(jobId: string) {
    const namespace =
      this.group.processGroupId ?? this.group.uniqueId ?? defaultJobsNamespace;
    return [namespace, jobId].join(":");
  }

  @computed
  get description() {
    return `Showing ${this.members.length} recent jobs.`;
  }
}

StratumOrder.addLoadStratum(JobListStratum.stratumName);
