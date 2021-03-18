"use strict";

import i18next from "i18next";
import TerriaError, { I18nTranslateString } from "../Core/TerriaError";
import Terria from "./Terria";

export default function raiseErrorToUser(terria: Terria, error: unknown) {
  if (error instanceof TerriaError) {
    if (!error.raisedToUser) {
      error.raisedToUser = true;
      terria.error.raiseEvent(error);
    }
  } else {
    terria.error.raiseEvent(
      new TerriaError({
        title: i18next.t("models.raiseError.errorTitle"),
        message: wrapErrorMessage(terria, error)
      })
    );
  }
}

/** Wraps error message in more user friendly message (see `models.raiseError.errorMessage`) */
export function wrapErrorMessage(
  terria: Terria,
  error: unknown
): I18nTranslateString {
  return {
    key: "models.raiseError.errorMessage",
    parameters: {
      appName: terria.appName,
      email:
        '<a href="mailto:' +
        terria.supportEmail +
        '">' +
        terria.supportEmail +
        "</a>",
      error:
        (typeof error === "string"
          ? (error as string)
          : typeof error === "object"
          ? error?.toString()
          : undefined) ?? "Unknown error"
    }
  };
}
