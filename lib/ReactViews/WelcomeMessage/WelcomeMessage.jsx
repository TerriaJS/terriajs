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
// import { useTranslation, Trans } from "react-i18next";
import { observer } from "mobx-react";
import styled from "styled-components";
import Button, { RawButton } from "../../Styled/Button";
import VideoGuide from "../Map/Panels/HelpPanel/VideoGuide";

export const WELCOME_MESSAGE_NAME = "welcomeMessage";
export const LOCAL_PROPERTY_KEY = `${WELCOME_MESSAGE_NAME}Prompted`;
const WELCOME_MESSAGE_VIDEO = "welcomeMessageVideo";

const WelcomeModalWrapper = styled(Box)`
  z-index: 99999;
  background-color: rgba(0, 0, 0, 0.5);
`;

function WelcomeMessageButton(props) {
  return (
    <Button
      primary
      rounded
      fullWidth
      css={`
        height: 50px;
      `}
      onClick={props.onClick}
    >
      <Box centered>
        {props.buttonIcon && (
          <StyledIcon light styledWidth={"25px"} glyph={props.buttonIcon} />
        )}
        <Spacing right={2} />
        {props.buttonText && (
          <Text textLight extraLarge>
            {props.buttonText}
          </Text>
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
    console.log(this.props.theme);
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
  // const { t } = useTranslation();
  // This is required so we can do nested animations
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcomeMessage);
  const [shouldExploreData, setShouldExploreData] = useState(false);
  // const {
  //   WelcomeMessagePrimaryBtnClick,
  //   WelcomeMessageSecondaryBtnClick
  // } = viewState.terria.overrides;
  const handleClose = (persist = false) => {
    setShowWelcomeMessage(false);
    if (persist) {
      viewState.terria.setLocalProperty(LOCAL_PROPERTY_KEY, true);
    }
  };

  useKeyPress("Escape", () => {
    if (showWelcomeMessage) {
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
          if (shouldExploreData) {
            setShouldExploreData(false);
            viewState.openAddData();
            viewState.setTopElement("AddData");
          }
        }
      }}
    >
      <div /* onClick={handleClose.bind(null, true)}*/>
        <WelcomeModalWrapper fullWidth fullHeight positionAbsolute centered>
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
              styledWidth={"617px"}
              styledHeight={"454px"}
              displayInlineBlock
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
                  Let&apos;s get you started
                </Text>
                <Spacing bottom={3} />
                <Text textLight>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
                  pretium pretium tempor. Ut eget imperdiet neque. In volutpat
                  ante semper diam molestie, et aliquam erat laoreet. Sed sit
                  amet arcu aliquet, molestie justo at, auctor nunc.
                </Text>
              </Box>
              <Spacing bottom={6} />
              <Box fullWidth styledHeight={"180px"}>
                <Box
                  col6
                  centered
                  fullHeight
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
                <Box styledWidth={"37%"} displayInlineBlock>
                  <WelcomeMessageButton
                    buttonText={"Take the tour"}
                    buttonIcon={Icon.GLYPHS.tour}
                  />
                  <Spacing bottom={3} />
                  <WelcomeMessageButton
                    buttonText={"I'll need some help"}
                    buttonIcon={Icon.GLYPHS.help}
                    onClick={() => {
                      handleClose(false);
                      props.viewState.showHelpPanel();
                    }}
                  />
                  <Spacing bottom={3} />
                  <WelcomeMessageButton
                    buttonText={"Explore map data"}
                    buttonIcon={Icon.GLYPHS.add}
                    onClick={() => {
                      handleClose(false);
                      setShouldExploreData(true);
                    }}
                  />
                </Box>
              </Box>
              <Spacing bottom={13} />
              <Box fullWidth centered>
                <RawButton onClick={handleClose.bind(null, true)}>
                  <TextSpan small textLight>
                    Close message and don’t show me this again
                  </TextSpan>
                </RawButton>
              </Box>
            </Box>
            {/* <article
            className={Styles.welcomeModal}
            // Allows interaction w/ modal without closing
            onClick={e => {
              viewState.setTopElement("WelcomeMessage");
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className={Styles.closeBtn}
              onClick={() => handleClose(true)} // persist close if they put the effort to clicking "X" instead of click-away-from-modal
              title="Close"
              aria-label="Close"
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
            <h1>
              <Trans i18nKey="welcomeMessage.title">
                Spatial data made{" "}
                <span className={Styles.highlight}>easy.</span>
              </Trans>
            </h1>
            <span className={Styles.welcomeModalBody}>
              <div>{t("welcomeMessage.WelcomeMessage")}</div>
              <If condition={!viewState.useSmallScreenInterface}>
                <Spacing bottom={10} />
              </If>
              <If condition={viewState.useSmallScreenInterface}>
                <Spacing bottom={4} />
              </If>
              <div>
                <button
                  className={classNames(
                    Styles.welcomeModalButton,
                    Styles.welcomeModalButtonPrimary
                  )}
                  onClick={() => {
                    handleClose(true);
                    if (WelcomeMessagePrimaryBtnClick) {
                      WelcomeMessagePrimaryBtnClick(props);
                    } else {
                      setShouldExploreData(true);
                    }
                  }}
                >
                  {t("welcomeMessage.WelcomeMessagePrimaryBtn")}
                </button>
                {WelcomeMessageSecondaryBtnClick && (
                  <button
                    className={classNames(
                      Styles.welcomeModalButton,
                      Styles.welcomeModalButtonTertiary
                    )}
                    onClick={() => {
                      handleClose(true);
                      // if (WelcomeMessageSecondaryBtnClick) {
                      WelcomeMessageSecondaryBtnClick(props);
                      // } else {
                      //   setTimeout(() => {
                      //     viewState.showHelpMenu = true;
                      //   }, 300);
                      // }
                    }}
                  >
                    {t("welcomeMessage.WelcomeMessageSecondaryBtn")}
                  </button>
                )}
              </div>
              <button
                className={Styles.welcomeModalCloseLink}
                onClick={() => handleClose(true)}
              >
                {t("welcomeMessage.WelcomeMessageDissmissText")}
              </button>
            </span>
          </article> */}
          </SlideUpFadeIn>
        </WelcomeModalWrapper>
      </div>
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
