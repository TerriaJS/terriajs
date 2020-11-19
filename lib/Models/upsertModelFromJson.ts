import i18next from "i18next";
import TerriaError from "../Core/TerriaError";
import CommonStrata from "./CommonStrata";
import createStubCatalogItem from "./createStubCatalogItem";
import { BaseModel } from "./Model";
import ModelFactory from "./ModelFactory";
import StubCatalogItem from "./StubCatalogItem";
import Terria from "./Terria";
import updateModelFromJson from "./updateModelFromJson";

export default function upsertModelFromJson(
  factory: ModelFactory,
  terria: Terria,
  parentId: string,
  model: BaseModel | undefined,
  stratumName: string,
  json: any,
  replaceStratum: boolean = false,
  addModelToTerria: boolean = true
): BaseModel {
  if (model === undefined) {
    let uniqueId = json.id;
    if (uniqueId === undefined) {
      const localId = json.localId || json.name;
      if (localId === undefined) {
        throw new TerriaError({
          title: i18next.t("models.catalog.idForMatchingErrorTitle"),
          message: i18next.t("models.catalog.idForMatchingErrorMessage")
        });
      }

      uniqueId = (parentId || "") + "/" + localId;
    }

    // To handle duplicate items, e.g. same item in different tabs
    uniqueId = incrementIfAlreadyExists(uniqueId, terria);

    model = terria.getModelById(BaseModel, uniqueId);
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

      if (model.type !== StubCatalogItem.type && addModelToTerria) {
        model.terria.addModel(model);
      }
    }
  }

  try {
    updateModelFromJson(model, stratumName, json, replaceStratum);
  } catch (error) {
    console.log(`Error updating model from JSON`);
    console.log(error);
    model.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
  }
  return model;
}

function incrementIfAlreadyExists(baseId: string, terria: Terria) {
  const model = terria.getModelById(BaseModel, baseId);
  if (model === undefined) return baseId;

  let resultingId;
  let currentId = baseId;
  let idIncrement = 1;

  while (terria.getModelById(BaseModel, currentId) !== undefined) {
    currentId = baseId + "(" + idIncrement + ")";
    resultingId = currentId;
    idIncrement++;
  }
  return resultingId;
}
