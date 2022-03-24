import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import Button, { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
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
    <RawButton
      title={isCollapsed ? t("story.expand") : t("story.collapse")}
      onClick={onClick}
    >
      {isCollapsed ? (
        <StoryIcon styledWidth={"24px"} glyph={Icon.GLYPHS.info} />
      ) : (
        <StoryIcon styledWidth={"12px"} glyph={Icon.GLYPHS.arrowDown} />
      )}
    </RawButton>
  );
};

export const ExitBtn = ({ onClick }: BtnProp) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <RawButton onClick={onClick} title={t("story.exitBtn")}>
      <StoryIcon
        styledWidth={"12px"}
        glyph={Icon.GLYPHS.close}
        css={`
          border-radius: 50%;
          border: 3px solid ${theme.textDark};
          padding: 3px;
        `}
      />
    </RawButton>
  );
};

export const StoryIcon = styled(StyledIcon).attrs(props => ({
  fillColor: props.theme.textDark,
  opacity: 0.5
}))``;
