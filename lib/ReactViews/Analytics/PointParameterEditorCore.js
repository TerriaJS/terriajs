'use strict';

/* global require*/
const Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
const CesiumMath = require('terriajs-cesium/Source/Core/Math');
const defined = require('terriajs-cesium/Source/Core/defined');
const Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
const knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

const MapInteractionMode = require('../../Models/MapInteractionMode');

const PointParameterEditorCore = function(previewed, parameter, viewState) {
    this.previewed = previewed;
    this.parameter = parameter;
    this.viewState = viewState;
};

PointParameterEditorCore.prototype.getInitialState = function() {
    return this.getValue();
};

PointParameterEditorCore.prototype.onTextChange = function(e) {
    const coordinates = e.split(',');
    if (coordinates.length >= 2) {
        this.parameter.value = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
        this.parameter.displayValue = this.getValue();
    }
};

PointParameterEditorCore.prototype.getValue = function() {
    if (defined(this.parameter.value)) {
        return CesiumMath.toDegrees(this.parameter.value.longitude) + ',' + CesiumMath.toDegrees(this.parameter.value.latitude);
    } else {
        return '';
    }
};

PointParameterEditorCore.prototype.setValue = function(value) {
    this.parameter.value = value;
    this.parameter.displayValue = this.getValue();
};

PointParameterEditorCore.prototype.formatValueForUrl = function(value) {
    if (!defined(value) || value === '') {
        return undefined;
    }

    const coordinates = [
        CesiumMath.toDegrees(value.longitude),
        CesiumMath.toDegrees(value.latitude),
    ];

    if (defined(value.height)) {
        coordinates.push(value.height);
    }

    return this.parameter.id + '=' + JSON.stringify({
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': coordinates
                }
            }
        ]
    });
};

PointParameterEditorCore.prototype.selectOnMap = function() {
    const terria = this.previewed.terria;
    const that = this;

    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;

    const pickPointMode = new MapInteractionMode({
        message: 'Select a point by clicking on the map.',
        onCancel: function () {
            terria.mapInteractionModeStack.pop();
            that.viewState.openAddData();
        }
    });
    terria.mapInteractionModeStack.push(pickPointMode);

    knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
        if (defined(pickedFeatures.pickPosition)) {
            const value = Ellipsoid.WGS84.cartesianToCartographic(pickedFeatures.pickPosition);
            that.setValue(value);
            terria.mapInteractionModeStack.pop();
            that.viewState.openAddData();
        }
    });

    that.viewState.explorerPanelIsVisible = false;
};

module.exports = PointParameterEditorCore;
