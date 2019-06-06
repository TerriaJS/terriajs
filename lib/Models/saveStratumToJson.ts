import { JsonObject } from "../Core/Json";
import ModelTraits from "../Traits/ModelTraits";
import Trait from "../Traits/Trait";
import StratumFromTraits from "./StratumFromTraits";

export default function saveStratumToJson(
  traits: { [traitId: string]: Trait },
  stratum: Readonly<StratumFromTraits<ModelTraits>>
): JsonObject {
  const stratumAny: any = stratum;

  const result: JsonObject = {};

  Object.keys(traits).forEach(traitId => {
    const trait = traits[traitId];
    const value = stratumAny[traitId];
    const jsonValue = trait.toJson(value);
    if (jsonValue !== undefined) {
      result[traitId] = jsonValue;
    }
  });

  return result;
}
