'use strict';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import MapInteractionMode from '../../../Models/MapInteractionMode';
import defined from 'terriajs-cesium/Source/Core/defined';
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var PolylineGraphics = require('terriajs-cesium/Source/DataSources/PolylineGraphics');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Color = require('terriajs-cesium/Source/Core/Color');
var CallbackProperty = require('terriajs-cesium/Source/DataSources/CallbackProperty');
var CustomDataSource = require('terriajs-cesium/Source/DataSources/CustomDataSource');
var EllipsoidGeodesic = require('terriajs-cesium/Source/Core/EllipsoidGeodesic.js');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid.js');
var Entity = require('terriajs-cesium/Source/DataSources/Entity.js');

const MeasureTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            headPoint : undefined,
            tailPoints : [],
            closeLoopPoint : undefined,
            inMeasureMode : false,
            totalDistanceMetres : 0,
            userPointOptions : {
                                   color : Color.WHITE,
                                   pixelSize : 20, //8,
                                   outlineColor : Color.BLACK,
                                   outlineWidth : 2
                               },
            measureToolHeader : "<strong>Measuring Tool</strong></br>",
            datasource: new CustomDataSource('User polygon')
        };
    },

    prettifyDistance(distance) {
        if (distance <= 0)
        {
            return "";
        }
        // Given a number representing a distance in metres, make it human readable
        var label = "m";
        if (distance > 999)
        {
            label = "km";
            distance = distance/1000.0;
        }
        distance = distance.toFixed(2);
        // http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        distance = distance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        var distanceStr = distance + " " + label;
        return distanceStr;
    },

    clickedExistingPoint(that, features) {
        if (features.length < 1)
        {
            return false;
        }

        features.forEach((feature)=> {
            if (!defined(feature.position))
            {
                console.log("!!!!!!");
                return;
            }
            var point = feature.position.getValue(that.props.terria.clock.currentTime);

            if (point === that.state.headPoint)
            {
                console.log("END LINE!");
                if (that.state.tailPoints.length > 2)
                {
                    that.setState({closeLoopPoint : point});
                }
                return;
            }
            else
            {
                // TODO recalcuate total distance
                console.log("removing point...");
                console.log(point);
                var index = that.state.tailPoints.indexOf(point);
                console.log(that.state.tailPoints);
                console.log("index " + index);
                if (index > -1)
                {
                    console.log("SPLICE!");
                    that.state.tailPoints.splice(index, 1);
                }
                that.state.datasource.entities.remove(feature);
                return;
            }
        });
        return true;
    },

    cleanUp(terria, that) {
        terria.dataSources.remove(this.state.datasource);
        that.state.datasource = new CustomDataSource('User polygon');
        that.state.headPoint = undefined;
        that.state.tailPoints = [];
        that.state.totalDistanceMetres = 0;
        that.setState({inMeasureMode : false});
    },

    updateDistance(that, pickedPoint) {
        var lastPoint = that.state.headPoint;
        if (that.state.tailPoints.length > 0)
        {
            lastPoint = that.state.tailPoints[that.state.tailPoints.length - 1];
        }
        // Note that Cartesian.distance gives the straight line distance between the two points, ignoring
        // curvature. This is not what we want.
        var pickedPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(pickedPoint);
        var lastPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(lastPoint);
        var geodesic = new EllipsoidGeodesic(pickedPointCartographic, lastPointCartographic);

        that.setState({ totalDistanceMetres : that.state.totalDistanceMetres + geodesic.surfaceDistance });
    },

    prepareToAddNewPoint(terria, that) {
        terria.mapInteractionModeStack.pop();
        var distanceStr = that.prettifyDistance(that.state.totalDistanceMetres);
        var message = "<i>Click to add another point</i>";
        var buttonText = "Cancel";
        if (distanceStr.length > 0)
        {
            message = distanceStr + "</br>" + message;
            buttonText = "Done";
        }
        const pickPointMode = new MapInteractionMode({
            message: that.state.measureToolHeader + message,
            buttonText: buttonText,
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
                that.cleanUp(terria, that);
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {
                var pickedPoint = pickedFeatures.pickPosition;
                if (that.clickedExistingPoint(that, pickedFeatures.features))
                {
                    console.log("Existing point. Returning.");
                    return;
                }
                else
                {
                    that.updateDistance(that, pickedPoint);

                    that.state.tailPoints.push(pickedPoint);
                    var pointEntity = new Entity({
                        name: 'Another Point',
                        point : that.state.userPointOptions,
                        position: pickedPoint
                    });
                    that.state.datasource.entities.add(pointEntity);
                }
                that.prepareToAddNewPoint(terria, that);
            }
        });
    },

    enterMeasureMode() {
        const terria = this.props.terria;
        const that = this;
        if (that.state.inMeasureMode || that.state.closeLoopPoint)
        {
            // Do nothing
            return;
        }
        that.setState({inMeasureMode : true});

        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        that.state.datasource.entities.add({
            name: 'Line',
            polyline: {
                        positions : new CallbackProperty(function(date, result) {
                                if (defined(that.state.headPoint))
                                {
                                    return [that.state.headPoint].concat(that.state.tailPoints);
                                }
                                return undefined;
                        }, false),
                        material : Color.WHITE,
                        width : 1
                    }
        });
        terria.dataSources.add(this.state.datasource);

        const pickPointMode = new MapInteractionMode({
            message: that.state.measureToolHeader + "<i>Click to add a point</i>",
            buttonText: "Cancel",
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
                that.cleanUp(terria, that);
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {
                var pickedPoint = pickedFeatures.pickPosition;
                that.setState({headPoint : pickedPoint});
                var firstPointEntity = new Entity({
                    name: 'First Point',
                    point : that.state.userPointOptions,
                    position: pickedPoint
                });
                that.state.datasource.entities.add(firstPointEntity);
                that.prepareToAddNewPoint(terria, that);
            }
        });
    },

    handleCick() {
        this.enterMeasureMode();
    },

    render() {
        return <div className='measure-tool'>
                  <button type='button' className='btn btn--increase'
                          title='measure distance between two points'
                          onClick={this.handleCick}></button>
               </div>;
    }
});

export default MeasureTool;
