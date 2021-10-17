import i18next from "i18next";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { useTranslationIfExists } from "../../Language/languageHelpers";
import CommonStrata from "../Definition/CommonStrata";
import { BaseModel } from "../Definition/Model";
import ModelFactory from "../Definition/ModelFactory";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import createStubSearchProvider from "./createStubSearchProvider";
import StubSearchProvider from "./StubSearchProvider";

export default function upsertSearchProviderFromJson(
  factory: ModelFactory,
  terria: Terria,
  stratumName: string,
  json: any
): Result<BaseModel | undefined> {
  const errors: TerriaError[] = [];

  let uniqueId = json.id;
  if (uniqueId === undefined) {
    const id = json.localId || json.name;
    if (id === undefined) {
      return Result.error(
        new TerriaError({
          title: i18next.t("models.catalog.idForMatchingErrorTitle"),
          message: i18next.t("models.catalog.idForMatchingErrorMessage")
        })
      );
    }
    uniqueId = id;
  }

  let model = terria.getModelById(BaseModel, uniqueId);

  if (model === undefined) {
    model = factory.create(json.type, uniqueId, terria);
    if (model === undefined) {
      errors.push(
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

    if (model.type !== StubSearchProvider.type) {
      try {
        model.terria.configParameters.searchBarModel?.addSearchProvider(model);
      } catch (error) {
        errors.push(error);
      }
    }
  }

  setDefaultTraits(model);

  updateModelFromJson(model, stratumName, json).catchError(error => {
    errors.push(error);
    model!.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
  });

  return new Result(
    model,
    TerriaError.combine(
      errors,
      `Error upserting search provider JSON: \`${useTranslationIfExists(
        uniqueId
      )}\``
    )
  );
}

function setDefaultTraits(model: BaseModel) {
  const terria = model.terria;

  model.setTrait(
    CommonStrata.defaults,
    "flightDurationSeconds",
    terria.configParameters.searchBarModel?.flightDurationSeconds
  );

  model.setTrait(
    CommonStrata.defaults,
    "minCharacters",
    terria.configParameters.searchBarModel?.minCharacters
  );

  model.setTrait(
    CommonStrata.defaults,
    "recommendedListLength",
    terria.configParameters.searchBarModel?.recommendedListLength
  );
}
