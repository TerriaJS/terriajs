import { action } from "mobx";
import { JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import TerriaError from "../Core/TerriaError";
import { ConfigParametersTraits } from "../Traits/Configuration/ConfigParametersTraits";
import CommonStrata from "./Definition/CommonStrata";
import CreateModel from "./Definition/CreateModel";
import Model from "./Definition/Model";
import updateModelFromJson from "./Definition/updateModelFromJson";

export class ConfigParametersModel extends CreateModel(ConfigParametersTraits) {
  updateFromJson(
    stratumId: CommonStrata,
    params: JsonObject | Model<ConfigParametersTraits>
  ) {
    const errors: TerriaError[] = [];

    updateModelFromJson(this, stratumId, params).pushErrorTo(errors);

    return new Result(undefined, TerriaError.combine(errors, 0));
  }

  @action
  convertDeprecatedParameters(params: any) {
    if ("showWelcomeMessage" in params || "welcomeMessageVideo" in params) {
      if (!("welcomeMessage.show" in params)) {
        if (!("welcomeMessage" in params)) {
          params.welcomeMessage = {};
        }
        params.welcomeMessage = {
          show: params.showWelcomeMessage
        };
      }
      delete params.showWelcomeMessage;
      console.warn(
        "Config parameters showWelcomeMessage is deprecated. Check docs for updated usage."
      );
    }

    if ("welcomeMessageVideo" in params) {
      if (!("welcomeMessage.video" in params)) {
        if (!("welcomeMessage" in params)) {
          params.welcomeMessage = {};
        }
        params.welcomeMessage.video = {
          title: params.welcomeMessageVideo.videoTitle,
          url: params.welcomeMessageVideo.videoUrl,
          placeholderImage: params.welcomeMessageVideo.placeholderImage
        };
      }
      delete params.welcomeMessageVideo;
      console.warn(
        "Config parameter welcomeMessageVideo is deprecated. Check docs for updated usage."
      );
    }

    if ("helpContent" in params) {
      if (!("helpItems" in params)) {
        params.helpItems = params.helpContent;
      }
      delete params.helpContent;
      console.warn(
        "Config parameter helpContent is deprecated. Check docs for updated usage."
      );
    }

    if ("helpContentTerms" in params) {
      if (!("helpTerms" in params)) {
        const helpTerms: any = [];
        params.helpContentTerms.map((term: any) => {
          if ("aliases" in term && !Array.isArray(term.aliases)) {
            term.aliases = [term.aliases];
            helpTerms.push(term);
          }
        });
        params.helpTerms = helpTerms;
      }
      delete params.helpContentTerms;
      console.warn(
        "Config parameter helpContentTerms is deprecated. Check docs for updated usage."
      );
    }

    if ("feedbackPreamble" in params || "feedbackMinLength" in params) {
      if (!("feedback" in params)) {
        params.feedback = {
          preamble: params.feedbackPreamble,
          minLength: params.feedbackMinLength
        };
      }
      delete params.feedbackPreamble;
      delete params.feedbackMinLength;
      console.warn(
        "Config parameters feedbackPreamble and feedbackMinLength are deprecated. Check docs for updated usage."
      );
    }

    if (
      "brandBarElements" in params ||
      "brandBarSmallElements" in params ||
      "displayOneBrand" in params
    ) {
      if (!("brandBar" in params)) {
        params.brandBar = {
          elements: params.brandBarElements,
          smallElements: params.brandBarSmallElements,
          displayOneBrand: params.displayOneBrand
        };
      }
      delete params.brandBarElements;
      delete params.brandBarSmallElements;
      console.warn(
        "Config parameters feedbackPreamble and feedbackMinLength are deprecated. Check docs for updated usage."
      );
    }

    if ("disclaimer" in params) {
      delete params.disclaimer;
      console.warn(
        "Config parameter disclaimer is deprecated. Check docs for updated usage."
      );
    }

    if ("googleUrlShortenerKey" in params) {
      delete params.googleUrlShortenerKey;
      console.warn(
        "Config parameter googleUrlShortenerKey is deprecated. Check docs for updated usage."
      );
    }

    if ("mobileDefaultViewerMode" in params) {
      delete params.mobileDefaultViewerMode;
      console.warn(
        "Config parameter mobileDefaultViewerMode is not implemented. Check docs for updated usage."
      );
    }

    return params;
  }
}
