'use strict';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
const UserDrawing = require('../../../Map/UserDrawing');
const EllipsoidGeodesic = require('terriajs-cesium/Source/Core/EllipsoidGeodesic.js');
const Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid.js');

const MeasureTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            totalDistanceMetres: 0,
            userDrawing: new UserDrawing(this.props.terria,
                {
                    messageHeader: "Measure Tool",
                    onPointClickedCallback: this.onPointClicked,
                    onCleanUpCallback: this.onCleanUp,
                    onMakeDialogMessageCallback: this.onMakeDialogMessage
                })
        };
    },

    prettifyDistance(distance) {
        if (distance <= 0) {
            return "";
        }
        // Given a number representing a distance in metres, make it human readable
        let label = "m";
        if (distance > 999) {
            label = "km";
            distance = distance/1000.0;
        }
        distance = distance.toFixed(2);
        // http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        distance = distance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const distanceStr = distance + " " + label;
        return distanceStr;
    },

    updateDistance(pointEntities) {
        this.setState({ totalDistanceMetres: 0 });
        if (pointEntities.entities.values.length < 1) {
            return;
        }

        const prevPoint = pointEntities.entities.values[0];
        let prevPointPos = prevPoint.position.getValue(this.props.terria.clock.currentTime);
        for (let i=1; i < pointEntities.entities.values.length; i++) {
            const currentPoint = pointEntities.entities.values[i];
            const currentPointPos = currentPoint.position.getValue(this.props.terria.clock.currentTime);

            this.setState({ totalDistanceMetres: this.state.totalDistanceMetres + this.getGeodesicDistance(prevPointPos,
                                                                                                           currentPointPos)});

            prevPointPos = currentPointPos;
        }
        if (this.state.userDrawing.closeLoop) {
            const firstPoint = pointEntities.entities.values[0];
            const firstPointPos = firstPoint.position.getValue(this.props.terria.clock.currentTime);
            this.setState({ totalDistanceMetres: this.state.totalDistanceMetres + this.getGeodesicDistance(prevPointPos,
                                                                                                           firstPointPos)});
        }
    },

    getGeodesicDistance(pointOne, pointTwo) {
        // Note that Cartesian.distance gives the straight line distance between the two points, ignoring
        // curvature. This is not what we want.
        const pickedPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(pointOne);
        const lastPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(pointTwo);
        const geodesic = new EllipsoidGeodesic(pickedPointCartographic, lastPointCartographic);
        return geodesic.surfaceDistance;
    },

    onCleanUp() {
        this.setState({totalDistanceMetres: 0});
    },

    onPointClicked(pointEntities) {
        this.updateDistance(pointEntities);
    },

    onMakeDialogMessage() {
        return this.prettifyDistance(this.state.totalDistanceMetres);
    },

    handleClick() {
        this.state.userDrawing.enterDrawMode();
    },

    render() {
        return <div className='measure-tool'>
                  <button type='button' className='btn btn--increase'
                          title='measure distance between two points'
                          onClick={this.handleClick}></button>
               </div>;
    }
});

export default MeasureTool;
