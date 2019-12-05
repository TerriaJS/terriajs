"use strict";
const React = require("react");
const PropTypes = require("prop-types");
import createReactClass from "create-react-class";
const CameraFlightPath = require("terriajs-cesium/Source/Scene/CameraFlightPath")
  .default;
const Cartesian2 = require("terriajs-cesium/Source/Core/Cartesian2").default;
const Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
const CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
const defined = require("terriajs-cesium/Source/Core/defined").default;
const Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
const getTimestamp = require("terriajs-cesium/Source/Core/getTimestamp")
  .default;
const Matrix4 = require("terriajs-cesium/Source/Core/Matrix4").default;
const Ray = require("terriajs-cesium/Source/Core/Ray").default;
const Transforms = require("terriajs-cesium/Source/Core/Transforms").default;
import { withTranslation } from "react-i18next";
import Icon from "../../Icon.jsx";
import Styles from "./compass.scss";

// the compass on map
const Compass = createReactClass({
  propTypes: {
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      orbitCursorAngle: 0,
      heading: 0.0,
      orbitCursorOpacity: 0
    };
  },

  componentDidMount() {
    this._unsubscribeFromViewerChange = this.props.terria.afterViewerChanged.addEventListener(
      () => viewerChange(this)
    );
    viewerChange(this);
  },

  componentWillUnmount() {
    document.removeEventListener(
      "mousemove",
      this.orbitMouseMoveFunction,
      false
    );
    document.removeEventListener("mouseup", this.orbitMouseUpFunction, false);
    this._unsubscribeFromClockTick && this._unsubscribeFromClockTick();
    this._unsubscribeFromPostRender && this._unsubscribeFromPostRender();
    this._unsubscribeFromViewerChange && this._unsubscribeFromViewerChange();
  },

  handleMouseDown(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();

    const compassElement = e.currentTarget;
    const compassRectangle = e.currentTarget.getBoundingClientRect();
    const maxDistance = compassRectangle.width / 2.0;
    const center = new Cartesian2(
      (compassRectangle.right - compassRectangle.left) / 2.0,
      (compassRectangle.bottom - compassRectangle.top) / 2.0
    );
    const clickLocation = new Cartesian2(
      e.clientX - compassRectangle.left,
      e.clientY - compassRectangle.top
    );
    const vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
    const distanceFromCenter = Cartesian2.magnitude(vector);

    const distanceFraction = distanceFromCenter / maxDistance;

    const nominalTotalRadius = 145;
    const norminalGyroRadius = 50;

    if (distanceFraction < norminalGyroRadius / nominalTotalRadius) {
      orbit(this, compassElement, vector);
    } else if (distanceFraction < 1.0) {
      rotate(this, compassElement, vector);
    } else {
      return true;
    }
  },

  handleDoubleClick(e) {
    const scene = this.props.terria.cesium.scene;
    const camera = scene.camera;

    const windowPosition = windowPositionScratch;
    windowPosition.x = scene.canvas.clientWidth / 2;
    windowPosition.y = scene.canvas.clientHeight / 2;
    const ray = camera.getPickRay(windowPosition, pickRayScratch);

    const center = scene.globe.pick(ray, scene, centerScratch);
    if (!defined(center)) {
      // Globe is barely visible, so reset to home view.
      this.props.terria.currentViewer.zoomTo(this.props.terria.homeView, 1.5);
      return;
    }

    const rotateFrame = Transforms.eastNorthUpToFixedFrame(
      center,
      Ellipsoid.WGS84
    );

    const lookVector = Cartesian3.subtract(
      center,
      camera.position,
      new Cartesian3()
    );

    const flight = CameraFlightPath.createTween(scene, {
      destination: Matrix4.multiplyByPoint(
        rotateFrame,
        new Cartesian3(0.0, 0.0, Cartesian3.magnitude(lookVector)),
        new Cartesian3()
      ),
      direction: Matrix4.multiplyByPointAsVector(
        rotateFrame,
        new Cartesian3(0.0, 0.0, -1.0),
        new Cartesian3()
      ),
      up: Matrix4.multiplyByPointAsVector(
        rotateFrame,
        new Cartesian3(0.0, 1.0, 0.0),
        new Cartesian3()
      ),
      duration: 1.5
    });
    scene.tweens.add(flight);
  },

  resetRotater() {
    this.setState({
      orbitCursorOpacity: 0,
      orbitCursorAngle: 0
    });
  },

  render() {
    const rotationMarkerStyle = {
      transform: "rotate(-" + this.state.orbitCursorAngle + "rad)",
      WebkitTransform: "rotate(-" + this.state.orbitCursorAngle + "rad)",
      opacity: this.state.orbitCursorOpacity
    };

    const outerCircleStyle = {
      transform: "rotate(-" + this.state.heading + "rad)",
      WebkitTransform: "rotate(-" + this.state.heading + "rad)",
      opacity: ""
    };
    const { t } = this.props;
    const description = t("compass.description");

    return (
      <div
        className={Styles.compass}
        title={description}
        onMouseDown={this.handleMouseDown}
        onDoubleClick={this.handleDoubleClick}
        onMouseUp={this.resetRotater}
      >
        <div className={Styles.outerRing} style={outerCircleStyle}>
          <Icon glyph={Icon.GLYPHS.compassOuter} />
        </div>
        <div className={Styles.innerRing} title={t("compass.title")}>
          <Icon glyph={Icon.GLYPHS.compassInner} />
        </div>
        <div className={Styles.rotationMarker} style={rotationMarkerStyle}>
          <Icon glyph={Icon.GLYPHS.compassRotationMarker} />
        </div>
      </div>
    );
  }
});

const vectorScratch = new Cartesian2();
const oldTransformScratch = new Matrix4();
const newTransformScratch = new Matrix4();
const centerScratch = new Cartesian3();
const windowPositionScratch = new Cartesian2();
const pickRayScratch = new Ray();

function rotate(viewModel, compassElement, cursorVector) {
  // Remove existing event handlers, if any.
  document.removeEventListener(
    "mousemove",
    viewModel.rotateMouseMoveFunction,
    false
  );
  document.removeEventListener(
    "mouseup",
    viewModel.rotateMouseUpFunction,
    false
  );

  viewModel.rotateMouseMoveFunction = undefined;
  viewModel.rotateMouseUpFunction = undefined;

  viewModel.isRotating = true;
  viewModel.rotateInitialCursorAngle = Math.atan2(
    -cursorVector.y,
    cursorVector.x
  );

  const scene = viewModel.props.terria.cesium.scene;
  let camera = scene.camera;
  const windowPosition = windowPositionScratch;
  windowPosition.x = scene.canvas.clientWidth / 2;
  windowPosition.y = scene.canvas.clientHeight / 2;
  const ray = camera.getPickRay(windowPosition, pickRayScratch);

  const viewCenter = scene.globe.pick(ray, scene, centerScratch);
  if (!defined(viewCenter)) {
    viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(
      camera.positionWC,
      Ellipsoid.WGS84,
      newTransformScratch
    );
    viewModel.rotateIsLook = true;
  } else {
    viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(
      viewCenter,
      Ellipsoid.WGS84,
      newTransformScratch
    );
    viewModel.rotateIsLook = false;
  }

  let oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
  camera.lookAtTransform(viewModel.rotateFrame);
  viewModel.rotateInitialCameraAngle = Math.atan2(
    camera.position.y,
    camera.position.x
  );
  viewModel.rotateInitialCameraDistance = Cartesian3.magnitude(
    new Cartesian3(camera.position.x, camera.position.y, 0.0)
  );
  camera.lookAtTransform(oldTransform);

  viewModel.rotateMouseMoveFunction = function(e) {
    const compassRectangle = compassElement.getBoundingClientRect();
    const center = new Cartesian2(
      (compassRectangle.right - compassRectangle.left) / 2.0,
      (compassRectangle.bottom - compassRectangle.top) / 2.0
    );
    const clickLocation = new Cartesian2(
      e.clientX - compassRectangle.left,
      e.clientY - compassRectangle.top
    );
    const vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
    const angle = Math.atan2(-vector.y, vector.x);

    const angleDifference = angle - viewModel.rotateInitialCursorAngle;
    const newCameraAngle = CesiumMath.zeroToTwoPi(
      viewModel.rotateInitialCameraAngle - angleDifference
    );

    camera = viewModel.props.terria.cesium.scene.camera;

    oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
    camera.lookAtTransform(viewModel.rotateFrame);
    const currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
    camera.rotateRight(newCameraAngle - currentCameraAngle);
    camera.lookAtTransform(oldTransform);

    viewModel.props.terria.cesium.notifyRepaintRequired();
  };

  viewModel.rotateMouseUpFunction = function(e) {
    viewModel.isRotating = false;
    document.removeEventListener(
      "mousemove",
      viewModel.rotateMouseMoveFunction,
      false
    );
    document.removeEventListener(
      "mouseup",
      viewModel.rotateMouseUpFunction,
      false
    );

    viewModel.rotateMouseMoveFunction = undefined;
    viewModel.rotateMouseUpFunction = undefined;
  };

  document.addEventListener(
    "mousemove",
    viewModel.rotateMouseMoveFunction,
    false
  );
  document.addEventListener("mouseup", viewModel.rotateMouseUpFunction, false);
}

function orbit(viewModel, compassElement, cursorVector) {
  // Remove existing event handlers, if any.
  document.removeEventListener(
    "mousemove",
    viewModel.orbitMouseMoveFunction,
    false
  );
  document.removeEventListener(
    "mouseup",
    viewModel.orbitMouseUpFunction,
    false
  );

  if (defined(viewModel.orbitTickFunction)) {
    viewModel.props.terria.clock.onTick.removeEventListener(
      viewModel.orbitTickFunction
    );
  }

  viewModel.orbitMouseMoveFunction = undefined;
  viewModel.orbitMouseUpFunction = undefined;
  viewModel.orbitTickFunction = undefined;

  viewModel.isOrbiting = true;
  viewModel.orbitLastTimestamp = getTimestamp();

  let scene = viewModel.props.terria.cesium.scene;
  let camera = scene.camera;

  const windowPosition = windowPositionScratch;
  windowPosition.x = scene.canvas.clientWidth / 2;
  windowPosition.y = scene.canvas.clientHeight / 2;
  const ray = camera.getPickRay(windowPosition, pickRayScratch);

  let center = scene.globe.pick(ray, scene, centerScratch);
  if (!defined(center)) {
    viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(
      camera.positionWC,
      Ellipsoid.WGS84,
      newTransformScratch
    );
    viewModel.orbitIsLook = true;
  } else {
    viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(
      center,
      Ellipsoid.WGS84,
      newTransformScratch
    );
    viewModel.orbitIsLook = false;
  }

  viewModel.orbitTickFunction = function(e) {
    const timestamp = getTimestamp();
    const deltaT = timestamp - viewModel.orbitLastTimestamp;
    const rate = ((viewModel.state.orbitCursorOpacity - 0.5) * 2.5) / 1000;
    const distance = deltaT * rate;

    const angle = viewModel.state.orbitCursorAngle + CesiumMath.PI_OVER_TWO;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    scene = viewModel.props.terria.cesium.scene;
    camera = scene.camera;

    const oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);

    camera.lookAtTransform(viewModel.orbitFrame);

    if (viewModel.orbitIsLook) {
      camera.look(Cartesian3.UNIT_Z, -x);
      camera.look(camera.right, -y);
    } else {
      camera.rotateLeft(x);
      camera.rotateUp(y);
    }

    camera.lookAtTransform(oldTransform);

    viewModel.props.terria.cesium.notifyRepaintRequired();

    viewModel.orbitLastTimestamp = timestamp;
  };

  function updateAngleAndOpacity(vector, compassWidth) {
    const angle = Math.atan2(-vector.y, vector.x);
    viewModel.setState({
      orbitCursorAngle: CesiumMath.zeroToTwoPi(angle - CesiumMath.PI_OVER_TWO)
    });

    const distance = Cartesian2.magnitude(vector);
    const maxDistance = compassWidth / 2.0;
    const distanceFraction = Math.min(distance / maxDistance, 1.0);
    const easedOpacity = 0.5 * distanceFraction * distanceFraction + 0.5;
    viewModel.setState({
      orbitCursorOpacity: easedOpacity
    });

    viewModel.props.terria.cesium.notifyRepaintRequired();
  }

  viewModel.orbitMouseMoveFunction = function(e) {
    const compassRectangle = compassElement.getBoundingClientRect();
    center = new Cartesian2(
      (compassRectangle.right - compassRectangle.left) / 2.0,
      (compassRectangle.bottom - compassRectangle.top) / 2.0
    );
    const clickLocation = new Cartesian2(
      e.clientX - compassRectangle.left,
      e.clientY - compassRectangle.top
    );
    const vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
    updateAngleAndOpacity(vector, compassRectangle.width);
  };

  viewModel.orbitMouseUpFunction = function(e) {
    // TODO: if mouse didn't move, reset view to looking down, north is up?

    viewModel.isOrbiting = false;
    document.removeEventListener(
      "mousemove",
      viewModel.orbitMouseMoveFunction,
      false
    );
    document.removeEventListener(
      "mouseup",
      viewModel.orbitMouseUpFunction,
      false
    );

    if (defined(viewModel.orbitTickFunction)) {
      viewModel.props.terria.clock.onTick.removeEventListener(
        viewModel.orbitTickFunction
      );
    }

    viewModel.orbitMouseMoveFunction = undefined;
    viewModel.orbitMouseUpFunction = undefined;
    viewModel.orbitTickFunction = undefined;
  };

  document.addEventListener(
    "mousemove",
    viewModel.orbitMouseMoveFunction,
    false
  );
  document.addEventListener("mouseup", viewModel.orbitMouseUpFunction, false);
  viewModel._unsubscribeFromClockTick = viewModel.props.terria.clock.onTick.addEventListener(
    viewModel.orbitTickFunction
  );

  updateAngleAndOpacity(
    cursorVector,
    compassElement.getBoundingClientRect().width
  );
}

function viewerChange(viewModel) {
  if (defined(viewModel.props.terria.cesium)) {
    if (viewModel._unsubscribeFromPostRender) {
      viewModel._unsubscribeFromPostRender();
      viewModel._unsubscribeFromPostRender = undefined;
    }

    viewModel._unsubscribeFromPostRender = viewModel.props.terria.cesium.scene.postRender.addEventListener(
      function() {
        viewModel.setState({
          heading: viewModel.props.terria.cesium.scene.camera.heading
        });
      }
    );
  } else {
    if (viewModel._unsubscribeFromPostRender) {
      viewModel._unsubscribeFromPostRender();
      viewModel._unsubscribeFromPostRender = undefined;
    }
    viewModel.showCompass = false;
  }
}

module.exports = withTranslation()(Compass);
