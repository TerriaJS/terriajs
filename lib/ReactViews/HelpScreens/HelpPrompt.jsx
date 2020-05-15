import React from "react";
// import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { observer } from "mobx-react";
// import { autorun } from "mobx";
import TourPrefaceBox from "../Tour/TourPrefaceBox";
import TourExplanationBox from "../Tour/TourExplanationBox";

import CloseButton from "../Generic/CloseButton";

import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";

export const Prompt = ({ viewState, title, content, dismiss, accept }) => {
  const theme = useTheme();
  return (
    <>
      <TourPrefaceBox
        onClick={() => viewState.closeTour()}
        role="presentation"
        aria-hidden="true"
        pseudoBg
      />
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
          onClick={() => viewState.closeTour()}
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
              onClick={e => {
                e.stopPropagation();
                viewState.closeTour();
              }}
            >
              {dismiss}
            </Button>
            <Spacing right={3} />
            <Button
              primary
              fullWidth
              textProps={{ noFontSize: true }}
              onClick={e => {
                e.stopPropagation();
                viewState.setShowTour(true);
              }}
            >
              {accept}
            </Button>
          </Box>
        </Text>
        <Spacing bottom={1} />
      </TourExplanationBox>
    </>
  );
};
Prompt.propTypes = {
  viewState: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  dismiss: PropTypes.string.isRequired,
  accept: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired
};

export const HelpPromptDisplayName = "HelpPrompt";
export const HelpPrompt = observer(({ viewState }) => {
  const { t } = useTranslation();

  // if (viewState.useSmallScreenInterface || !showPortal) {
  //   return null;
  // }
  return (
    <Prompt
      viewState={viewState}
      title={t("satelliteGuidance.titleI")}
      content={t("satelliteGuidance.bodyI")}
      dismiss={t("satelliteGuidance.prevI")}
      accept={t("satelliteGuidance.nextI")}
    />
  );
});

export default HelpPrompt;
