"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import URI from "urijs";

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";

import GeoJsonCatalogItem from "../../../Models/GeoJsonCatalogItem";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./tool_button.scss";
import TerriaError from "../../../Core/TerriaError";
import CesiumCartographic from "terriajs-cesium/Source/Core/Cartographic.js";
import Icon from "../../Icon.jsx";
import defined from "terriajs-cesium/Source/Core/defined";
import { withTranslation } from "react-i18next";

const MyLocation = createReactClass({
  displayName: "MyLocation",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  _marker: undefined,

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this._marker = new GeoJsonCatalogItem(this.props.terria);
  },

  getInitialState() {
    return {};
  },

  getLocation() {
    const { t } = this.props;
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
      if (!this.augmentedVirtualityEnabled()) {
        // When Augmented Virtuality is not enabled then just get a single position update.
        navigator.geolocation.getCurrentPosition(
          this.zoomToMyLocation,
          this.handleLocationError,
          options
        );
      } else {
        // When Augmented Virtuality is enabled then we effectively toggle into watch mode and the position is repeatedly updated.
        const watchId = navigator.geolocation.watchPosition(
          this.zoomToMyLocation,
          this.handleLocationError,
          options
        );

        this.setState({ watchId: watchId });
      }
    } else {
      this.props.terria.error.raiseEvent(
        new TerriaError({
          sender: this,
          title: t("location.errorGettingLocation"),
          message: t("location.browserCannotProvide")
        })
      );
    }
  },

  zoomToMyLocation(position) {
    const { t } = this.props;
    const longitude = position.coords.longitude;
    const latitude = position.coords.latitude;

    if (this.augmentedVirtualityEnabled()) {
      // Note: Specifiying the value of 27500m here enables this function to approximately mimic the behaviour of
      //       the else case from the cameras inital view and when the viewer pan/zooms out to much.
      // We use the flag variable flown so that the user is flown to the current location when this function is
      // first fired, but subsuquently the updates are jump location moves, since we assume that the movements are
      // small and flyTo performs badly when the increments are small (slow and unresponsive).
      this.props.terria.augmentedVirtuality.moveTo(
        CesiumCartographic.fromDegrees(longitude, latitude),
        27500,
        !defined(this.state.flown)
      );
      this.setState({ flown: true });
    } else {
      // west, south, east, north, result
      const rectangle = Rectangle.fromDegrees(
        longitude - 0.1,
        latitude - 0.1,
        longitude + 0.1,
        latitude + 0.1
      );
      this.props.terria.currentViewer.zoomTo(rectangle);
    }

    this._marker.name = t("location.myLocation");
    this._marker.data = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      properties: {
        title: t("location.location"),
        longitude: longitude,
        latitude: latitude
      }
    };
    this._marker.style = {
      "marker-size": 25,
      "marker-color": "#08ABD5",
      stroke: "#ffffff",
      "stroke-width": 3
    };

    this._marker.load();
    if (this._marker.isEnabled !== true) {
      this._marker.isEnabled = true;
    }
  },

  handleLocationError(err) {
    const { t } = this.props;
    let message = err.message;
    if (message && message.indexOf("Only secure origins are allowed") === 0) {
      // This is actually the recommended way to check for this error.
      // https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only
      const uri = new URI(window.location);
      const secureUrl = uri.protocol("https").toString();
      message = t("location.originError", { secureUrl: secureUrl });
    }
    this.props.terria.error.raiseEvent(
      new TerriaError({
        sender: this,
        title: t("location.errorGettingLocation"),
        message: message
      })
    );
  },

  augmentedVirtualityEnabled() {
    return (
      defined(this.props.terria.augmentedVirtuality) &&
      this.props.terria.augmentedVirtuality.enabled
    );
  },

  followMeEnabled() {
    if (defined(this.state.watchId)) {
      return true;
    }

    return false;
  },

  disableFollowMe() {
    if (defined(this.state.watchId)) {
      navigator.geolocation.clearWatch(this.state.watchId);
      this.setState({ watchId: undefined });
      this.setState({ flown: undefined });
    }
  },

  handleCick() {
    if (this.followMeEnabled()) {
      this.disableFollowMe();
    } else {
      this.getLocation();
    }
  },

  render() {
    let toggleStyle = Styles.btn;
    if (this.followMeEnabled()) {
      toggleStyle = Styles.btnPrimary;
    }
    const { t } = this.props;
    return (
      <div className={Styles.toolButton}>
        <button
          type="button"
          className={toggleStyle}
          title={t("location.centreMap")}
          onClick={this.handleCick}
        >
          <Icon glyph={Icon.GLYPHS.geolocation} />
        </button>
      </div>
    );
  }
});

export default withTranslation()(MyLocation);
