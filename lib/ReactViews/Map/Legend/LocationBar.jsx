"use strict";
import classNames from "classnames";
import ObserveModelMixin from "../../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Styles from "./legend.scss";

const LocationBar = createReactClass({
  displayName: "LocationBar",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object,
    showUtmZone: PropTypes.bool,
    mouseCoords: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      showUtmZone: true
    };
  },

  toggleUseProjection() {
    this.props.mouseCoords.toggleUseProjection();
  },

  render() {
    const { t } = this.props;
    return (
      <button
        type="button"
        className={classNames(Styles.locationBar, {
          [Styles.useProjection]: this.props.mouseCoords.useProjection
        })}
        onClick={this.toggleUseProjection}
      >
        <Choose>
          <When condition={!this.props.mouseCoords.useProjection}>
            <div className={Styles.section}>
              <span>{t("legend.lat")}</span>
              <span>{this.props.mouseCoords.latitude}</span>
            </div>
            <div className={Styles.section}>
              <span>{t("legend.lon")}</span>
              <span>{this.props.mouseCoords.longitude}</span>
            </div>
          </When>
          <Otherwise>
            <div className={Styles.sectionShort}>
              <span>{t("legend.zone")}</span>
              <span>{this.props.mouseCoords.utmZone}</span>
            </div>
            <div className={Styles.section}>
              <span>{t("legend.e")}</span>
              <span>{this.props.mouseCoords.east}</span>
            </div>
            <div className={Styles.section}>
              <span>{t("legend.n")}</span>
              <span>{this.props.mouseCoords.north}</span>
            </div>
          </Otherwise>
        </Choose>
        <div className={Styles.sectionLong}>
          <span>{t("legend.elev")}</span>
          <span>{this.props.mouseCoords.elevation}</span>
        </div>
      </button>
    );
  }
});

module.exports = withTranslation()(LocationBar);
