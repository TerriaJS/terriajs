"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../../ObserveModelMixin";

import Styles from "./shadow-section.scss";
import { runInAction } from "mobx";
import CommonStrata from "../../../Models/CommonStrata";
import { observer } from "mobx-react";

const ShadowSection = observer(
  createReactClass({
    displayName: "ShadowSection",
    mixins: [ObserveModelMixin],

    propTypes: {
      item: PropTypes.object.isRequired
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
      const item = this.props.item;

      // This section only makes sense if we have a layer that supports shadows.
      if (item.disableUserChanges || !defined(item.shadows)) {
        return null;
      }

      return (
        <div className={Styles.shadowSelector}>
          <label className={Styles.title} htmlFor="shadows">
            Shadows
          </label>
          <select
            className={Styles.field}
            name="shadows"
            value={item.shadows}
            onChange={this.changeShadows}
          >
            <option key="none" value="NONE">
              None
            </option>
            <option key="cast" value="CAST">
              Cast Only
            </option>
            <option key="receive" value="RECEIVE">
              Receive Only
            </option>
            <option key="both" value="BOTH">
              Cast and Receive
            </option>
          </select>
        </div>
      );
    }
  })
);
module.exports = ShadowSection;
