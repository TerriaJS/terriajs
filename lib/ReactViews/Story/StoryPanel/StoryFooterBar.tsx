import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { constVoid } from "../../../Core/types";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import { LocationBtn } from "./StoryButtons";

interface FooterBarProps {
  goPrev: constVoid;
  goNext: constVoid;
  jumpToStory: (index: number) => void;
  zoomTo: constVoid;
  currentHumanIndex: number;
  totalStories: number;
}

const FooterContainer = styled(Box)`
  border-top: 1px solid ${p => p.theme.greyLighter};
`;

const NavigationButton = styled(RawButton)`
  padding: 15px;
`;
const FooterBar = ({
  goPrev,
  goNext,
  jumpToStory,
  zoomTo,
  currentHumanIndex,
  totalStories
}: FooterBarProps) => {
  const isEnd = currentHumanIndex === totalStories;
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <FooterContainer>
      <Box flex={1}>
        {totalStories > 1 && (
          <NavigationButton disabled={currentHumanIndex == 1} onClick={goPrev}>
            <StyledIcon
              displayInline
              styledWidth="15px"
              fillColor={theme.grey}
              glyph={Icon.GLYPHS.left}
            />{" "}
            {t("story.prev")}
          </NavigationButton>
        )}
      </Box>

      <Box flex={1} centered>
        <StyledIcon
          displayInline
          styledWidth="15px"
          glyph={Icon.GLYPHS.menu}
          fillColor={theme.grey}
        />
        <div>
          {currentHumanIndex} / {totalStories}
        </div>
        <LocationBtn onClick={zoomTo} />
      </Box>
      <Box flex={1} right>
        {totalStories > 1 && (
          <NavigationButton onClick={isEnd ? () => jumpToStory(0) : goNext}>
            {isEnd ? (
              <>
                {t("story.restart")}{" "}
                <StyledIcon
                  displayInline
                  styledWidth="15px"
                  glyph={Icon.GLYPHS.revert}
                  fillColor={theme.grey}
                />
              </>
            ) : (
              <>
                {t("story.next")}{" "}
                <StyledIcon
                  displayInline
                  styledWidth="15px"
                  glyph={Icon.GLYPHS.right}
                  fillColor={theme.grey}
                />
              </>
            )}
          </NavigationButton>
        )}
      </Box>
    </FooterContainer>
  );
};

export default FooterBar;
