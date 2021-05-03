import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import ViewState from "../../../ReactViewModels/ViewState";
import Icon from "../../../Styled/Icon";

const MapIconButton: any = require("../../MapIconButton/MapIconButton").default;

interface PropsType extends WithTranslation {
  viewState: ViewState;
  t: any;
  toolIsDifference?: boolean;
}

function CloseToolButton({ viewState, t, toolIsDifference }: PropsType) {
  const closeText = t("tool.closeButtonTitle", {
    toolName: viewState.currentTool?.toolName
  });
  return (
    <MapIconButton
      css={`
        svg {
          width: 13px;
          height: 13px;
        }
      `}
      title={closeText}
      splitter={toolIsDifference}
      expandInPlace
      iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
      onClick={() => viewState.closeTool()}
    >
      {closeText}
    </MapIconButton>
  );
}

export default withTranslation()(CloseToolButton);
