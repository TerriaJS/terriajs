"use strict";

import i18next from "i18next";
import TerriaError from "../Core/TerriaError";
import Terria from "./Terria";

export default function raiseErrorToUser(terria: Terria, error: unknown) {
  const terriaError =
    error instanceof TerriaError ? error : TerriaError.from(error);
  terriaError.raisedToUser = true;
  terria.error.raiseEvent(terriaError);
}
