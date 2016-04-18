'use strict';
import React from 'react';
import ObserveModelMixin from '../../ObserveModelMixin';
import MapInteractionMode from '../../../Models/MapInteractionMode';
import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
var CesiumCartesian = require('terriajs-cesium/Source/Core/Cartesian3');

const GeoJsonCatalogItem = require('../../../Models/GeoJsonCatalogItem');

const MeasureTool = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
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
                terria.userSelectedPoints.push(firstPt);

                knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
                    if (defined(pickedFeatures.pickPosition)) {
                        // User has picked both points
                        var secondPt = pickedFeatures.pickPosition;
                        console.log("Second point picked: " + secondPt);
                        terria.userSelectedPoints.push(secondPt);
                        var firstPt = terria.userSelectedPoints[0];
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
