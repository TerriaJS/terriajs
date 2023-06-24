import { JsonObject } from "../../Core/Json";
import ModelTraits, { TraitDefinitions } from "../../Traits/ModelTraits";
import StratumFromTraits from "./StratumFromTraits";

export default function saveStratumToJson(
  traits: TraitDefinitions,
  stratum: Readonly<StratumFromTraits<ModelTraits>>
): JsonObject {
  const stratumAny: any = stratum;

  const result: JsonObject = {};

  Object.keys(traits).forEach((traitId) => {
    const trait = traits[traitId];
    const value = stratumAny[traitId];
    const jsonValue = trait.toJson(value);
    if (jsonValue !== undefined) {
      result[traitId] = jsonValue;
    }
  });

  return result;
}
