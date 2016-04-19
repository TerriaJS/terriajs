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
var CesiumCartesian = require('terriajs-cesium/Source/Core/Cartesian3');


const MeasureTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            headPoint : undefined,
            tailPoints : [],
            totalDistanceMetres : 0,
            userPointOptions : {
                                   color : Color.WHITE,
                                   pixelSize : 8,
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

    editPoint() {
        console.log("Edit point!");
    },

    nearExistingPoint(pickedPoint, that) {
        return false;
    },

    cleanUp(terria, that) {
        terria.dataSources.remove(this.state.datasource);
        that.state.datasource = new CustomDataSource('User polygon');
        that.state.headPoint = undefined;
        that.state.tailPoints = [];
        that.state.totalDistanceMetres = 0;
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
                if (that.nearExistingPoint(pickedPoint, that))
                {
                    that.editPoint();
                }
                else
                {
                    var lastPoint = that.state.headPoint;
                    if (that.state.tailPoints.length > 0)
                    {
                        lastPoint = that.state.tailPoints[that.state.tailPoints.length - 1];
                    }
                    var distance = CesiumCartesian.distance(pickedPoint, lastPoint);

                    that.setState({ totalDistanceMetres : that.state.totalDistanceMetres + distance });

                    that.state.tailPoints.push(pickedPoint);
                    that.state.datasource.entities.add({
                        name: 'Another Point',
                        point : that.state.userPointOptions,
                        position: pickedPoint
                    });
                }
                that.prepareToAddNewPoint(terria, that);
            }
        });
    },

    enterMeasureMode() {
        const terria = this.props.terria;
        const that = this;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        that.state.datasource.entities.add({
            name: 'Line',
            polyline: {
                        positions : new CallbackProperty(function(date, result) {
                                if (defined(that.state.tailPoints))
                                {
                                    return [that.state.headPoint].concat(that.state.tailPoints);
                                }
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
                that.state.datasource.entities.add({
                    name: 'First Point',
                    point : that.state.userPointOptions,
                    position: pickedPoint
                });
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
