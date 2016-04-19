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
            pointOne : undefined,
            pointTwo : undefined,
            datasource: new CustomDataSource('User polygon')
        };
    },

    prettifyDistance(distance) {
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

    enterMeasureMode() {
        console.log("Enter measure mode...");
        const terria = this.props.terria;
        const that = this;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        that.state.datasource.entities.add({
            name: 'First Point',
            point : {
                color : Color.WHITE,
                pixelSize : 8,
                outlineColor : Color.BLACK,
                outlineWidth : 2
            },
            position: new CallbackProperty(function(date, result) {
                if (defined(that.state.pointOne))
                {
                    return that.state.pointOne;
                }
            }, false)
        });
        that.state.datasource.entities.add({
            name: 'Second Point',
            point : {
                color : Color.WHITE,
                pixelSize : 8,
                outlineColor : Color.BLACK,
                outlineWidth : 2
            },
            position: new CallbackProperty(function(date, result) {
                if (defined(that.state.pointTwo))
                {
                    return that.state.pointTwo;
                }
            }, false)
        });
        that.state.datasource.entities.add({
            name: 'Line',
            polyline: {
                        positions : new CallbackProperty(function(date, result) {
                                if (defined(that.state.pointOne) & defined(that.state.pointTwo))
                                {
                                    return [that.state.pointOne, that.state.pointTwo];
                                }
                        }, false),
                        material : Color.WHITE,
                        width : 1
                    }
        });
        terria.dataSources.add(this.state.datasource);

        const pickPointMode = new MapInteractionMode({
            message: 'Measure Tool: Select first point.',
            onCancel: function() {
                terria.mapInteractionModeStack.pop();
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);

        knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
            if (defined(pickedFeatures.pickPosition)) {

                // User has picked one point, wait for second.
                terria.mapInteractionModeStack.pop();
                const pickPointMode = new MapInteractionMode({
                    message: 'Measure Tool: Select second point.',
                    onCancel: function() {
                        terria.mapInteractionModeStack.pop();
                    }
                });
                terria.mapInteractionModeStack.push(pickPointMode);
                var firstPt = pickedFeatures.pickPosition;
                console.log("First point picked: " + firstPt);
                that.setState({pointOne : firstPt});

                knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
                    if (defined(pickedFeatures.pickPosition)) {
                        // User has picked both points
                        var secondPt = pickedFeatures.pickPosition;
                        console.log("Second point picked: " + secondPt);
                        var firstPt = that.state.pointOne;
                        that.setState({pointTwo : secondPt});
                        var distance = CesiumCartesian.distance(firstPt, secondPt);
                        console.log("DISTANCE...");
                        var distanceStr = that.prettifyDistance(distance);
                        console.log(distanceStr);
                        terria.mapInteractionModeStack.pop();

                    }
                });
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
