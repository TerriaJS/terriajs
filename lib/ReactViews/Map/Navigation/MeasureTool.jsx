"use strict";
import React from "react";
import PropTypes from "prop-types";
import Styles from "./tool_button.scss";
import Icon from "../../Icon";
import { observer } from "mobx-react";
import { observable, action } from "mobx";

import UserDrawing from "../../../Models/UserDrawing";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EllipsoidTangentPlane from "terriajs-cesium/Source/Core/EllipsoidTangentPlane";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import PolygonGeometryLibrary from "terriajs-cesium/Source/Core/PolygonGeometryLibrary";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import VertexFormat from "terriajs-cesium/Source/Core/VertexFormat";

@observer
class MeasureTool extends React.Component {
  @observable
  totalDistanceMetres = 0;

  @observable
  totalAreaMetresSquared = 0;

  @observable
  userDrawing;

  static displayName = "MeasureTool";

  static propTypes = {
    terria: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.userDrawing = new UserDrawing({
      terria: this.props.terria,
      messageHeader: "Measure Tool",
      allowPolygon: false,
      onPointClicked: this.onPointClicked,
      onPointMoved: this.onPointMoved,
      onCleanUp: this.onCleanUp,
      onMakeDialogMessage: this.onMakeDialogMessage
    });
  }

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
  }

  @action
  updateDistance(pointEntities) {
    this.totalDistanceMetres = 0;
    if (pointEntities.entities.values.length < 1) {
      return;
    }

    const prevPoint = pointEntities.entities.values[0];
    let prevPointPos = prevPoint.position.getValue(
      this.props.terria.timelineClock.currentTime
    );
    for (let i = 1; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position.getValue(
        this.props.terria.timelineClock.currentTime
      );

      this.totalDistanceMetres =
        this.totalDistanceMetres +
        this.getGeodesicDistance(prevPointPos, currentPointPos);

      prevPointPos = currentPointPos;
    }
    if (this.userDrawing.closeLoop) {
      const firstPoint = pointEntities.entities.values[0];
      const firstPointPos = firstPoint.position.getValue(
        this.props.terria.timelineClock.currentTime
      );
      this.totalDistanceMetres =
        this.totalDistanceMetres +
        this.getGeodesicDistance(prevPointPos, firstPointPos);
    }
  }

  @action
  updateArea(pointEntities) {
    this.totalAreaMetresSquared = 0;
    if (!this.userDrawing.closeLoop) {
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
        this.props.terria.timelineClock.currentTime
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
    this.totalAreaMetresSquared = area;
  }

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
  }

  @action.bound
  onCleanUp() {
    this.totalDistanceMetres = 0;
    this.totalAreaMetresSquared = 0;
  }

  @action.bound
  onPointClicked(pointEntities) {
    this.updateDistance(pointEntities);
    this.updateArea(pointEntities);
  }

  @action.bound
  onPointMoved(pointEntities) {
    // This is no different to clicking a point.
    this.onPointClicked(pointEntities);
  }

  onMakeDialogMessage = () => {
    const distance = this.prettifyNumber(this.totalDistanceMetres, false);
    let message = distance;
    if (this.totalAreaMetresSquared !== 0) {
      message +=
        "<br>" + this.prettifyNumber(this.totalAreaMetresSquared, true);
    }
    return message;
  };

  @action.bound
  handleClick() {
    this.userDrawing.enterDrawMode();
  }

  render() {
    return (
      <div className={Styles.toolButton}>
        <button
          type="button"
          className={Styles.btn}
          title="Measure distance between locations"
          onClick={this.handleClick}
        >
          <Icon glyph={Icon.GLYPHS.measure} />
        </button>
      </div>
    );
  }
}

export default MeasureTool;
