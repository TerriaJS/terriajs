import { JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import TerriaError from "../Core/TerriaError";
import { ConfigParametersTraits } from "../Traits/Configuration/ConfigParametersTraits";
import CommonStrata from "./Definition/CommonStrata";
import CreateModel from "./Definition/CreateModel";
import Model from "./Definition/Model";
import updateModelFromJson from "./Definition/updateModelFromJson";

export class ConfigParametersModel extends CreateModel(ConfigParametersTraits) {
  updateFromJson(
    stratumId: CommonStrata,
    params: JsonObject | Model<ConfigParametersTraits>
  ) {
    const errors: TerriaError[] = [];

    updateModelFromJson(this, stratumId, params).pushErrorTo(errors);

    return new Result(undefined, TerriaError.combine(errors, 0));
  }
}
