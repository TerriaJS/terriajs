"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ChartPanel from "../Custom/Chart/ChartPanel.jsx";
import ChartDisclaimer from "./ChartDisclaimer.jsx";
import Timeline from "./Timeline/Timeline.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./bottom-dock.scss";

const BottomDock = createReactClass({
  mixins: [ObserveModelMixin],

  displayName: "BottomDock",

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    domElementRef: PropTypes.func
  },

  handleClick() {
    this.props.viewState.topElement = "BottomDock";
  },

  render() {
    const terria = this.props.terria;

    return (
      <div
        className={`${Styles.bottomDock} ${
          this.props.viewState.topElement === "BottomDock" ? "top-element" : ""
        }`}
        ref={this.props.domElementRef}
        tabIndex={0}
        onClick={this.handleClick}
      >
        <ChartDisclaimer terria={terria} viewState={this.props.viewState} />
        <ChartPanel
          terria={terria}
          onHeightChange={this.onHeightChange}
          viewState={this.props.viewState}
        />
        <If condition={terria.timeSeriesStack.topLayer}>
          <Timeline terria={terria} />
        </If>
      </div>
    );
  }
});

module.exports = BottomDock;
