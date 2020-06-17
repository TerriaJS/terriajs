import React, { useState } from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import PropTypes from "prop-types";

import Icon, { StyledIcon } from "../Icon.jsx";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";

import Spacing from "../../Styled/Spacing";
import Box from "../../Styled/Box";
import Text, { TextSpan } from "../../Styled/Text";

import { useKeyPress } from "../Hooks/useKeyPress.js";
import { useTranslation, Trans } from "react-i18next";
import { observer } from "mobx-react";
import styled from "styled-components";
import Button, { RawButton } from "../../Styled/Button";
import { TourPortalDisplayName } from "../Tour/TourPortal";
import VideoGuide from "../Map/Panels/HelpPanel/VideoGuide";

export const WELCOME_MESSAGE_NAME = "welcomeMessage";
export const LOCAL_PROPERTY_KEY = `${WELCOME_MESSAGE_NAME}Prompted`;
const WELCOME_MESSAGE_VIDEO = "welcomeMessageVideo";

const WelcomeModalWrapper = styled(Box)`
  z-index: 99999;
  background-color: rgba(0, 0, 0, 0.75);
`;

function WelcomeMessageButton(props) {
  return (
    <Button primary rounded fullWidth onClick={props.onClick}>
      <Box centered>
        {props.buttonIcon && (
          <StyledIcon light styledWidth={"22px"} glyph={props.buttonIcon} />
        )}
        <Spacing right={2} />
        {props.buttonText && (
          <TextSpan textLight extraLarge>
            {props.buttonText}
          </TextSpan>
        )}
      </Box>
    </Button>
  );
}

WelcomeMessageButton.propTypes = {
  buttonText: PropTypes.string,
  buttonIcon: PropTypes.object,
  onClick: PropTypes.func
};

@observer
class WelcomeMessage extends React.Component {
  static displayName = "WelcomeMessage";

  static propTypes = {
    viewState: PropTypes.object,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const viewState = this.props.viewState;
    const shouldShow =
      (viewState.terria.configParameters.showWelcomeMessage &&
        !viewState.terria.getLocalProperty(LOCAL_PROPERTY_KEY)) ||
      false;

    this.props.viewState.setShowWelcomeMessage(shouldShow);
  }

  render() {
    const viewState = this.props.viewState || {};
    return (
      <WelcomeMessagePure
        showWelcomeMessage={viewState.showWelcomeMessage}
        setShowWelcomeMessage={bool =>
          this.props.viewState.setShowWelcomeMessage(bool)
        }
        isTopElement={this.props.viewState.topElement === "WelcomeMessage"}
        viewState={this.props.viewState}
      />
    );
  }
}

export const WelcomeMessagePure = props => {
  const { showWelcomeMessage, setShowWelcomeMessage, viewState } = props;
  const { t } = useTranslation();
  // This is required so we can do nested animations
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcomeMessage);
  const [shouldTakeTour, setShouldTakeTour] = useState(false);
  const [shouldExploreData, setShouldExploreData] = useState(false);
  const [shouldOpenHelp, setShouldOpenHelp] = useState(false);
  // const {
  //   WelcomeMessagePrimaryBtnClick,
  //   WelcomeMessageSecondaryBtnClick
  // } = viewState.terria.overrides;
  const handleClose = (persist = false) => {
    setShowWelcomeMessage(false);
    setShouldOpenHelp(false);
    if (persist) {
      viewState.terria.setLocalProperty(LOCAL_PROPERTY_KEY, true);
    }
    setShouldOpenHelp(false);
  };

  useKeyPress("Escape", () => {
    if (showWelcomeMessage && viewState.videoGuideVisible === "") {
      handleClose(false);
    }
  });

  return (
    <FadeIn
      isVisible={showWelcomeMessage}
      onEnter={() => setWelcomeVisible(true)}
      transitionProps={{
        onExiting: () => setWelcomeVisible(false),
        onExited: () => {
          if (shouldTakeTour) {
            setShouldTakeTour(false);
            viewState.setTourIndex(0);
            viewState.setShowTour(true);
            viewState.setTopElement(TourPortalDisplayName);
          }
          if (shouldExploreData) {
            setShouldExploreData(false);
            viewState.openAddData();
            viewState.setTopElement("AddData");
          }
          if (shouldOpenHelp) {
            setShouldOpenHelp(false);
            viewState.showHelpPanel();
          }
        }
      }}
    >
      <WelcomeModalWrapper
        fullWidth
        fullHeight
        positionAbsolute
        right
        onClick={() => handleClose(false)}
      >
        <Box
          styledWidth={
            viewState.isMapFullScreen || viewState.useSmallScreenInterface
              ? "100%"
              : "calc(100% - 350px)"
          } // TODO: use variable $work-bench-width
          fullHeight
          centered
        >
          <VideoGuide
            viewState={viewState}
            videoLink={"https://www.youtube.com/embed/NTtSM70rIvI"}
            background={
              "https://img.youtube.com/vi/NTtSM70rIvI/maxresdefault.jpg"
            }
            videoName={WELCOME_MESSAGE_VIDEO}
          />
          <SlideUpFadeIn isVisible={welcomeVisible}>
            <Box
              styledWidth={"667px"}
              styledMinHeight={"504px"}
              displayInlineBlock
              paddedRatio={6}
              onClick={e => {
                viewState.setTopElement("WelcomeMessage");
                e.stopPropagation();
              }}
            >
              <RawButton
                onClick={handleClose.bind(null, false)}
                css={`
                  float: right;
                `}
              >
                <StyledIcon
                  styledWidth={"24px"}
                  light
                  glyph={Icon.GLYPHS.closeLight}
                />
              </RawButton>
              <Spacing bottom={7} />
              <Box displayInlineBlock col10>
                <Text
                  bold
                  textLight
                  styledSize={"36px"}
                  styledLineHeight={"49px"}
                >
                  {t("welcomeMessage.title")}
                </Text>
                <Spacing bottom={3} />
                <Text textLight>
                  <Trans i18nKey="welcomeMessage.welcomeMessage">
                    Interested in data discovery and exploration?
                    <br />
                    Dive right in and get started or check the following help
                    guide options.
                  </Trans>
                </Text>
              </Box>
              <Spacing bottom={6} />
              <Box fullWidth styledMinHeight={"160px"}>
                <If condition={!viewState.useSmallScreenInterface}>
                  <Box
                    col6
                    centered
                    backgroundImage={
                      "https://img.youtube.com/vi/NTtSM70rIvI/maxresdefault.jpg"
                    }
                    backgroundBlackOverlay={"50%"}
                  >
                    <RawButton
                      fullWidth
                      fullHeight
                      onClick={() =>
                        viewState.setVideoGuideVisible(WELCOME_MESSAGE_VIDEO)
                      }
                    >
                      <StyledIcon
                        styledWidth={"48px"}
                        light
                        glyph={Icon.GLYPHS.playInverted}
                        css={`
                          margin: auto;
                        `}
                      />
                    </RawButton>
                  </Box>
                  <Spacing right={5} />
                </If>
                <Box
                  styledWidth={
                    viewState.useSmallScreenInterface ? "100%" : "37%"
                  }
                  displayInlineBlock
                >
                  <If condition={!viewState.useSmallScreenInterface}>
                    <WelcomeMessageButton
                      onClick={() => {
                        handleClose(false);
                        // not sure if we should wait for the exit animation,
                        // if we don't, we have a flicker due to the difference
                        // in overlay darkness - but if we wait, it goes
                        // dark -> light -> dark anyway..
                        setShouldTakeTour(true);
                        viewState.setTourIndex(0);
                        viewState.setShowTour(true);
                        viewState.setTopElement(TourPortalDisplayName);
                      }}
                      buttonText={t("welcomeMessage.tourBtnText")}
                      buttonIcon={Icon.GLYPHS.tour}
                    />
                    <Spacing bottom={4} />
                    <WelcomeMessageButton
                      buttonText={t("welcomeMessage.helpBtnText")}
                      buttonIcon={Icon.GLYPHS.newHelp}
                      onClick={() => {
                        handleClose(false);
                        setShouldOpenHelp(true);
                      }}
                    />
                  </If>
                  <Spacing bottom={4} />
                  <WelcomeMessageButton
                    buttonText={t("welcomeMessage.exploreDataBtnText")}
                    buttonIcon={Icon.GLYPHS.add}
                    onClick={() => {
                      handleClose(false);
                      setShouldExploreData(true);
                    }}
                  />
                </Box>
              </Box>
              <If condition={!viewState.useSmallScreenInterface}>
                <Spacing bottom={13} />
              </If>
              <Box fullWidth centered>
                <RawButton onClick={handleClose.bind(null, true)}>
                  <TextSpan textLight isLink>
                    {t("welcomeMessage.dismissText")}
                  </TextSpan>
                </RawButton>
              </Box>
            </Box>
          </SlideUpFadeIn>
        </Box>
      </WelcomeModalWrapper>
    </FadeIn>
  );
};

WelcomeMessagePure.propTypes = {
  showWelcomeMessage: PropTypes.bool.isRequired,
  setShowWelcomeMessage: PropTypes.func.isRequired,
  isTopElement: PropTypes.bool.isRequired,
  viewState: PropTypes.object.isRequired
};

export default withTranslation()(withTheme(WelcomeMessage));
