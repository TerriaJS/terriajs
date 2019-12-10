import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";
import ko from "terriajs-cesium/Source/ThirdParty/knockout";
import { withTranslation } from "react-i18next";

import ObserveModelMixin from "../ObserveModelMixin";
import Tabs from "./Tabs.jsx";

import Styles from "./explorer-window.scss";

const SLIDE_DURATION = 300;

const ExplorerWindow = createReactClass({
  displayName: "ExplorerWindow",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },
  close() {
    this.props.viewState.explorerPanelIsVisible = false;
    this.props.viewState.switchMobileView("nowViewing");
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.props.viewState.explorerPanelAnimating = true;

    this._pickedFeaturesSubscription = ko
      .pureComputed(this.isVisible, this)
      .subscribe(this.onVisibilityChange);

    this.onVisibilityChange(this.isVisible());
  },

  componentDidMount() {
    this.escKeyListener = e => {
      // Only explicitly check share modal state, move to levels/"layers of modals" logic if we need to go any deeper
      if (e.keyCode === 27 && !this.props.viewState.shareModalIsVisible) {
        this.close();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
  },

  onVisibilityChange(isVisible) {
    if (isVisible) {
      this.slideIn();
    } else {
      this.slideOut();
    }
  },

  slideIn() {
    this.props.viewState.explorerPanelAnimating = true;

    this.setState({
      visible: true
    });
    setTimeout(() => {
      this.setState({
        slidIn: true
      });

      setTimeout(
        () => (this.props.viewState.explorerPanelAnimating = false),
        SLIDE_DURATION
      );
    });
  },

  slideOut() {
    this.setState({
      slidIn: false
    });
    setTimeout(() => {
      this.setState({
        visible: false
      });
    }, SLIDE_DURATION);
  },

  componentWillUnmount() {
    // ExplorerWindow stays mounted, but leave this in to ensure it gets cleaned up if that ever changes
    window.removeEventListener("keydown", this.escKeyListener, true);

    this._pickedFeaturesSubscription.dispose();
  },

  isVisible() {
    return (
      !this.props.viewState.useSmallScreenInterface &&
      !this.props.viewState.hideMapUi() &&
      this.props.viewState.explorerPanelIsVisible
    );
  },

  render() {
    const { t } = this.props;
    const visible = this.state.visible;

    return visible ? (
      <div
        className={classNames(
          Styles.modalWrapper,
          this.props.viewState.topElement === "AddData" ? "top-element" : ""
        )}
        id="explorer-panel-wrapper"
        aria-hidden={!visible}
      >
        <div
          onClick={this.close}
          id="modal-overlay"
          className={Styles.modalOverlay}
          tabIndex="-1"
        />
        <div
          id="explorer-panel"
          className={classNames(Styles.explorerPanel, Styles.modalContent, {
            [Styles.isMounted]: this.state.slidIn
          })}
          aria-labelledby="modalTitle"
          aria-describedby="modalDescription"
          role="dialog"
        >
          <button
            type="button"
            onClick={this.close}
            className={Styles.btnCloseModal}
            title={t("addData.closeDataPanel")}
            data-target="close-modal"
          >
            {t("addData.done")}
          </button>
          <Tabs terria={this.props.terria} viewState={this.props.viewState} />
        </div>
      </div>
    ) : null;
  }
});

module.exports = withTranslation()(ExplorerWindow);
