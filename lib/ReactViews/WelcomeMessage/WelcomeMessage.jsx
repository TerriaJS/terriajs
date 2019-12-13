import React, { useState } from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";

import ObserveModelMixin from "../ObserveModelMixin";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

import Styles from "./welcome-message.scss";
import Icon from "../Icon.jsx";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";

import Spacing from "../../Styled/Spacing";

import { useKeyPress } from "../Hooks/useKeyPress.js";
import { useTranslation, Trans } from "react-i18next";

export const WELCOME_MESSAGE_NAME = "welcomeMessage";
export const LOCAL_PROPERTY_KEY = `${WELCOME_MESSAGE_NAME}Prompted`;

const WelcomeMessage = createReactClass({
  displayName: "WelcomeMessage",
  mixins: [ObserveModelMixin],
  propTypes: {
    viewState: PropTypes.object.isRequired
  },
  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    const { viewState } = this.props;
    const shouldShow =
      (viewState.terria.configParameters.showWelcomeMessage &&
        !viewState.terria.getLocalProperty(LOCAL_PROPERTY_KEY)) ||
      false;
    this.props.viewState.showWelcomeMessage = shouldShow;
    knockout.track(this.props.viewState, ["showWelcomeMessage"]);
  },
  render() {
    const viewState = this.props.viewState || {};

    return (
      <WelcomeMessagePure
        showWelcomeMessage={viewState.showWelcomeMessage}
        setShowWelcomeMessage={bool => {
          viewState.showWelcomeMessage = bool;
        }}
        isTopElement={this.props.viewState.topElement === "WelcomeMessage"}
        viewState={this.props.viewState}
      />
    );
  }
});

export const WelcomeMessagePure = props => {
  const {
    showWelcomeMessage,
    setShowWelcomeMessage,
    isTopElement,
    viewState
  } = props;
  const { t } = useTranslation();
  // This is required so we can do nested animations
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcomeMessage);
  const [shouldExploreData, setShouldExploreData] = useState(false);
  const {
    WelcomeMessagePrimaryBtnClick,
    WelcomeMessageSecondaryBtnClick
  } = viewState.terria.overrides;
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
            viewState.topElement = "AddData";
            viewState.openAddData();
          }
        }
      }}
    >
      <div
        className={classNames({
          [Styles.welcomeModalWrapper]: true,
          "top-element": isTopElement
        })}
        onClick={handleClose.bind(null, false)}
      >
        <SlideUpFadeIn isVisible={welcomeVisible}>
          <article
            className={Styles.welcomeModal}
            // Allows interaction w/ modal without closing
            onClick={e => {
              viewState.topElement = "WelcomeMessage";
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
          </article>
        </SlideUpFadeIn>
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

export default WelcomeMessage;
