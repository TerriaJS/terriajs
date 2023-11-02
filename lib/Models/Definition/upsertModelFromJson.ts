import i18next from "i18next";
import defaults from "lodash-es/defaults";
import isDefined from "../../Core/isDefined";
import { isJsonObject, isJsonString, isJsonStringArray } from "../../Core/Json";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import GroupMixin from "../../ModelMixins/GroupMixin";
import StubCatalogItem from "../Catalog/CatalogItems/StubCatalogItem";
import createStubCatalogItem from "../Catalog/createStubCatalogItem";
import { ModelJson } from "../InitSource";
import Terria from "../Terria";
import CommonStrata from "./CommonStrata";
import { BaseModel } from "./Model";
import ModelFactory from "./ModelFactory";
import updateModelFromJson from "./updateModelFromJson";

export interface UpsertModelFromJsonOptions {
  addModelToTerria?: boolean;
  replaceStratum?: boolean;
}

const defaultOptions: UpsertModelFromJsonOptions = {
  addModelToTerria: true,
  replaceStratum: undefined
};

/**
 * Update an existing model or create a new model
 * @param factory The factory used to construct a new model if no existing model is found with ID matching `json.id`
 * @param terria
 * @param parentId
 * @param stratumName
 * @param json Object representation of the stratum data. `id` must be present to match an existing model to update. If only a `localId` or `name` is present a new model will be created.
 * @param options
 */
export default function upsertModelFromJson(
  factory: ModelFactory,
  terria: Terria,
  parentId: string,
  stratumName: string,
  json: ModelJson,
  options: UpsertModelFromJsonOptions = {}
): Result<BaseModel | undefined> {
  if (!isJsonObject(json, false)) {
    return Result.error("Failed to upsert model - invalid JSON");
  }
  const errors: TerriaError[] = [];
  defaults(options, defaultOptions);

  let uniqueId = isJsonString(json.id) ? json.id : undefined;
  let model: BaseModel | undefined;
  if (isDefined(uniqueId)) {
    model = terria.getModelById(BaseModel, uniqueId);
  } else {
    const localId = json.localId || json.name;
    if (localId === undefined) {
      return Result.error(
        new TerriaError({
          title: i18next.t("models.catalog.idForMatchingErrorTitle"),
          message: i18next.t("models.catalog.idForMatchingErrorMessage")
        })
      );
    }

    let id = (parentId || "") + "/" + localId;
    let idIncrement = 1;
    uniqueId = id;
    model = terria.getModelById(BaseModel, uniqueId);
    // Duplicate catalogue items should be given a unique id by incrementing its id
    // But if it's a group, leave it as is, so we can later merge all groups with the same id
    if (!GroupMixin.isMixedInto(model)) {
      while (model !== undefined) {
        uniqueId = id + "(" + idIncrement + ")";
        idIncrement++;
        model = terria.getModelById(BaseModel, uniqueId);
      }
    }
  }

  if (model === undefined) {
    try {
      model = isJsonString(json.type)
        ? factory.create(json.type, uniqueId, terria)
        : undefined;
      if (model === undefined) {
        errors.push(
          new TerriaError({
            title: i18next.t("models.catalog.unsupportedTypeTitle"),
            message: i18next.t("models.catalog.unsupportedTypeMessage", {
              type: json.type
            })
          })
        );
        model = createStubCatalogItem(terria, uniqueId);
        const stub = model;
        stub.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
        stub.setTrait(CommonStrata.override, "name", `${uniqueId} (Stub)`);
      }

      if (model.type !== StubCatalogItem.type && options.addModelToTerria) {
        const shareKeys = isJsonStringArray(json.shareKeys)
          ? json.shareKeys
          : undefined;
        model.terria.addModel(model, shareKeys);
      }
    } catch (e) {
      errors.push(TerriaError.from(e, `Failed to create model`));
    }
  }

  if (model)
    updateModelFromJson(
      model,
      stratumName,
      json,
      options.replaceStratum
    ).catchError((error) => {
      errors.push(error);
      model!.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
    });

  return new Result(
    model,
    TerriaError.combine(errors, `Error upserting model JSON: \`${uniqueId}\``)
  );
}
