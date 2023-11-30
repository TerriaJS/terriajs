import i18next from "i18next";
import { runInAction } from "mobx";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import SearchProviderMixin from "../../ModelMixins/SearchProviders/SearchProviderMixin";
import CommonStrata from "../Definition/CommonStrata";
import { BaseModel } from "../Definition/Model";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import { SearchModelFactory } from "./SearchModelFactory";
import StubSearchProvider from "./StubSearchProvider";
import createStubSearchProvider from "./createStubSearchProvider";

export default function upsertSearchProviderFromJson(
  factory: SearchModelFactory,
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
        model.terria.searchBarModel.addSearchProvider(model);
      } catch (error) {
        errors.push(TerriaError.from(error));
      }
    }
  }

  setDefaultTraits(model);

  updateModelFromJson(model, stratumName, json).catchError((error) => {
    errors.push(error);
    model!.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
  });

  return new Result(
    model,
    TerriaError.combine(
      errors,
      `Error upserting search provider JSON: \`${applyTranslationIfExists(
        uniqueId,
        i18next
      )}\``
    )
  );
}

function setDefaultTraits(model: BaseModel) {
  const terria = model.terria;

  runInAction(() => {
    model.setTrait(
      CommonStrata.defaults,
      "flightDurationSeconds",
      terria.searchBarModel.flightDurationSeconds
    );

    model.setTrait(
      CommonStrata.defaults,
      "minCharacters",
      terria.searchBarModel.minCharacters
    );

    model.setTrait(
      CommonStrata.defaults,
      "recommendedListLength",
      terria.searchBarModel.recommendedListLength
    );
  });
}
