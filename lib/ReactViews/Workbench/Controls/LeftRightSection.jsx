"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";

import defined from "terriajs-cesium/Source/Core/defined";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";

// import Icon from '../../Icon';
import Styles from "./left-right-section.scss";
import { observer } from "mobx-react";
import CommonStrata from "../../../Models/CommonStrata";
import { runInAction } from "mobx";

const LeftRightSection = observer(
  createReactClass({
    displayName: "LeftRightSection",

    propTypes: {
      item: PropTypes.object.isRequired
    },

    goLeft() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.LEFT
        );
      });
    },

    goBoth() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.NONE
        );
      });
    },

    goRight() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.RIGHT
        );
      });
    },

    render() {
      const item = this.props.item;
      const splitDirection = item.splitDirection;
      if (
        !item.supportsSplitting ||
        !defined(splitDirection) ||
        !item.terria.showSplitter
      ) {
        return null;
      }
      return (
        <div className={Styles.leftRightSection}>
          <button
            type="button"
            onClick={this.goLeft}
            className={classNames(Styles.goLeft, {
              [Styles.isActive]: splitDirection === ImagerySplitDirection.LEFT
            })}
            title="Show on the left side"
          >
            Left
          </button>
          <button
            type="button"
            onClick={this.goBoth}
            className={classNames(Styles.goBoth, {
              [Styles.isActive]: splitDirection === ImagerySplitDirection.NONE
            })}
            title="Show on both sides"
          >
            Both
          </button>
          <button
            type="button"
            onClick={this.goRight}
            className={classNames(Styles.goRight, {
              [Styles.isActive]: splitDirection === ImagerySplitDirection.RIGHT
            })}
            title="Show on the right side"
          >
            Right
          </button>
        </div>
      );
    }
  })
);

module.exports = LeftRightSection;
