import { uniq } from "lodash-es";
import { isObservableArray, runInAction } from "mobx";
import { isJsonObject } from "../../Core/Json";
import isDefined from "../../Core/isDefined";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { ModelJson } from "../InitSource";
import createStratumInstance from "./createStratumInstance";
import { BaseModel } from "./Model";

export default function updateModelFromJson(
  model: BaseModel,
  defaultStratumName: string,
  json: Partial<ModelJson>,
  replaceStratum: boolean = false
): Result<undefined> {
  const errors: TerriaError[] = [];

  updateModelFromJsonInternal(
    model,
    defaultStratumName,
    json,
    errors,
    replaceStratum
  );

  return new Result(
    undefined,
    TerriaError.combine(
      errors,
      `Error updating model \`${model.uniqueId}\` from JSON for stratum \`${defaultStratumName}\``
    )
  );
}

function updateModelFromJsonInternal(
  model: BaseModel,
  currentStratumName: string,
  json: Partial<ModelJson>,
  errors: TerriaError[],
  replaceStratum: boolean = false
) {
  const traits = model.traits;

  runInAction(() => {
    if (replaceStratum) {
      model.strata.set(currentStratumName, createStratumInstance(model));
    }

    Object.keys(json).forEach((propertyName) => {
      if (
        propertyName === "id" ||
        propertyName === "type" ||
        propertyName === "localId" ||
        propertyName === "shareKeys" ||
        propertyName === "strata"
      ) {
        return;
      }

      const trait = traits[propertyName];
      if (trait === undefined) {
        pushStratumError(
          errors,
          currentStratumName,
          new TerriaError({
            title: "Unknown property",
            message: `The property \`${propertyName}\` is not valid for type \`${
              model.type ?? json.type
            }\`.`
          })
        );
        return;
      }

      const jsonValue = json[propertyName];
      if (jsonValue === undefined) {
        model.setTrait(currentStratumName, propertyName, undefined);
      } else {
        let newTrait = trait
          .fromJson(model, currentStratumName, jsonValue)
          .pushErrorTo(
            errors,
            `Error updating stratum \`${currentStratumName}\``
          );

        if (isDefined(newTrait)) {
          // We want to merge members of groups with the same name/id
          if (propertyName === "members") {
            newTrait = mergeWithExistingMembers(
              model,
              currentStratumName,
              propertyName,
              newTrait
            );
          }
          model.setTrait(currentStratumName, propertyName, newTrait);
        }
      }
    });
  });

  updateNestedStrataFromJson(model, currentStratumName, json.strata, errors);
}

function updateNestedStrataFromJson(
  model: BaseModel,
  currentStratumName: string,
  strata: ModelJson["strata"],
  errors: TerriaError[]
) {
  if (strata === undefined) {
    return;
  }

  if (!isJsonObject(strata, false)) {
    pushStratumError(
      errors,
      currentStratumName,
      new TerriaError({
        title: "Invalid strata",
        message: "The property `strata` must be a JSON object."
      })
    );
    return;
  }

  Object.entries(strata).forEach(([nestedStratumName, nestedJson]) => {
    if (!isJsonObject(nestedJson, false)) {
      pushStratumError(
        errors,
        nestedStratumName,
        new TerriaError({
          title: "Invalid strata",
          message: `The value for stratum \`${nestedStratumName}\` must be a JSON object.`
        })
      );
      return;
    }

    updateModelFromJsonInternal(model, nestedStratumName, nestedJson, errors);
  });
}

function pushStratumError(
  errors: TerriaError[],
  stratumName: string,
  error: unknown
) {
  errors.push(TerriaError.from(error, `Error updating stratum \`${stratumName}\``));
}

function mergeWithExistingMembers(
  model: BaseModel,
  stratumName: string,
  propertyName: string,
  newTrait: string[]
) {
  const existingTrait = model.getTrait(stratumName, propertyName);
  if (existingTrait !== undefined && isObservableArray(existingTrait)) {
    existingTrait.push(
      ...uniq(newTrait).filter((id) => !existingTrait.includes(id))
    );
    return existingTrait;
  }
  return newTrait;
}
