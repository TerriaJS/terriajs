import { computed, makeObservable } from "mobx";
import {
  BaseModel,
  CommonStrata,
  CreateModel,
  Model,
  ReferenceMixin,
  TerriaError
} from "terriajs-plugin-api";
import { ModelConstructorParameters } from "terriajs/lib/Models/Definition/Model";
import UrlTraits from "terriajs/lib/Traits/TraitsClasses/UrlTraits";
import OgcProcessJobReferenceTraits from "../../../Traits/OgcProcessJobReferenceTraits";
import OgcProcessCatalogFunctionJob from "./OgcProcessCatalogFunctionJob";
import OgcProcessCatalogGroup from "./OgcProcessCatalogGroup";

/**
 * @internal
 *
 * Reference to a job.
 */
export default class OgcProcessJobReference extends ReferenceMixin(
  CreateModel(OgcProcessJobReferenceTraits)
) {
  static readonly type = "ogc-process-job-reference";

  get type() {
    return OgcProcessJobReference.type;
  }

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  protected async forceLoadReference(
    _previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    const url = this.processGroup?.url;
    if (!url || !this.uniqueId || !this.jobId || !this.processId) {
      throw new TerriaError({
        message: "Job reference is not setup correctly"
      });
    }

    const job = new OgcProcessCatalogFunctionJob(
      this.uniqueId,
      this.terria,
      this
    );
    job.setTrait(CommonStrata.definition, "url", url);
    job.setTrait(CommonStrata.definition, "jobId", this.jobId);
    job.setTrait(CommonStrata.definition, "processId", this.processId);
    job.setTrait(
      CommonStrata.definition,
      "processGroupId",
      this.processGroupId
    );
    return job;
  }

  @computed
  private get processGroup(): Model<UrlTraits> | undefined {
    return this.processGroupId
      ? this.terria.getModelById(OgcProcessCatalogGroup, this.processGroupId)
      : undefined;
  }
}
