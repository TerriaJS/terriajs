import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction
} from "mobx";
import {
  CatalogMemberFactory,
  CommonStrata,
  CreateModel,
  Terria,
  TerriaError,
  updateModelFromJson
} from "terriajs-plugin-api";
import isDefined from "terriajs/lib/Core/isDefined";
import Result from "terriajs/lib/Core/Result";
import CatalogFunctionMixin from "terriajs/lib/ModelMixins/CatalogFunctionMixin";
import GroupMixin from "terriajs/lib/ModelMixins/GroupMixin";
import LoadableStratum from "terriajs/lib/Models/Definition/LoadableStratum";
import {
  BaseModel,
  ModelConstructorParameters
} from "terriajs/lib/Models/Definition/Model";
import ModelPropertiesFromTraits from "terriajs/lib/Models/Definition/ModelPropertiesFromTraits";
import StratumOrder from "terriajs/lib/Models/Definition/StratumOrder";
import upsertModelFromJson from "terriajs/lib/Models/Definition/upsertModelFromJson";
import * as z from "zod";
import OgcProcessCatalogFunctionTraits from "../../../Traits/OgcProcessCatalogFunctionTraits";
import { InputField } from "../UiElements";
import { client, failureStatus, OgcProcess } from "./OgcProcess";
import OgcProcessCatalogFunctionJob from "./OgcProcessCatalogFunctionJob";
import OgcProcessJobReference from "./OgcProcessJobReference";
import OgcProcessSettings from "./OgcProcessSettings";

/**
 * @internal
 */
export default class OgcProcessCatalogFunction extends CatalogFunctionMixin(
  CreateModel(OgcProcessCatalogFunctionTraits)
) {
  static readonly type = "ogc-process";

  @observable
  private process: OgcProcess | undefined;

  private processMetadataPromise: Promise<OgcProcess> | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type(): string {
    return OgcProcessCatalogFunction.type;
  }

  get functionParameters() {
    return [];
  }

  protected async forceLoadMetadata() {
    if (!this.url || !this.processId) {
      console.error(
        `Missing 'url' or 'processId' for the process: ${this.uniqueId}`
      );
      return;
    }

    const process = await this.getCachedProcessMetadata({ reload: true });
    runInAction(() => {
      this.process = process;
      this.strata.set(
        MetadataStratum.stratumName,
        new MetadataStratum(this, process)
      );
    });
  }

  public async getCachedProcessMetadata(options?: {
    reload: boolean;
  }): Promise<OgcProcess> {
    if (!options?.reload && this.processMetadataPromise) {
      return this.processMetadataPromise;
    }

    if (!this.url || !this.processId) {
      throw new TerriaError({
        message:
          "OgcProcessCatalogFunction not set up correctly. Missing `url` or `processId`."
      });
    }
    this.processMetadataPromise = client.getProcess(
      this,
      this.url,
      this.processId
    );
    return this.processMetadataPromise;
  }

  @computed
  get inputFields(): InputField[] {
    return Object.entries(this.process?.inputs ?? {})
      .map(([id, def]) => {
        let zodSchema: z.ZodType | undefined;
        try {
          zodSchema = z.fromJSONSchema(def.schema);
          if (def.minOccurs === 0) {
            zodSchema = zodSchema.optional();
          }
        } catch (err) {
          console.log(err);
        }

        return OgcProcessSettings.FieldMapper.toInputField({
          id,
          name: def.title,
          description: def.description,
          minOccurs: def.minOccurs,
          maxOccurs: def.maxOccurs,
          schema: def.schema,

          getValue: () => {
            return this.parameters?.[id];
          },

          setValue: action((value) => {
            const parameters = this.parameters ?? {};
            if (value === undefined) {
              delete parameters[id];
            } else {
              parameters[id] = value;
            }
            this.setTrait(CommonStrata.edit, "parameters", parameters);
          }),

          getError: () => {
            if (!zodSchema) {
              return;
            }

            const result = zodSchema.safeParse(this.parameters?.[id]);
            console.log(result.error);
            return result.success ? undefined : z.prettifyError(result.error);
          }
        });
      })
      .filter(isDefined);
  }

  // @ts-expect-error
  async createJob(_jobId: string) {
    // Because we override submitJob, we don't need this method
    throw new TerriaError({ message: "Unexpected error when creating job" });
  }

  async submitJob() {
    // TODO: get the url from sourceGroup
    if (!this.url || !this.processId) {
      throw new TerriaError({ message: "Process not set up correctly." });
    }

    const executionResponse = await client.executeAsync(
      this,
      this.url,
      this.processId,
      {
        inputs: this.parameters,
        response: "document",
        outputs: {
          result: {
            format: {
              mediaType: "application/json"
            },
            transmissionMode: "value"
          }
        }
      }
    );

    const { jobID: jobId, status } = executionResponse;
    if (failureStatus.includes(status as any)) {
      throw TerriaError.from("Job failed");
    }

    const jobRef = this.createJobReference(
      this.processGroupId ?? this.url,
      jobId
    );
    (await jobRef.loadReference()).raiseError(this.terria);
    (await this.terria.workbench.add(jobRef)).raiseError(this.terria);

    this.terria.addModel(jobRef);
    (this.outputGroup ?? this.terria.catalog.userAddedDataGroup).add(
      CommonStrata.user,
      jobRef
    );

    const job = jobRef.target;
    if (!(job instanceof OgcProcessCatalogFunctionJob)) {
      throw new TerriaError({
        message: `Failed to load job with ID: ${jobId}`
      });
    }

    return job;
  }

  private createJobReference(
    namespace: string,
    jobId: string
  ): OgcProcessJobReference {
    const uniqueId = `${namespace}:${jobId}`;
    const jobReference = new OgcProcessJobReference(uniqueId, this.terria);
    updateModelFromJson(jobReference, CommonStrata.user, {
      jobId,
      processId: this.processId,
      processGroupId: this.processGroupId
    });
    return jobReference;
  }

  @computed
  private get outputGroup(): GroupMixin.Instance | undefined {
    if (!this.outputGroupId) {
      return;
    }
    const model = this.terria.getModelById(BaseModel, this.outputGroupId);
    return GroupMixin.isMixedInto(model) ? model : undefined;
  }

  public static getOrCreateModel(
    terria: Terria,
    parentId: string,
    processId: string,
    url: string,
    json?: Partial<ModelPropertiesFromTraits<OgcProcessCatalogFunctionTraits>>
  ): Result<OgcProcessCatalogFunction | undefined> {
    return upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      parentId,
      CommonStrata.definition,
      {
        ...(json as any),
        type: "ogc-process",
        id: `${parentId}/${processId}`,
        processId,
        url
      }
    ) as Result<OgcProcessCatalogFunction | undefined>;
  }
}

class MetadataStratum extends LoadableStratum(OgcProcessCatalogFunctionTraits) {
  static stratumName = "ogcProcessMetadataStratum";

  private model: OgcProcessCatalogFunction;
  private process: OgcProcess;

  constructor(model: OgcProcessCatalogFunction, process: OgcProcess) {
    super(model);

    this.model = model;
    this.process = process;
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MetadataStratum(
      newModel as OgcProcessCatalogFunction,
      this.process
    ) as this;
  }

  @computed
  get description() {
    return this.process.description;
  }

  @computed
  get name() {
    return this.process.title;
  }
}

StratumOrder.addLoadStratum(MetadataStratum.stratumName);
