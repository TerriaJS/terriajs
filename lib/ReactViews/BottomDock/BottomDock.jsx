"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
// import ChartPanel from '../Custom/Chart/ChartPanel';
import { observer } from "mobx-react";
import Timeline from "./Timeline/Timeline";
import Styles from "./bottom-dock.scss";
import { runInAction } from "mobx";

const BottomDock = observer(
  createReactClass({
    displayName: "BottomDock",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      domElementRef: PropTypes.func
    },

    handleClick() {
      runInAction(() => {
        this.props.viewState.topElement = "BottomDock";
      });
    },

    render() {
      const terria = this.props.terria;
      const top = terria.timelineStack.top;

      return (
        <div
          className={`${Styles.bottomDock} ${
            this.props.viewState.topElement === "BottomDock"
              ? "top-element"
              : ""
          }`}
          ref={this.props.domElementRef}
          tabIndex={0}
          onClick={this.handleClick}
        >
          {/* <ChartPanel terria={terria} onHeightChange={this.onHeightChange} viewState={this.props.viewState}/> */}
          <If condition={top}>
            <Timeline terria={terria} />
          </If>
        </div>
      );
    }
  })
);

module.exports = BottomDock;
