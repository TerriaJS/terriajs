import { runInAction, isObservableArray } from "mobx";
import TerriaError from "../Core/TerriaError";
import createStratumInstance from "./createStratumInstance";
import { BaseModel } from "./Model";

export default function updateModelFromJson(
  model: BaseModel,
  stratumName: string,
  json: any,
  replaceStratum: boolean = false
) {
  const traits = model.traits;

  runInAction(() => {
    if (replaceStratum) {
      model.strata.set(stratumName, createStratumInstance(model));
    }

    Object.keys(json).forEach(propertyName => {
      if (
        propertyName === "id" ||
        propertyName === "type" ||
        propertyName === "localId"
      ) {
        return;
      }

      const trait = traits[propertyName];
      if (trait === undefined) {
        throw new TerriaError({
          title: "Unknown property",
          message: `The property ${propertyName} is not valid for type ${model.type}.`
        });
      }

      const jsonValue = json[propertyName];
      if (jsonValue === undefined) {
        model.setTrait(stratumName, propertyName, undefined);
      } else {
        let newTrait = trait.fromJson(model, stratumName, jsonValue);
        // We want to merge members of groups with the same name/id
        if (propertyName === "members") {
          newTrait = mergeWithExistingMembers(
            model,
            stratumName,
            propertyName,
            newTrait
          );
        }
        model.setTrait(stratumName, propertyName, newTrait);
      }
    });
  });
}

function mergeWithExistingMembers(
  model: BaseModel,
  stratumName: string,
  propertyName: string,
  newTrait: string[]
) {
  const existingTrait = model.getTrait(stratumName, propertyName);
  if (existingTrait !== undefined && isObservableArray(existingTrait)) {
    existingTrait.push(...newTrait);
    return existingTrait;
  }
  return newTrait;
}
