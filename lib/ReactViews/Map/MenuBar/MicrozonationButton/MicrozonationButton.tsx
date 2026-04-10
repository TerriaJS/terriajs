import React, { Ref } from "react";
import { useTranslation } from "react-i18next";
import { DefaultTheme } from "styled-components";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import { useRefForTerria } from "../../../Hooks/useRefForTerria";

import Styles from "./microzonation-button.scss";

interface Props {
  terria: Terria;
  theme: DefaultTheme;
  viewState: ViewState;
}

interface ButtonProps extends Props {
  ["aria-expanded"]: boolean;
}

const MICROZONATION_BUTTON_NAME = "MenuBarMicrozonationButton";

export const onMicrozonationButtonClick = (props: Props) => () => {
  props.viewState.toggleMicrozonationPanel();
  props.terria.currentViewer.notifyRepaintRequired();
};

const MicrozonationButton = (props: Props) => {
  const microzonationButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    MICROZONATION_BUTTON_NAME,
    props.viewState
  );
  const { t } = useTranslation();

  return (
    <div>
      <button
        ref={microzonationButtonRef}
        className={Styles.microzonationBtn}
        type="button"
        onClick={onMicrozonationButtonClick(props)}
        aria-expanded={props.viewState.microzonationPanelShown}
        css={`
          ${(p: ButtonProps) =>
            p["aria-expanded"] &&
            `&:not(.foo) {
                      background: ${p.theme.colorPrimary};
                      svg {
                        fill: ${p.theme.textLight};
                      }
                    }`}
        `}
      >
        <Icon glyph={Icon.GLYPHS.data} />
        <span>{t("microzonation.menuButton")}</span>
      </button>
    </div>
  );
};
export default MicrozonationButton;
