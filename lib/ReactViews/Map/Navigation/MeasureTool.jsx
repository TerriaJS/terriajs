"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./tool_button.scss";
import Icon from "../../Icon.jsx";
import { withTranslation } from "react-i18next";

const UserDrawing = require("../../../Models/UserDrawing");
const EllipsoidGeodesic = require("terriajs-cesium/Source/Core/EllipsoidGeodesic.js")
  .default;
const Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid.js").default;
const EllipsoidTangentPlane = require("terriajs-cesium/Source/Core/EllipsoidTangentPlane.js")
  .default;
const CesiumMath = require("terriajs-cesium/Source/Core/Math.js").default;
const PolygonGeometryLibrary = require("terriajs-cesium/Source/Core/PolygonGeometryLibrary.js")
  .default;
const PolygonHierarchy = require("terriajs-cesium/Source/Core/PolygonHierarchy.js")
  .default;
const Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3.js").default;
const VertexFormat = require("terriajs-cesium/Source/Core/VertexFormat.js")
  .default;

export const MeasureTool = createReactClass({
  displayName: "MeasureTool",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    const { t } = this.props;
    return {
      totalDistanceMetres: 0,
      totalAreaMetresSquared: 0,
      userDrawing: new UserDrawing({
        terria: this.props.terria,
        messageHeader: t("measure.measureTool"),
        allowPolygon: false,
        onPointClicked: this.onPointClicked,
        onPointMoved: this.onPointMoved,
        onCleanUp: this.onCleanUp,
        onMakeDialogMessage: this.onMakeDialogMessage
      })
    };
  },

  prettifyNumber(number, squared) {
    if (number <= 0) {
      return "";
    }
    // Given a number representing a number in metres, make it human readable
    let label = "m";
    if (squared) {
      if (number > 999999) {
        label = "km";
        number = number / 1000000.0;
      }
    } else {
      if (number > 999) {
        label = "km";
        number = number / 1000.0;
      }
    }
    number = number.toFixed(2);
    // http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let numberStr = number + " " + label;
    if (squared) {
      numberStr += "\u00B2";
    }
    return numberStr;
  },

  updateDistance(pointEntities) {
    this.setState({ totalDistanceMetres: 0 });
    if (pointEntities.entities.values.length < 1) {
      return;
    }

    const prevPoint = pointEntities.entities.values[0];
    let prevPointPos = prevPoint.position.getValue(
      this.props.terria.clock.currentTime
    );
    for (let i = 1; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position.getValue(
        this.props.terria.clock.currentTime
      );

      this.setState({
        totalDistanceMetres:
          this.state.totalDistanceMetres +
          this.getGeodesicDistance(prevPointPos, currentPointPos)
      });

      prevPointPos = currentPointPos;
    }
    if (this.state.userDrawing.closeLoop) {
      const firstPoint = pointEntities.entities.values[0];
      const firstPointPos = firstPoint.position.getValue(
        this.props.terria.clock.currentTime
      );
      this.setState({
        totalDistanceMetres:
          this.state.totalDistanceMetres +
          this.getGeodesicDistance(prevPointPos, firstPointPos)
      });
    }
  },

  updateArea(pointEntities) {
    this.setState({ totalAreaMetresSquared: 0 });
    if (!this.state.userDrawing.closeLoop) {
      // Not a closed polygon? Don't calculate area.
      return;
    }
    if (pointEntities.entities.values.length < 3) {
      return;
    }
    const perPositionHeight = true;

    const positions = [];
    for (let i = 0; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position.getValue(
        this.props.terria.clock.currentTime
      );
      positions.push(currentPointPos);
    }

    // Request the triangles that make up the polygon from Cesium.
    const tangentPlane = EllipsoidTangentPlane.fromPoints(
      positions,
      Ellipsoid.WGS84
    );
    const polygons = PolygonGeometryLibrary.polygonsFromHierarchy(
      new PolygonHierarchy(positions),
      tangentPlane.projectPointsOntoPlane.bind(tangentPlane),
      !perPositionHeight,
      Ellipsoid.WGS84
    );

    const geom = PolygonGeometryLibrary.createGeometryFromPositions(
      Ellipsoid.WGS84,
      polygons.polygons[0],
      CesiumMath.RADIANS_PER_DEGREE,
      perPositionHeight,
      VertexFormat.POSITION_ONLY
    );

    if (
      geom.indices.length % 3 !== 0 ||
      geom.attributes.position.values.length % 3 !== 0
    ) {
      // Something has gone wrong. We expect triangles. Can't calcuate area.
      return;
    }

    const coords = [];
    for (let i = 0; i < geom.attributes.position.values.length; i += 3) {
      coords.push(
        new Cartesian3(
          geom.attributes.position.values[i],
          geom.attributes.position.values[i + 1],
          geom.attributes.position.values[i + 2]
        )
      );
    }
    let area = 0;
    for (let i = 0; i < geom.indices.length; i += 3) {
      const ind1 = geom.indices[i];
      const ind2 = geom.indices[i + 1];
      const ind3 = geom.indices[i + 2];

      const a = Cartesian3.distance(coords[ind1], coords[ind2]);
      const b = Cartesian3.distance(coords[ind2], coords[ind3]);
      const c = Cartesian3.distance(coords[ind3], coords[ind1]);

      // Heron's formula
      const s = (a + b + c) / 2.0;
      area += Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    this.setState({ totalAreaMetresSquared: area });
  },

  getGeodesicDistance(pointOne, pointTwo) {
    // Note that Cartesian.distance gives the straight line distance between the two points, ignoring
    // curvature. This is not what we want.
    const pickedPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(
      pointOne
    );
    const lastPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(
      pointTwo
    );
    const geodesic = new EllipsoidGeodesic(
      pickedPointCartographic,
      lastPointCartographic
    );
    return geodesic.surfaceDistance;
  },

  onCleanUp() {
    this.setState({ totalDistanceMetres: 0 });
    this.setState({ totalAreaMetresSquared: 0 });
  },

  onPointClicked(pointEntities) {
    this.updateDistance(pointEntities);
    this.updateArea(pointEntities);
  },

  onPointMoved(pointEntities) {
    // This is no different to clicking a point.
    this.onPointClicked(pointEntities);
  },

  onMakeDialogMessage() {
    const distance = this.prettifyNumber(this.state.totalDistanceMetres, false);
    let message = distance;
    if (this.state.totalAreaMetresSquared !== 0) {
      message +=
        "<br>" + this.prettifyNumber(this.state.totalAreaMetresSquared, true);
    }
    return message;
  },

  handleClick() {
    this.state.userDrawing.enterDrawMode();
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.toolButton}>
        <button
          type="button"
          className={Styles.btn}
          title={t("measure.measureDistance")}
          onClick={this.handleClick}
        >
          <Icon glyph={Icon.GLYPHS.measure} />
        </button>
      </div>
    );
  }
});
export default withTranslation()(MeasureTool);
