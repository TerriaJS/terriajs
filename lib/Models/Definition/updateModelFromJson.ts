import { isObservableArray, runInAction } from "mobx";
import Result from "../../Core/Result";
import TerriaError, { TerriaErrorSeverity } from "../../Core/TerriaError";
import createStratumInstance from "./createStratumInstance";
import { BaseModel } from "./Model";
import isDefined from "../../Core/isDefined";

export default function updateModelFromJson(
  model: BaseModel,
  stratumName: string,
  json: any,
  replaceStratum: boolean = false
): Result<undefined> {
  const traits = model.traits;

  const errors: TerriaError[] = [];

  runInAction(() => {
    if (replaceStratum) {
      model.strata.set(stratumName, createStratumInstance(model));
    }

    Object.keys(json).forEach(propertyName => {
      if (
        propertyName === "id" ||
        propertyName === "type" ||
        propertyName === "localId" ||
        propertyName === "shareKeys"
      ) {
        return;
      }

      const trait = traits[propertyName];
      if (trait === undefined) {
        errors.push(
          new TerriaError({
            title: "Unknown property",
            message: `The property \`${propertyName}\` is not valid for type \`${model.type ??
              json.type}\`.`
          })
        );
        return;
      }

      const jsonValue = json[propertyName];
      if (jsonValue === undefined) {
        model.setTrait(stratumName, propertyName, undefined);
      } else {
        let newTrait = trait
          .fromJson(model, stratumName, jsonValue)
          .pushErrorTo(errors);

        if (isDefined(newTrait)) {
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
      }
    });
  });

  return new Result(
    undefined,
    TerriaError.combine(
      errors,
      `Error updating model \`${model.uniqueId}\` from JSON`
    )
  );
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
