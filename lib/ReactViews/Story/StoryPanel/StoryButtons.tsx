import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../Styled/Icon";
import Styles from "../story-panel.scss";

interface BtnProp {
  onClick: () => void;
}

export const CollapseBtn = ({
  isCollapsed,
  onClick
}: { isCollapsed: boolean } & BtnProp) => {
  const { t } = useTranslation();
  return (
    <button
      className={Styles.exitBtn}
      title={isCollapsed ? t("story.expand") : t("story.collapse")}
      onClick={onClick}
    >
      <Icon glyph={isCollapsed ? Icon.GLYPHS.info : Icon.GLYPHS.arrowDown} />
    </button>
  );
};

export const ExitBtn = ({ onClick }: BtnProp) => {
  const { t } = useTranslation();
  return (
    <button
      className={Styles.exitBtn}
      title={t("story.exitBtn")}
      onClick={onClick}
    >
      <Icon glyph={Icon.GLYPHS.close} />
    </button>
  );
};

export const LocationBtn = ({ onClick }: BtnProp) => {
  const { t } = useTranslation();

  return (
    <button
      className={Styles.exitBtn}
      title={t("story.locationBtn")}
      onClick={onClick}
    >
      <Icon glyph={Icon.GLYPHS.location} />
    </button>
  );
};
