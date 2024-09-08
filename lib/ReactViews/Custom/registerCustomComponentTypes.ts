"use strict";

import Terria from "../../Models/Terria";
import ApiTableChartCustomComponent from "./ApiTableCustomComponent";
import CollapsibleCustomComponent from "./CollapsibleCustomComponent";
import CsvChartCustomComponent from "./CsvChartCustomComponent";
import CustomComponent from "./CustomComponent";
import FeedbackLinkCustomComponent from "./FeedbackLinkCustomComponent";
import SOSChartCustomComponent from "./SOSChartCustomComponent";
import TerriaTooltipCustomComponent from "./TerriaTooltip";
import CesiumIonConnector from "../ExplorerWindow/Tabs/MyDataTab/CesiumIonConnector";
import { addOrReplaceRemoteFileUploadType } from "../../Core/getDataType";
import { when } from "mobx";
import i18next from "i18next";

/**
 * Registers custom component types.
 *
 * You can define your own by adding additional calls to
 * {@CustomComponent.register} here or in separate source file executed
 * at startup.
 */
export default function registerCustomComponentTypes(terria?: Terria) {
  CustomComponent.register(new CsvChartCustomComponent());
  CustomComponent.register(new SOSChartCustomComponent());
  CustomComponent.register(new ApiTableChartCustomComponent());
  CustomComponent.register(new CollapsibleCustomComponent());
  CustomComponent.register(new FeedbackLinkCustomComponent());
  CustomComponent.register(new TerriaTooltipCustomComponent());

  // At the time this is called `cesiumIonOAuth2ApplicationID` won't be populated yet.
  // Subscribe to it now in case it's populated later.
  if (terria) {
    when(
      () => terria.configParameters.cesiumIonOAuth2ApplicationID !== undefined,
      () => {
        addOrReplaceRemoteFileUploadType("cesium-ion", {
          value: "cesium-ion",
          name: "core.dataType.cesium-ion",
          customComponent: CesiumIonConnector
        });
      }
    );
  }
}
