"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";

import defined from "terriajs-cesium/Source/Core/defined";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import { withTranslation } from "react-i18next";

// import Icon from '../../Icon';
import Styles from "./left-right-section.scss";
import { observer } from "mobx-react";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { runInAction } from "mobx";

const LeftRightButton = styled.button`
  text-align: center;
  color: ${p => p.theme.textLight};
  background-color: ${p => p.theme.dark};
  ${p =>
    p.isActive &&
    `
    background-color: ${p.theme.colorSplitter};
  `}
  &:hover,
  &:focus {
    background-color: ${p => p.theme.colorSplitter};
  }
`;

const LeftRightSection = observer(
  createReactClass({
    displayName: "LeftRightSection",

    propTypes: {
      item: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
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
      const { t } = this.props;
      if (
        !item.supportsSplitting ||
        !defined(splitDirection) ||
        !item.terria.showSplitter
      ) {
        return null;
      }
      return (
        <div className={Styles.leftRightSection}>
          <LeftRightButton
            type="button"
            onClick={this.goLeft}
            className={classNames(Styles.goLeft)}
            title={t("splitterTool.workbench.goleftTitle")}
            isActive={splitDirection === ImagerySplitDirection.LEFT}
          >
            {t("splitterTool.workbench.goleft")}
          </LeftRightButton>
          <LeftRightButton
            type="button"
            onClick={this.goBoth}
            className={classNames(Styles.goBoth)}
            title={t("splitterTool.workbench.bothTitle")}
            isActive={splitDirection === ImagerySplitDirection.NONE}
          >
            {t("splitterTool.workbench.both")}
          </LeftRightButton>
          <LeftRightButton
            type="button"
            onClick={this.goRight}
            className={classNames(Styles.goRight)}
            title={t("splitterTool.workbench.gorightTitle")}
            isActive={splitDirection === ImagerySplitDirection.RIGHT}
          >
            {t("splitterTool.workbench.goright")}
          </LeftRightButton>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(LeftRightSection);
