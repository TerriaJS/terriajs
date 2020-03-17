"use strict";

import Slider from "rc-slider";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./opacity-section.scss";
import { withTranslation } from "react-i18next";

const OpacitySection = createReactClass({
  displayName: "OpacitySection",
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  changeOpacity(value) {
    this.props.item.opacity = value / 100.0;
  },

  render() {
    const item = this.props.item;
    const { t } = this.props;
    if (!item.supportsOpacity) {
      return null;
    }
    return (
      <div className={Styles.opacity}>
        <label htmlFor="opacity">
          {t("workbench.opacity", {
            opacity: parseInt(item.opacity * 100, 10)
          })}
        </label>
        <Slider
          className={Styles.opacitySlider}
          min={0}
          max={100}
          value={(item.opacity * 100) | 0}
          onChange={this.changeOpacity}
        />
      </div>
    );
  }
});
module.exports = withTranslation()(OpacitySection);
