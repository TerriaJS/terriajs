import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "../../../Styled/Box";
import { CollapseBtn, ExitBtn } from "./StoryButtons";

const TitleContainer = styled.div`
  flex: 1;
`;

const ClampedTitle = styled.h3`
  /* clamp fallback */
  white-space: nowrap;
  text-overflow: ellipsis;

  overflow: hidden;
  padding: 0;
  margin: 10px;

  @supports (-webkit-line-clamp: 2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: unset;
  }
`;

const TitleBar = ({
  title,
  isCollapsed,
  collapseHandler,
  closeHandler
}: {
  title?: string;
  isCollapsed: boolean;
  collapseHandler: () => void;
  closeHandler: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box fullWidth>
      <TitleContainer>
        <ClampedTitle>{title ? title : t("story.untitled")}</ClampedTitle>
      </TitleContainer>
      <Box>
        <CollapseBtn isCollapsed={isCollapsed} onClick={collapseHandler} />
        <ExitBtn onClick={closeHandler} />
      </Box>
    </Box>
  );
};

export default TitleBar;
