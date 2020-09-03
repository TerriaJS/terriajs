import React, { useState } from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";

import ObserveModelMixin from "../ObserveModelMixin";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

import Styles from "./internet-explorer-overlay.scss";
import Icon from "../Icon.jsx";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";

import Spacing from "../../Styled/Spacing";

import { useKeyPress } from "../Hooks/useKeyPress.js";

// Shamelessly copy-pasted from WelcomeMessage
const InternetExplorerOverlay = createReactClass({
  displayName: "InternetExplorerOverlay",
  mixins: [ObserveModelMixin],
  propTypes: {
    viewState: PropTypes.object.isRequired
  },
  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    const { viewState } = this.props;
    const shouldShow =
      viewState.terria.configParameters.showIEMessage &&
      window.navigator.userAgent.indexOf("Trident/") > -1;
    this.props.viewState.showIEMessage = shouldShow;
    knockout.track(this.props.viewState, ["showIEMessage"]);
  },
  render() {
    const viewState = this.props.viewState || {};

    return (
      <IEMessagePure
        showIEMessage={viewState.showIEMessage}
        setShowIEMessage={bool => {
          viewState.showIEMessage = bool;
        }}
        isTopElement={
          this.props.viewState.topElement === "InternetExplorerOverlay"
        }
        viewState={this.props.viewState}
      />
    );
  }
});

export const IEMessagePure = props => {
  const { showIEMessage, setShowIEMessage, isTopElement, viewState } = props;
  // This is required so we can do nested animations
  const [messageVisible, setMessageVisible] = useState(showIEMessage);
  const [shouldOpenFeedback, setShouldOpenFeedback] = useState(false);

  const handleClose = () => {
    setShowIEMessage(false);
  };

  useKeyPress("Escape", () => {
    if (showIEMessage) {
      handleClose(false);
    }
  });

  return (
    <FadeIn
      isVisible={showIEMessage}
      onEnter={() => setMessageVisible(true)}
      transitionProps={{
        onExiting: () => setMessageVisible(false),
        onExited: () => {
          if (shouldOpenFeedback) {
            setShouldOpenFeedback(false);
            viewState.feedbackFormIsVisible = true;
          }
        }
      }}
    >
      <div
        className={classNames({
          [Styles.ieMessageWrapper]: true,
          "top-element": isTopElement
        })}
      >
        <SlideUpFadeIn isVisible={messageVisible}>
          <article className={Styles.ieMessage}>
            <button
              type="button"
              className={Styles.closeBtn}
              onClick={() => handleClose()}
              title="Close"
              aria-label="Close"
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
            <h1>
              Terria is ending support for Internet Explorer on 1 November.
            </h1>
            <span className={Styles.ieMessageBody}>
              <div>
                <p>
                  After then, this map won&apos;t work in your current browser.
                </p>
                <p>
                  Please switch to a more modern browser like{" "}
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://www.google.com/chrome/"
                  >
                    Google Chrome
                  </a>{" "}
                  or{" "}
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://www.mozilla.org/en-US/firefox/new/"
                  >
                    Firefox
                  </a>
                  .
                </p>
                <p>
                  For more information, read{" "}
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://medium.com/terria/terria-is-ending-support-for-internet-explorer-11-a75383f4b18e"
                  >
                    our blog post.
                  </a>
                </p>
              </div>
              <If condition={!viewState.useSmallScreenInterface}>
                <Spacing bottom={10} />
              </If>
              <If condition={viewState.useSmallScreenInterface}>
                <Spacing bottom={4} />
              </If>
              <div>
                <button
                  className={classNames(
                    Styles.ieMessageButton,
                    Styles.ieMessageButtonPrimary
                  )}
                  onClick={() => handleClose()}
                >
                  Continue
                </button>
                <button
                  className={classNames(
                    Styles.ieMessageButton,
                    Styles.ieMessageButtonTertiary
                  )}
                  onClick={() => {
                    handleClose();
                    setShouldOpenFeedback(true);
                  }}
                >
                  Get in touch
                </button>
              </div>
            </span>
          </article>
        </SlideUpFadeIn>
      </div>
    </FadeIn>
  );
};

IEMessagePure.propTypes = {
  showIEMessage: PropTypes.bool.isRequired,
  setShowIEMessage: PropTypes.func.isRequired,
  isTopElement: PropTypes.bool.isRequired,
  viewState: PropTypes.object.isRequired
};

export default InternetExplorerOverlay;
