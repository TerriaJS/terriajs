import React, { FC } from "react";
import CreditDisplay from "terriajs-cesium/Source/Scene/CreditDisplay";
import Leaflet from "../../../Models/Leaflet";
import parseCustomHtmlToReact from "../../Custom/parseCustomHtmlToReact";
import { IMapCreditLogoProps } from "./MapCreditLogo.props";

export const MapCreditLogo: FC<IMapCreditLogoProps> = ({ currentViewer }) => {
  if (currentViewer.type === "Leaflet") {
    const prefix = (currentViewer as Leaflet).attributionPrefix;
    if (prefix) {
      return <>{parseCustomHtmlToReact(prefix)}</>;
    }
    return null;
  }
  return parseCustomHtmlToReact(CreditDisplay.cesiumCredit.html, {
    disableExternalLinkIcon: true
  });
};
