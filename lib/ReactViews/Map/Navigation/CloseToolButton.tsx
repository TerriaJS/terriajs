import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import ViewState from "../../../ReactViewModels/ViewState";

const MapIconButton: any = require("../../MapIconButton/MapIconButton").default;
const Icon: any = require("../../Icon");

interface PropsType extends WithTranslation {
  viewState: ViewState;
  t: any;
}

function CloseToolButton({ viewState, t }: PropsType) {
  return (
    <MapIconButton
      roundLeft
      roundRight
      title={t("tool.closeButtonTitle", {
        toolName: viewState.currentTool?.toolName
      })}
      iconElement={() => <Icon glyph={Icon.GLYPHS.close} />}
      onClick={() => viewState.closeTool()}
    />
  );
}

export default withTranslation()(CloseToolButton);
