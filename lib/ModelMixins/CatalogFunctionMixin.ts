import { runInAction, toJS } from "mobx";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "../Models/Definition/CommonStrata";
import FunctionParameter from "../Models/FunctionParameters/FunctionParameter";
import Model from "../Models/Definition/Model";
import CatalogFunctionTraits from "../Traits/TraitsClasses/CatalogFunctionTraits";
import CatalogFunctionJobMixin from "./CatalogFunctionJobMixin";
import CatalogMemberMixin from "./CatalogMemberMixin";

type CatalogFunctionMixin = Model<CatalogFunctionTraits>;

function CatalogFunctionMixin<T extends Constructor<CatalogFunctionMixin>>(
  Base: T
) {
  abstract class CatalogFunctionMixin extends CatalogMemberMixin(Base) {
    /**
     * Function parameters are rendered as ParameterEditors, their values directly map to the `parameters` trait. When a FunctionParameter value is modified, it will automatically update `parameters` trait.
     *
     * When a job is created, the `parameters` are copied across automatically (see {@link CatalogFunctionMixin#submitJob})
     */
    abstract get functionParameters(): FunctionParameter[];

    /**
     * Create new job.
     * Note: `name` and `parameters` traits are automatically copied across when submitted ({@link CatalogFunctionMixin#submitJob})
     * All user-configured job parameters should be in the `parameters` trait, this is the ensure that function parameter state behaves correctly, and that values can be easily copied across jobs.
     *
     * Other job traits can be set in this function, as long as they aren't related to function parameters - for example the `url` and `processIdentier` trait for WPS are copied from the WPSCatalogFunction.
     */
    protected abstract createJob(id: string): Promise<CatalogFunctionJobMixin>;

    /**
     * Submit job:
     * - create new job {@link CatalogFunctionMixin#createJob}
     * - sets job traits (`name`, `parameters`, ...)
     * - invokes job {@link CatalogFunctionJobMixin#invoke}
     * - adds to workbench/models (in user added data) if successfully submitted
     * @returns new job
     */
    async submitJob() {
      try {
        const timestamp = new Date().toISOString();
        const newJob = await this.createJob(`${this.uniqueId}-${timestamp}`);

        if (!CatalogFunctionJobMixin.isMixedInto(newJob)) {
          throw `Error creating job catalog item - ${newJob.type} is not a valid jobType`;
        }

        // Give default name if needed
        if (!isDefined(runInAction(() => newJob.name))) {
          newJob.setTrait(
            CommonStrata.user,
            "name",
            `${newJob.typeName} ${timestamp}`
          );
        }

        newJob.setTrait(CommonStrata.user, "parameters", toJS(this.parameters));

        (await newJob.loadMetadata()).throwIfError();

        this.terria.addModel(newJob);
        this.terria.catalog.userAddedDataGroup.add(CommonStrata.user, newJob);
        this.terria.workbench
          .add(newJob)
          .then((r) => r.raiseError(this.terria));

        await newJob.invoke();

        return newJob;
      } catch (error) {
        throw TerriaError.from(error, {
          title: `Error submitting \`${this.typeName}\` job`
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
  export interface Instance
    extends InstanceType<ReturnType<typeof CatalogFunctionMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCatalogFunctionMixin;
  }
}

export default CatalogFunctionMixin;
