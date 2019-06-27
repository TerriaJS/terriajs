import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import ModalPopup from "./ModalPopup";
import Tabs from "./Tabs";

const ExplorerWindow = observer(
  createReactClass({
    displayName: "ExplorerWindow",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired
    },

    onClose() {
      this.props.viewState.explorerPanelIsVisible = false;
      this.props.viewState.switchMobileView("nowViewing");
    },

    onStartAnimatingIn() {
      this.props.viewState.explorerPanelAnimating = true;
    },

    onDoneAnimatingIn() {
      this.props.viewState.explorerPanelAnimating = false;
    },

    isVisible() {
      return (
        !this.props.viewState.useSmallScreenInterface &&
        !this.props.viewState.hideMapUi() &&
        this.props.viewState.explorerPanelIsVisible
      );
    },

    render() {
      return (
        <ModalPopup
          isVisible={this.isVisible()}
          isTopElement={this.props.viewState.topElement === "AddData"}
          onClose={this.onClose}
          onStartAnimatingIn={this.onStartAnimatingIn}
          onDoneAnimatingIn={this.onDoneAnimatingIn}
        >
          <Tabs terria={this.props.terria} viewState={this.props.viewState} />
        </ModalPopup>
      );
    }
  })
);

module.exports = ExplorerWindow;
