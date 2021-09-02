import i18next from "i18next";
import TerriaError from "../../Core/TerriaError";
import CommonStrata from "../Definition/CommonStrata";
import { BaseModel } from "../Definition/Model";
import ModelFactory from "../Definition/ModelFactory";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import createStubSearchProvider from "./createStubSearchProvider";

export default function upsertSearchProviderFromJson(
  factory: ModelFactory,
  terria: Terria,
  stratumName: string,
  json: any
) {
  let uniqueId = json.id;
  if (uniqueId === undefined) {
    const id = json.localId || json.name;
    if (id === undefined) {
      throw new TerriaError({
        title: i18next.t("searchProvider.models.idForMatchingErrorTitle"),
        message: i18next.t("searchProvider.models.idForMatchingErrorMessage")
      });
    }
    uniqueId = id;
  }

  let model = terria.getModelById(BaseModel, uniqueId);

  if (model === undefined) {
    model = factory.create(json.type, uniqueId, terria);
    if (model === undefined) {
      console.log(
        new TerriaError({
          title: i18next.t("searchProvider.models.unsupportedTypeTitle"),
          message: i18next.t("searchProvider.models.unsupportedTypeMessage", {
            type: json.type
          })
        })
      );
      model = createStubSearchProvider(terria, uniqueId);
      const stub = model;
      stub.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
      stub.setTrait(CommonStrata.override, "name", `${uniqueId} (Stub)`);
    }

    model?.terria.addSearchProvider(model);
  }

  setDefaultTraits(model);

  try {
    updateModelFromJson(model, stratumName, json);
  } catch (error) {
    console.log(`Error updating search provider from JSON`);
    console.log(error);
    model?.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
  }
}

function setDefaultTraits(model: BaseModel) {
  const terria = model.terria;

  model.setTrait(
    CommonStrata.defaults,
    "flightDurationSeconds",
    terria.configParameters.searchBar!.flightDurationSeconds
  );

  model.setTrait(
    CommonStrata.defaults,
    "minCharacters",
    terria.configParameters.searchBar!.minCharacters
  );

  model.setTrait(
    CommonStrata.defaults,
    "recommendedListLength",
    terria.configParameters.searchBar!.recommendedListLength
  );
}
