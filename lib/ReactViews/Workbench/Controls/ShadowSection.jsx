"use strict";

import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import CommonStrata from "../../../Models/CommonStrata";
import Icon from "./../../Icon";
import Styles from "./shadow-section.scss";
import { withTranslation } from "react-i18next";

const ShadowSection = observer(
  createReactClass({
    displayName: "ShadowSection",

    propTypes: {
      item: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    changeShadows(event) {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "shadows",
          event.target.value
        );
      });
      this.props.item.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
      const { t } = this.props;
      const item = this.props.item;

      // This section only makes sense if we have a layer that supports shadows.
      if (
        item.disableUserChanges ||
        !defined(item.shadows) ||
        !item.showShadowUi
      ) {
        return null;
      }

      return (
        <div className={Styles.shadowSelector}>
          <label className={Styles.title} htmlFor="shadows">
            {t("workbench.shadows.label")}
          </label>
          <select
            className={Styles.field}
            name="shadows"
            value={item.shadows}
            onChange={this.changeShadows}
          >
            <option key="none" value="NONE">
              {t("workbench.shadows.none")}
            </option>
            <option key="cast" value="CAST">
              {t("workbench.shadows.cast")}
            </option>
            <option key="receive" value="RECEIVE">
              {t("workbench.shadows.receive")}
            </option>
            <option key="both" value="BOTH">
              {t("workbench.shadows.both")}
            </option>
          </select>
          <Icon glyph={Icon.GLYPHS.opened} />
        </div>
      );
    }
  })
);
module.exports = withTranslation()(ShadowSection);
