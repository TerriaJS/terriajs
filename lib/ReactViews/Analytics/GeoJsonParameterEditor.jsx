"use strict";

import React from "react";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./parameter-editors.scss";
import PointParameterEditor from "./PointParameterEditor";
import PolygonParameterEditor from "./PolygonParameterEditor";
import SelectAPolygonParameterEditor from "./SelectAPolygonParameterEditor";
import RegionPicker from "./RegionPicker";
import createReactClass from "create-react-class";
import GeoJsonParameter from "../../Models/GeoJsonParameter";
import { withTranslation } from "react-i18next";

const GeoJsonParameterEditor = createReactClass({
  mixins: [ObserveModelMixin],

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  onCleanUp() {
    this.props.viewState.openAddData();
  },

  selectPointOnMap() {
    this.props.parameter.value = undefined;
    PointParameterEditor.selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter
    );
    this.props.parameter.subtype = GeoJsonParameter.PointType;
  },

  selectPolygonOnMap() {
    this.props.parameter.value = undefined;
    PolygonParameterEditor.selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter
    );
    this.props.parameter.subtype = GeoJsonParameter.PolygonType;
  },

  selectExistingPolygonOnMap() {
    this.props.parameter.value = undefined;
    SelectAPolygonParameterEditor.selectOnMap(
      this.props.previewed.terria,
      this.props.viewState,
      this.props.parameter
    );
    this.props.parameter.subtype = GeoJsonParameter.SelectAPolygonType;
  },

  render() {
    const { t } = this.props;
    return (
      <div>
        <div>
          <strong>{t("analytics.selectLocation")}</strong>
        </div>
        <div
          className="container"
          style={{
            marginTop: "10px",
            marginBottom: "10px",
            display: "table",
            width: "100%"
          }}
        >
          <button
            type="button"
            onClick={this.selectPointOnMap}
            className={Styles.btnLocationSelector}
          >
            <strong>{t("analytics.point")}</strong>
          </button>
          <button
            type="button"
            style={{ marginLeft: "2%", marginRight: "2%" }}
            onClick={this.selectPolygonOnMap}
            className={Styles.btnLocationSelector}
          >
            <strong>{t("analytics.polygon")}</strong>
          </button>
          <button
            type="button"
            onClick={this.selectExistingPolygonOnMap}
            className={Styles.btnLocationSelector}
          >
            <strong>{t("analytics.existingPolygon")}</strong>
          </button>
        </div>
        <input
          className={Styles.field}
          type="text"
          readOnly
          value={GeoJsonParameterEditor.getDisplayValue(
            this.props.parameter.value,
            this.props.parameter
          )}
        />
        <If
          condition={
            GeoJsonParameterEditor.getDisplayValue(
              this.props.parameter.value,
              this.props.parameter
            ) === ""
          }
        >
          <div>{t("analytics.nothingSelected")}</div>
        </If>
      </div>
    );
  }
});

GeoJsonParameterEditor.getDisplayValue = function(value, parameter) {
  if (!defined(parameter.subtype)) {
    return "";
  }
  if (parameter.subtype === GeoJsonParameter.PointType) {
    return PointParameterEditor.getDisplayValue(value);
  }
  if (parameter.subtype === GeoJsonParameter.SelectAPolygonType) {
    return SelectAPolygonParameterEditor.getDisplayValue(value);
  }
  if (parameter.subtype === GeoJsonParameter.PolygonType) {
    return PolygonParameterEditor.getDisplayValue(value);
  }
  return RegionPicker.getDisplayValue(value, parameter);
};

module.exports = withTranslation()(GeoJsonParameterEditor);
