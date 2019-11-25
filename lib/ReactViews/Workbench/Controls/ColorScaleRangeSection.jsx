"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../../ObserveModelMixin";
import defined from "terriajs-cesium/Source/Core/defined";
import { withTranslation } from "react-i18next";
import Styles from "./colorscalerange-section.scss";

const ColorScaleRangeSection = createReactClass({
  displayName: "ColorScaleRangeSection",
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    t: PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      minRange: -50,
      maxRange: 50
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.setState({
      minRange: this.props.minValue,
      maxRange: this.props.maxValue
    });
  },
  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      minRange: nextProps.minValue,
      maxRange: nextProps.maxValue
    });
  },

  updateRange(e) {
    e.preventDefault();
    const { t } = this.props;
    const min = parseFloat(this.state.minRange);
    if (min !== min) {
      // is NaN?
      this.props.item.terria.error.raiseEvent({
        sender: this.props.item,
        title: t("workbench.colorScaleRangeTitle"),
        message: t("workbench.colorScaleRangeMin")
      });
      return;
    }

    const max = parseFloat(this.state.maxRange);
    if (max !== max) {
      // is NaN?
      this.props.item.terria.error.raiseEvent({
        sender: this.props.item,
        title: t("workbench.colorScaleRangeTitle"),
        message: t("workbench.colorScaleRangeMax")
      });
      return;
    }

    if (max <= min) {
      this.props.item.terria.error.raiseEvent({
        sender: this.props.item,
        title: t("workbench.colorScaleRangeTitle"),
        message: t("workbench.colorScaleRangeMinSmallerThanMax")
      });
      return;
    }

    this.props.item.colorScaleMinimum = min;
    this.props.item.colorScaleMaximum = max;
  },

  changeRangeMin(event) {
    this.setState({
      minRange: event.target.value
    });
  },

  changeRangeMax(event) {
    this.setState({
      maxRange: event.target.value
    });
  },

  render() {
    const item = this.props.item;
    if (!defined(item.colorScaleMinimum) || !defined(item.colorScaleMaximum)) {
      return null;
    }
    const { t } = this.props;
    return (
      <form className={Styles.colorscalerange} onSubmit={this.updateRange}>
        <div className={Styles.title}>{t("workbench.colorScaleRange")} </div>
        <label htmlFor="rangeMax">{t("workbench.rangeMax")} </label>
        <input
          className={Styles.field}
          type="text"
          name="rangeMax"
          value={this.state.maxRange}
          onChange={this.changeRangeMax}
        />
        <label htmlFor="rangeMin">{t("workbench.rangeMin")} </label>
        <input
          className={Styles.field}
          type="text"
          name="rangeMin"
          value={this.state.minRange}
          onChange={this.changeRangeMin}
        />
        <button
          type="submit"
          title={t("workbench.colorScaleUpdateRange")}
          className={Styles.btn}
        >
          {t("workbench.colorScaleUpdateRange")}
        </button>
      </form>
    );
  }
});
module.exports = withTranslation()(ColorScaleRangeSection);
