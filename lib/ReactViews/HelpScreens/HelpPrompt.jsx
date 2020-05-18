import React from "react";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react";

import Prompt from "../HelpScreens/Prompt";

export const HelpPromptDisplayName = "HelpPrompt";
export const HelpPrompt = observer(({ viewState }) => {
  const { t } = useTranslation();
  const showHelp = viewState.showSatelliteGuidance;

  return (
    <Prompt
      isVisible={showHelp}
      viewState={viewState}
      title={t("satelliteGuidance.titleI")}
      content={t("satelliteGuidance.bodyI")}
      dismissLabel={t("satelliteGuidance.prevI")}
      acceptLabel={t("satelliteGuidance.nextI")}
      onAccept={() => {
        viewState.setShowSatelliteGuidance(false);
        viewState.showHelpPanel();
        viewState.selectHelpMenuItem("satelliteimagery");
      }}
      onDismiss={() => viewState.setShowSatelliteGuidance(false)}
    />
  );
});

export default HelpPrompt;
