/**
 * Prompt.tsx - don't use without guarding on useSmallScreenInterface - it won't look pretty!
 */
import React, { useState } from "react";
import { useTheme } from "styled-components";

import FadeIn from "../Transitions/FadeIn/FadeIn";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";

const TourExplanationBox: any = require("../Tour/TourExplanationBox").default;
const TourPrefaceBox: any = require("../Tour/TourPrefaceBox").default;

import CloseButton from "../Generic/CloseButton";
import ViewState from "../../ReactViewModels/ViewState";

const Box: any = require("../../Styled/Box").default;
const Button: any = require("../../Styled/Button").default;
const Spacing: any = require("../../Styled/Spacing").default;
const Text: any = require("../../Styled/Text").default;

interface PromptProps {
  viewState: ViewState;
  title: string;
  content: string;
  dismissLabel: string;
  acceptLabel: string;
  onDismiss: () => void;
  onAccept: () => void;
  isVisible: boolean;
}

export const Prompt: React.FC<PromptProps> = ({
  title,
  content,
  dismissLabel,
  acceptLabel,
  onDismiss,
  onAccept,
  isVisible
}) => {
  const theme = useTheme();
  // This is required so we can do nested animations
  const [childrenVisible, setChildrenVisible] = useState(isVisible);
  return (
    <FadeIn
      isVisible={isVisible}
      onEnter={() => setChildrenVisible(true)}
      transitionProps={{
        onExiting: () => setChildrenVisible(false)
      }}
    >
      <Box
        fullWidth
        fullHeight
        positionAbsolute
        css={`
          z-index: ${(p: any) => Number(p.theme.frontComponentZIndex) + 100};
        `}
      >
        <TourPrefaceBox
          onClick={onDismiss}
          role="presentation"
          aria-hidden="true"
          pseudoBg
        />
        <SlideUpFadeIn isVisible={childrenVisible}>
          <TourExplanationBox
            longer
            paddedRatio={4}
            column
            style={{
              right: 25,
              bottom: 45
            }}
          >
            <CloseButton
              color={theme.darkWithOverlay}
              topRight
              onClick={() => onDismiss()}
            />
            <Spacing bottom={2} />
            <Text extraExtraLarge bold textDarker>
              {title}
            </Text>
            <Spacing bottom={3} />
            <Text light medium textDarker>
              {content}
            </Text>
            <Spacing bottom={4} />
            <Text medium>
              <Box>
                <Button
                  fullWidth
                  secondary
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                >
                  {dismissLabel}
                </Button>
                <Spacing right={3} />
                <Button
                  primary
                  fullWidth
                  textProps={{ noFontSize: true }}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onAccept();
                  }}
                >
                  {acceptLabel}
                </Button>
              </Box>
            </Text>
            <Spacing bottom={1} />
          </TourExplanationBox>
        </SlideUpFadeIn>
      </Box>
    </FadeIn>
  );
};

export default Prompt;
