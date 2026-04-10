import React, { Ref } from "react";
import { useTranslation } from "react-i18next";
import { DefaultTheme } from "styled-components";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import { useRefForTerria } from "../../../Hooks/useRefForTerria";

import Styles from "./emergency-plans-button.scss";

interface Props {
  terria: Terria;
  theme: DefaultTheme;
  viewState: ViewState;
}

interface ButtonProps extends Props {
  ["aria-expanded"]: boolean;
}

const EMERGENCY_PLANS_BUTTON_NAME = "MenuBarEmergencyPlansButton";

const onEmergencyPlansButtonClick = () => {
  window.open(
    "help/municipal-emergency-plans.html",
    "_blank",
    "noopener,noreferrer"
  );
};

const EmergencyPlansButton = (props: Props) => {
  const emergencyPlansButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    EMERGENCY_PLANS_BUTTON_NAME,
    props.viewState
  );
  const { t } = useTranslation();

  return (
    <div>
      <button
        ref={emergencyPlansButtonRef}
        className={Styles.emergencyPlansBtn}
        type="button"
        onClick={onEmergencyPlansButtonClick}
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
        <Icon glyph={Icon.GLYPHS.dataCatalog} />
        <span>{t("microzonation.municipalEmergencyPlans")}</span>
      </button>
    </div>
  );
};
export default EmergencyPlansButton;
