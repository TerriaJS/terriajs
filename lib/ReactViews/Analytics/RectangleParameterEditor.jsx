import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import defined from "terriajs-cesium/Source/Core/defined";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

import MapInteractionMode from "../../Models/MapInteractionMode";
import ObserveModelMixin from "../ObserveModelMixin";
import { withTranslation } from "react-i18next";

import Styles from "./parameter-editors.scss";

const RectangleParameterEditor = createReactClass({
  displayName: "RectangleParameterEditor",
  mixins: [ObserveModelMixin],

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      value: this.getValue()
    };
  },

  onTextChange(e) {
    this.setValue(e.target.value);
    this.setState({
      value: e.target.value
    });
  },

  getValue() {
    const rect = this.props.parameter.value;
    if (defined(rect)) {
      return (
        this.outputDegrees(Rectangle.southwest(rect).longitude) +
        "," +
        this.outputDegrees(Rectangle.southwest(rect).latitude) +
        " " +
        this.outputDegrees(Rectangle.northeast(rect).longitude) +
        "," +
        this.outputDegrees(Rectangle.northeast(rect).latitude)
      );
    } else {
      return "";
    }
  },

  outputDegrees(radian) {
    return CesiumMath.toDegrees(radian).toFixed(2);
  },

  setValue(value) {
    const coordPair = value.split(" ");
    const coords = [];
    for (let i = 0; i < coordPair.length; i++) {
      const coordinates = coordPair[i].split(",");
      if (coordinates.length >= 2) {
        coords.push(
          Cartographic.fromDegrees(
            parseFloat(coordinates[0]),
            parseFloat(coordinates[1])
          )
        );
      }
    }
    this.props.parameter.value = Rectangle.fromCartographicArray(coords);
  },

  selectRectangleOnMap() {
    const terria = this.props.previewed.terria;
    const that = this;
    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;
    const { t } = this.props;
    const pickPointMode = new MapInteractionMode({
      message: t("analytics.shiftToDrawRectangle"),
      drawRectangle: true,
      onCancel: function() {
        terria.mapInteractionModeStack.pop();
        terria.selectBox = false;
        that.props.viewState.openAddData();
      }
    });
    terria.selectBox = true;
    terria.mapInteractionModeStack.push(pickPointMode);

    knockout
      .getObservable(pickPointMode, "pickedFeatures")
      .subscribe(function(pickedFeatures) {
        if (pickedFeatures instanceof Rectangle) {
          that.props.parameter.value = pickedFeatures;
          terria.mapInteractionModeStack.pop();
          terria.selectBox = false;
          that.props.viewState.openAddData();
        }
      });

    that.props.viewState.explorerPanelIsVisible = false;
  },

  render() {
    const { t } = this.props;
    return (
      <div>
        <input
          className={Styles.field}
          type="text"
          onChange={this.onTextChange}
          value={this.state.value}
        />
        <button
          type="button"
          onClick={this.selectRectangleOnMap}
          className={Styles.btnSelector}
        >
          {t("analytics.clickToDrawRectangle")}
        </button>
      </div>
    );
  }
});

module.exports = withTranslation()(RectangleParameterEditor);
