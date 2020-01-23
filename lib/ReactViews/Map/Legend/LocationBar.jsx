"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import Styles from "./legend.scss";

const LocationBar = observer(
  createReactClass({
    displayName: "LocationBar",

    propTypes: {
      terria: PropTypes.object,
      showUtmZone: PropTypes.bool,
      mouseCoords: PropTypes.object.isRequired
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
                <span>Lat</span>
                <span>{this.props.mouseCoords.latitude}</span>
              </div>
              <div className={Styles.section}>
                <span>Lon</span>
                <span>{this.props.mouseCoords.longitude}</span>
              </div>
            </When>
            <Otherwise>
              <div className={Styles.sectionShort}>
                <span>ZONE</span>
                <span>{this.props.mouseCoords.utmZone}</span>
              </div>
              <div className={Styles.section}>
                <span>E</span>
                <span>{this.props.mouseCoords.east}</span>
              </div>
              <div className={Styles.section}>
                <span>N</span>
                <span>{this.props.mouseCoords.north}</span>
              </div>
            </Otherwise>
          </Choose>
          <div className={Styles.sectionLong}>
            <span>Elev</span>
            <span>{this.props.mouseCoords.elevation}</span>
          </div>
        </button>
      );
    }
  })
);

module.exports = LocationBar;
