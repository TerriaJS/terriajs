'use strict';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import MapInteractionMode from '../../../Models/MapInteractionMode';
import defined from 'terriajs-cesium/Source/Core/defined';
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var PolylineGraphics = require('terriajs-cesium/Source/DataSources/PolylineGraphics');
var PolygonHierarchy = require('terriajs-cesium/Source/Core/PolygonHierarchy');
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
            closeLoop : false,
            inMeasureMode : false,
            totalDistanceMetres : 0,
            userPointOptions : {
                                   color : Color.WHITE,
                                   pixelSize : 8,
                                   outlineColor : Color.BLACK,
                                   outlineWidth : 2
                               },
            measureToolHeader : "<strong>Measuring Tool</strong></br>",
            pointEntities: new CustomDataSource('Points'),
            otherEntities: new CustomDataSource('Lines and polygons'),
            polygon : undefined
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

    getPointsForShape(that) {
        if (defined(that.state.pointEntities.entities))
        {
            var pos = [];
            for (var i=0; i < that.getNumberOfPointEntities(that); i++)
            {
                var obj = that.state.pointEntities.entities.values[i];
                if (defined(obj.position))
                {
                    var position = obj.position.getValue(that.props.terria.clock.currentTime);
                    pos.push(position);
                }
            }
            return pos;
        }
    },

    clickedExistingPoint(that, features) {
        console.log("How many features? " + features.length);
        if (features.length < 1)
        {
            return false;
        }

        features.forEach((feature)=> {
            var index = that.state.pointEntities.entities.values.indexOf(feature);
            console.log("INDEX: " + index);

            if (index === 0 && !that.state.closeLoop)
            {
                that.state.polygon = that.state.otherEntities.entities.add({
                        name : 'User polygon',
                        polygon : {
                            hierarchy : new CallbackProperty(function(date, result) { return new PolygonHierarchy(that.getPointsForShape(that)); }, false),
                            material: new Color(0.9, 0.9, 0.9, 0.25)
                       }
                    });
                that.setState({closeLoop : true});
                return;
            }
            else
            {
                // TODO recalcuate total distance
                console.log("removing point...");
                that.state.pointEntities.entities.remove(feature);
                if (that.getNumberOfPointEntities(that) < 2 && that.state.closeLoop)
                {
                    that.setState({closeLoop : false});
                    that.state.otherEntities.entities.remove(that.state.polygon);
                }
                return;
            }
        });
        return true;
    },

    getNumberOfPointEntities(that) {
        return that.state.pointEntities.entities.values.length;
    },

    cleanUp(terria, that) {
        terria.dataSources.remove(this.state.pointEntities);
        that.state.pointEntities = new CustomDataSource('Points');
        terria.dataSources.remove(this.state.otherEntities);
        that.state.otherEntities = new CustomDataSource('Lines and polygons');
        that.setState({inMeasureMode : false,
                       closeLoop : false,
                       totalDistanceMetres : 0});
    },

    getGeodesicDistance(pointOne, pointTwo) {
        // Note that Cartesian.distance gives the straight line distance between the two points, ignoring
        // curvature. This is not what we want.
        var pickedPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(pointOne);
        var lastPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(pointTwo);
        var geodesic = new EllipsoidGeodesic(pickedPointCartographic, lastPointCartographic);
        return geodesic.surfaceDistance;
    },

    updateDistance(that) {
        this.setState({ totalDistanceMetres : 0 });
        if (that.state.pointEntities.entities.values.length < 1)
        {
            return;
        }

        var prevPoint = that.state.pointEntities.entities.values[0];
        var prevPointPos = prevPoint.position.getValue(that.props.terria.clock.currentTime);
        for (var i=1; i < that.getNumberOfPointEntities(that); i++)
        {
            var currentPoint = that.state.pointEntities.entities.values[i];
            var currentPointPos = currentPoint.position.getValue(that.props.terria.clock.currentTime);

            that.setState({ totalDistanceMetres : that.state.totalDistanceMetres + that.getGeodesicDistance(prevPointPos, currentPointPos)});

            prevPointPos = currentPointPos;
        }
        if (that.state.closeLoop)
        {
            var firstPoint = that.state.pointEntities.entities.values[0];
            var firstPointPos = firstPoint.position.getValue(that.props.terria.clock.currentTime);
            that.setState({ totalDistanceMetres : that.state.totalDistanceMetres + that.getGeodesicDistance(prevPointPos, firstPointPos)});
        }
    },

    getDistanceMessage(that) {
        var distanceStr = that.prettifyDistance(that.state.totalDistanceMetres);
        var word = "a";
        if (that.state.pointEntities.entities.values.length > 0)
        {
            word = "another";
        }
        var message = "<i>Click to add " + word + " point</i>";
        if (distanceStr.length > 0)
        {
            message = distanceStr + "</br>" + message;
        }
        return that.state.measureToolHeader + message;
    },

    getButtonText(that) {
        var buttonText = "Cancel";
        if (that.state.totalDistanceMetres > 0)
        {
            buttonText = "Done";
        }
        return buttonText;
    },

    mapInteractionModeUpdate(terria, that) {
        terria.mapInteractionModeStack.pop();
        const pickPointMode = new MapInteractionMode({
            message: that.getDistanceMessage(that),
            buttonText: that.getButtonText(that),
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
                that.cleanUp(terria, that);
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);
        return pickPointMode;
    },

    prepareToAddNewPoint(terria, that) {
        var pickPointMode = that.mapInteractionModeUpdate(terria, that);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {
                var pickedPoint = pickedFeatures.pickPosition;
                if (!that.clickedExistingPoint(that, pickedFeatures.features))
                {
                    var pointEntity = new Entity({
                        name: 'Another Point',
                        point : that.state.userPointOptions,
                        position: pickedPoint
                    });
                    that.state.pointEntities.entities.add(pointEntity);
                }
                that.updateDistance(that);
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

        that.state.otherEntities.entities.add({
            name: 'Line',
            polyline: {
                        positions : new CallbackProperty(function(date, result) {
                            var pos = that.getPointsForShape(that);
                            if (that.state.closeLoop)
                            {
                                pos.push(pos[0]);
                            }
                            return pos;
                        }, false),
                        material : Color.WHITE,
                        width : 1
                      }
        });
        terria.dataSources.add(this.state.pointEntities);
        terria.dataSources.add(this.state.otherEntities);

        const pickPointMode = new MapInteractionMode({
            message: that.getDistanceMessage(that),
            buttonText: that.getButtonText(that),
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
                that.cleanUp(terria, that);
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {
                var pickedPoint = pickedFeatures.pickPosition;
                var firstPointEntity = new Entity({
                    name: 'First Point',
                    point : that.state.userPointOptions,
                    position: pickedPoint
                });
                that.state.pointEntities.entities.add(firstPointEntity);
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
