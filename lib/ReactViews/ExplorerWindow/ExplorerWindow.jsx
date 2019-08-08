import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import classNames from "classnames";
import ko from "terriajs-cesium/Source/ThirdParty/knockout";

import {
  CATALOG_ROUTE,
  CATALOG_MEMBER_ROUTE
} from "../../ReactViewModels/TerriaRouting.js";
import ObserveModelMixin from "../ObserveModelMixin";
import Tabs from "./Tabs.jsx";

import Styles from "./explorer-window.scss";

const SLIDE_DURATION = 300;

const ExplorerWindow = createReactClass({
  displayName: "ExplorerWindow",
  mixins: [ObserveModelMixin],
  getInitialState() {
    return {
      visible: false,
      slidIn: true
    };
  },
  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
  },
  close() {
    this.props.viewState.explorerPanelIsVisible = false;
    this.props.viewState.switchMobileView("nowViewing");
    this.onVisibilityChange(false);
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.props.viewState.matchFromExplorer = this.props.match;
    this.props.viewState.explorerPanelAnimating = true;
    const props = this.props;
    if (
      (props.match && props.match.path === CATALOG_MEMBER_ROUTE) ||
      props.match.path === CATALOG_ROUTE
    ) {
      this.props.viewState.explorerPanelIsVisible = true;
      this.onVisibilityChange(true);
    }

    this._pickedFeaturesSubscription = ko
      .pureComputed(this.isVisible, this)
      .subscribe(this.onVisibilityChange);
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

  componentDidUpdate() {
    this.props.viewState.matchFromExplorer = this.props.match;
    if (this.isVisible() && !this.state.visible) {
      this.onVisibilityChange(true);
    }
    if (this.props.viewState.explorerPanelIsVisible && !this.state.visible) {
      this.onVisibilityChange(true);
    }
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

      setTimeout(() => {
        this.props.viewState.explorerPanelAnimating = false;
        this.props.viewState.explorerPanelIsVisible = true;
      }, SLIDE_DURATION);
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
      this.props.match.path === CATALOG_MEMBER_ROUTE ||
      this.props.match.path === CATALOG_ROUTE
    );
  },

  render() {
    const visible = this.isVisible();

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
            title="Close data panel"
            data-target="close-modal"
          >
            Done
          </button>
          <Tabs terria={this.props.terria} viewState={this.props.viewState} />
        </div>
      </div>
    ) : null;
  }
});

module.exports = withRouter(ExplorerWindow);
