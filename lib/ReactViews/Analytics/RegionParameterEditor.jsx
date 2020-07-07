"use strict";

import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import Styles from "./parameter-editors.scss";
import RegionPicker from "./RegionPicker";
import MapInteractionMode from "../../Models/MapInteractionMode";
import i18next from "i18next";

const RegionParameterEditor = createReactClass({
  displayName: "RegionParameterEditor",

  propTypes: {
    previewed: PropTypes.object,
    viewState: PropTypes.object,
    parameter: PropTypes.object
  },

  selectRegionOnMap() {
    RegionParameterEditor.selectOnMap(
      this.props.viewState,
      this.props.parameter,
      this.props.previewed
    );
  },

  render() {
    return (
      <div>
        <input
          className={Styles.field}
          type="text"
          readOnly
          value={RegionPicker.getDisplayValue(
            this.props.parameter.value,
            this.props.parameter
          )}
        />
        <button
          type="button"
          onClick={this.selectRegionOnMap}
          className={Styles.btnSelector}
        >
          {i18next.t("analytics.selectRegion")}
        </button>
      </div>
    );
  }
});

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param {Object} viewState ViewState.
 * @param {FunctionParameter} parameter Parameter.
 * @param {Object} previewed Previewed.
 */
RegionParameterEditor.selectOnMap = function(viewState, parameter, previewed) {
  const terria = previewed.terria;
  // Cancel any feature picking already in progress.
  terria.pickedFeatures = undefined;

  const pickPointMode = new MapInteractionMode({
    message: i18next.t("analytics.selectRegionMessage"),
    onCancel: function() {
      terria.mapInteractionModeStack.pop();
      viewState.openAddData();
    },
    buttonText: i18next.t("analytics.selectRegionDone"),
    customUi: function Done() {
      return (
        <RegionPicker
          className={Styles.parameterEditor}
          previewed={previewed}
          parameter={parameter}
        />
      );
    }
  });
  terria.mapInteractionModeStack.push(pickPointMode);
  viewState.explorerPanelIsVisible = false;
};

module.exports = RegionParameterEditor;
