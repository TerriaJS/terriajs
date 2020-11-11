import i18next from "i18next";
import defaults from "lodash-es/defaults";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "./CommonStrata";
import createStubCatalogItem from "./createStubCatalogItem";
import { BaseModel } from "./Model";
import ModelFactory from "./ModelFactory";
import StubCatalogItem from "./StubCatalogItem";
import Terria from "./Terria";
import updateModelFromJson from "./updateModelFromJson";

export interface UpsertModelFromJsonOptions {
  addModelToTerria?: boolean;
  matchByShareKey?: boolean;
  replaceStratum?: boolean;
}

const defaultOptions: UpsertModelFromJsonOptions = {
  addModelToTerria: true,
  matchByShareKey: false,
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
  json: any,
  options: UpsertModelFromJsonOptions
): BaseModel {
  defaults(options, defaultOptions);

  let uniqueId = json.id;
  if (uniqueId === undefined) {
    const localId = json.localId || json.name;
    if (localId === undefined) {
      throw new TerriaError({
        title: i18next.t("models.catalog.idForMatchingErrorTitle"),
        message: i18next.t("models.catalog.idForMatchingErrorMessage")
      });
    }

    let id = (parentId || "") + "/" + localId;
    let idIncrement = 1;
    uniqueId = id;

    while (terria.getModelById(BaseModel, uniqueId) !== undefined) {
      uniqueId = id + "(" + idIncrement + ")";
      idIncrement++;
    }
  }

  let model = terria.getModelById(BaseModel, uniqueId);
  if (model === undefined && options.matchByShareKey && json.id !== undefined) {
    uniqueId = terria.getModelIdByShareKey(json.id);
    if (uniqueId !== undefined) {
      model = terria.getModelById(BaseModel, uniqueId);
    }
  }
  if (model === undefined) {
    model = factory.create(json.type, uniqueId, terria);
    if (model === undefined) {
      new TerriaError({
        title: i18next.t("models.catalog.unsupportedTypeTitle"),
        message: i18next.t("models.catalog.unsupportedTypeMessage", {
          type: json.type
        })
      });
      model = createStubCatalogItem(terria, uniqueId);
      if (model && model.type === StubCatalogItem.type) {
        const stub = model;
        stub.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
        stub.setTrait(CommonStrata.override, "name", `${uniqueId} (Stub)`);
      } else {
        throw new TerriaError({
          title: i18next.t("models.catalog.stubCreationFailure"),
          message: i18next.t("models.catalog.stubCreationFailure", {
            item: json
          })
        });
      }
    }

    if (model.type !== StubCatalogItem.type) {
      model.terria.addModel(model, json.shareKeys);
    }
  }

  try {
    updateModelFromJson(model, stratumName, json, options.replaceStratum);
  } catch (error) {
    console.log(`Error updating model from JSON`);
    console.log(error);
    model.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
  }
  return model;
}
