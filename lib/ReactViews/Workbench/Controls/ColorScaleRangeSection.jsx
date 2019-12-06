"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../../ObserveModelMixin";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./colorscalerange-section.scss";

const ColorScaleRangeSection = createReactClass({
  displayName: "ColorScaleRangeSection",
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired,
    minValue: PropTypes.number,
    maxValue: PropTypes.number
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

    const min = parseFloat(this.state.minRange);
    if (min !== min) {
      // is NaN?
      this.props.item.terria.error.raiseEvent({
        sender: this.props.item,
        title: "Invalid color scale range",
        message: "The minimum value must be a number."
      });
      return;
    }

    const max = parseFloat(this.state.maxRange);
    if (max !== max) {
      // is NaN?
      this.props.item.terria.error.raiseEvent({
        sender: this.props.item,
        title: "Invalid color scale range",
        message: "The maximum value must be a number."
      });
      return;
    }

    if (max <= min) {
      this.props.item.terria.error.raiseEvent({
        sender: this.props.item,
        title: "Invalid color scale range",
        message:
          "The minimum value of the color scale range must be less than the maximum value."
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
    return (
      <form className={Styles.colorscalerange} onSubmit={this.updateRange}>
        <div className={Styles.title}>Color Scale Range </div>
        <label htmlFor="rangeMax">Maximum: </label>
        <input
          className={Styles.field}
          type="text"
          name="rangeMax"
          value={this.state.maxRange}
          onChange={this.changeRangeMax}
        />
        <label htmlFor="rangeMin">Minimum: </label>
        <input
          className={Styles.field}
          type="text"
          name="rangeMin"
          value={this.state.minRange}
          onChange={this.changeRangeMin}
        />
        <button type="submit" title="Update Range" className={Styles.btn}>
          Update Range
        </button>
      </form>
    );
  }
});
module.exports = ColorScaleRangeSection;
