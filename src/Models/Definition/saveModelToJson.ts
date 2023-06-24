import { JsonObject } from "../../Core/Json";
import { BaseModel } from "./Model";
import saveStratumToJson from "./saveStratumToJson";

export interface SaveModelOptions {
  includeStrata?: string[];
  excludeStrata?: string[];
}

export default function saveModelToJson(
  model: BaseModel,
  options: SaveModelOptions = {}
): JsonObject {
  const includeStrata = options.includeStrata
    ? options.includeStrata
    : Array.from(model.strata.keys());
  const excludeStrata = options.excludeStrata ? options.excludeStrata : [];
  const strata = includeStrata.filter(
    (stratum) => excludeStrata.indexOf(stratum) < 0
  );

  const result: JsonObject = {};

  strata.forEach((stratumId) => {
    const stratum = model.strata.get(stratumId);
    if (stratum === undefined) {
      return;
    }

    result[stratumId] = saveStratumToJson(model.traits, stratum);
  });

  if (model.uniqueId !== undefined) {
    // TODO: should the JSON property be named `uniqueId` too?
    result.id = model.uniqueId;
  }

  result.type = model.type;

  return result;
}
