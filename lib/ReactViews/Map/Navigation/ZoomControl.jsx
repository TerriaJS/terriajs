"use strict";
const React = require("react");
const PropTypes = require("prop-types");
import createReactClass from "create-react-class";
const defined = require("terriajs-cesium/Source/Core/defined").default;
const Ray = require("terriajs-cesium/Source/Core/Ray").default;
const IntersectionTests = require("terriajs-cesium/Source/Core/IntersectionTests")
  .default;
const Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
const Tween = require("terriajs-cesium/Source/ThirdParty/Tween").default;
const CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
const Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
import Icon from "../../Icon.jsx";
import Styles from "./zoom_control.scss";
import { withTranslation } from "react-i18next";

// Map zoom control
const ZoomControl = createReactClass({
  propTypes: {
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  flyToPosition(scene, position, durationMilliseconds) {
    const camera = scene.camera;
    const startPosition = camera.position;
    const endPosition = position;

    // temp
    durationMilliseconds = 200;

    const controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    scene.tweens.add({
      duration: durationMilliseconds / 1000.0,
      easingFunction: Tween.Easing.Sinusoidal.InOut,
      startObject: {
        time: 0.0
      },
      stopObject: {
        time: 1.0
      },
      update(value) {
        if (scene.isDestroyed()) {
          return;
        }
        scene.camera.position.x = CesiumMath.lerp(
          startPosition.x,
          endPosition.x,
          value.time
        );
        scene.camera.position.y = CesiumMath.lerp(
          startPosition.y,
          endPosition.y,
          value.time
        );
        scene.camera.position.z = CesiumMath.lerp(
          startPosition.z,
          endPosition.z,
          value.time
        );
      },
      complete() {
        if (controller.isDestroyed()) {
          return;
        }
        controller.enableInputs = true;
      },
      cancel() {
        if (controller.isDestroyed()) {
          return;
        }
        controller.enableInputs = true;
      }
    });
  },

  getCameraFocus(scene) {
    const ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);
    const intersections = IntersectionTests.rayEllipsoid(ray, Ellipsoid.WGS84);
    if (defined(intersections)) {
      return Ray.getPoint(ray, intersections.start);
    }
    // Camera direction is not pointing at the globe, so use the ellipsoid horizon point as
    // the focal point.
    return IntersectionTests.grazingAltitudeLocation(ray, Ellipsoid.WGS84);
  },

  zoomIn() {
    const cartesian3Scratch = new Cartesian3();
    this.props.terria.analytics.logEvent("navigation", "click", "zoomIn");

    if (defined(this.props.terria.leaflet)) {
      this.props.terria.leaflet.map.zoomIn(1);
    }

    if (defined(this.props.terria.cesium)) {
      const scene = this.props.terria.cesium.scene;
      const camera = scene.camera;
      const focus = this.getCameraFocus(scene);
      const direction = Cartesian3.subtract(
        focus,
        camera.position,
        cartesian3Scratch
      );
      const movementVector = Cartesian3.multiplyByScalar(
        direction,
        2.0 / 3.0,
        cartesian3Scratch
      );
      const endPosition = Cartesian3.add(
        camera.position,
        movementVector,
        cartesian3Scratch
      );
      this.flyToPosition(scene, endPosition);
    }

    this.props.terria.currentViewer.notifyRepaintRequired();
  },

  zoomOut() {
    const cartesian3Scratch = new Cartesian3();
    this.props.terria.analytics.logEvent("navigation", "click", "zoomOut");

    if (defined(this.props.terria.leaflet)) {
      this.props.terria.leaflet.map.zoomOut(1);
    }

    if (defined(this.props.terria.cesium)) {
      const scene = this.props.terria.cesium.scene;
      const camera = scene.camera;
      const focus = this.getCameraFocus(scene);
      const direction = Cartesian3.subtract(
        focus,
        camera.position,
        cartesian3Scratch
      );
      const movementVector = Cartesian3.multiplyByScalar(
        direction,
        -2.0,
        cartesian3Scratch
      );
      const endPosition = Cartesian3.add(
        camera.position,
        movementVector,
        cartesian3Scratch
      );
      this.flyToPosition(scene, endPosition);
    }
    this.props.terria.currentViewer.notifyRepaintRequired();
  },

  zoomReset() {
    this.props.terria.analytics.logEvent("navigation", "click", "reset");
    this.props.terria.currentViewer.zoomTo(this.props.terria.homeView, 1.5);
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.zoomControl}>
        <ul className={Styles.list}>
          <li>
            <button
              type="button"
              onClick={this.zoomIn}
              className={Styles.increase}
              title={t("zoomCotrol.zoomIn")}
            >
              <Icon glyph={Icon.GLYPHS.increase} />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={this.zoomReset}
              className={Styles.refresh}
              title={t("zoomCotrol.zoomReset")}
            >
              <Icon glyph={Icon.GLYPHS.refresh} />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={this.zoomOut}
              className={Styles.decrease}
              title={t("zoomCotrol.zoomOut")}
            >
              <Icon glyph={Icon.GLYPHS.decrease} />
            </button>
          </li>
        </ul>
      </div>
    );
  }
});
module.exports = withTranslation()(ZoomControl);
