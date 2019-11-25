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

import getReactElementFromContents from "../ReactHelpers/getReactElementFromContents";
import { useKeyPress } from "../Hooks/useKeyPress.js";
import { runInAction } from "mobx";

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
    const shouldShow = !viewState.terria.getLocalProperty(LOCAL_PROPERTY_KEY);
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

export const WelcomeMessagePure = ({
  showWelcomeMessage,
  setShowWelcomeMessage,
  isTopElement,
  viewState
}) => {
  // This is required so we can do nested animations
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcomeMessage);
  const [shouldExploreData, setShouldExploreData] = useState(false);
  const {
    WelcomeMessage,
    WelcomeMessagePrimaryBtn,
    WelcomeMessageSecondaryBtn,
    WelcomeMessageDissmissText,

    WelcomeMessagePrimaryBtnClick,
    WelcomeMessageSecondaryBtnClick
  } = viewState.language;

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
            runInAction(() => {
              viewState.topElement = "AddData";
              viewState.openAddData();
            });
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
              runInAction(() => {
                viewState.topElement = "WelcomeMessage";
              });
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className={Styles.closeBtn}
              onClick={() => handleClose(false)}
              title="Close"
              aria-label="Close"
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
            <h1>
              Spatial data made <span className={Styles.highlight}>easy.</span>
            </h1>
            <span className={Styles.welcomeModalBody}>
              <div>{getReactElementFromContents(WelcomeMessage)}</div>
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
                      WelcomeMessagePrimaryBtnClick();
                    } else {
                      setShouldExploreData(true);
                    }
                  }}
                >
                  {getReactElementFromContents(WelcomeMessagePrimaryBtn)}
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
                      WelcomeMessageSecondaryBtnClick();
                      // } else {
                      //   setTimeout(() => {
                      //     viewState.showHelpMenu = true;
                      //   }, 300);
                      // }
                    }}
                  >
                    {getReactElementFromContents(WelcomeMessageSecondaryBtn)}
                  </button>
                )}
              </div>
              <button
                className={Styles.welcomeModalCloseLink}
                onClick={() => handleClose(true)}
              >
                {getReactElementFromContents(WelcomeMessageDissmissText)}
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
