import { runInAction, toJS } from "mobx";
import Constructor from "../Core/Constructor";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "../Models/CommonStrata";
import FunctionParameter from "../Models/FunctionParameters/FunctionParameter";
import Model from "../Models/Model";
import CatalogFunctionTraits from "../Traits/CatalogFunctionTraits";
import CatalogFunctionJobMixin from "./CatalogFunctionJobMixin";
import CatalogMemberMixin from "./CatalogMemberMixin";
import addUserCatalogMember from "../Models/addUserCatalogMember";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

type CatalogFunctionMixin = Model<CatalogFunctionTraits>;

function CatalogFunctionMixin<T extends Constructor<CatalogFunctionMixin>>(
  Base: T
) {
  abstract class CatalogFunctionMixin extends CatalogMemberMixin(Base) {
    /**
     * Function parameters are rendered as ParameterEditors, their values directly map to the `parameters` trait. When a FunctionParameter value is modified, it will automatically update `parameters` trait.
     *
     * When a job is created, the `parameters` are copied across automatically.
     *
     * See {@link CatalogFunctionMixin#createJob} and {@link CatalogFunctionMixin#submitJob}
     */
    abstract get functionParameters(): FunctionParameter[];

    /**
     * Create new job.
     * Note: `name` and `parameters` traits are automatically copied across.
     * All user-configurated job parameters should be in the `parameters` trait, this is the ensure that function parameter state behave correctly, and that values can be easily copied across jobs.
     *
     * Other job traits can be set in this function, as long as they aren't related to function parameters - for example the `url` and `processIdentier` trait for WPS are copied from the WPSCatalogFunction.
     */
    protected abstract createJob(id: string): Promise<CatalogFunctionJobMixin>;

    /**
     * Submit job.
     * @returns true if successfuly submited
     */
    async submitJob() {
      try {
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

        const newJob = await this.createJob(`${this.uniqueId}-${timestamp}`);

        if (!CatalogFunctionJobMixin.isMixedInto(newJob)) {
          throw `Error creating job catalog item - ${newJob.type} is not a valid jobType`;
        }

        newJob.setTrait(
          CommonStrata.user,
          "name",
          `${newJob.typeName} ${timestamp}`
        );
        newJob.setTrait(CommonStrata.user, "parameters", toJS(this.parameters));

        await newJob.loadMetadata();

        const finished = await newJob.invoke();

        runInAction(() => {
          if (finished) {
            newJob.setTrait(CommonStrata.user, "jobStatus", "finished");
          } else {
            newJob.setTrait(CommonStrata.user, "refreshEnabled", true);
          }
        });
        // Only add model if successfully invokes (doesn't throw exception)
        this.terria.addModel(newJob);
        await addUserCatalogMember(this.terria, newJob, { enable: true });

        return true;
      } catch (error) {
        // Try to get meaningful error message
        if (error instanceof TerriaError) {
          throw error;
        }

        let message = error;

        if (typeof message !== "string") {
          if (
            message instanceof RequestErrorEvent &&
            typeof message.response?.detail === "string"
          )
            message = message.response.detail;
        }

        throw new TerriaError({
          title: `Error submitting ${this.typeName} job`,
          message
        });
      }
    }

    get hasCatalogFunctionMixin() {
      return true;
    }
  }

  return CatalogFunctionMixin;
}

namespace CatalogFunctionMixin {
  export interface CatalogFunctionMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionMixin {
    return model && model.hasCatalogFunctionMixin;
  }
}

export default CatalogFunctionMixin;
