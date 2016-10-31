'use strict';

/* global require*/
const Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
const CesiumMath = require('terriajs-cesium/Source/Core/Math');
const defined = require('terriajs-cesium/Source/Core/defined');
const Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
const knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

const MapInteractionMode = require('../../Models/MapInteractionMode');

/**
 * The guts of what a PointParameterEditor does, since it is used by multiple Parameters.
 *
 * @alias PointParameterEditorCore
 * @constructor
 * @abstract
 *
 * @param {React.PropTypes.object} previewed Previewed item from viewState.
 * @param {React.PropTypes.object} parameter Object that inherits from FunctionParameter.
 * @param {React.PropTypes.object} viewState the main viewState.
 */
const PointParameterEditorCore = function(previewed, parameter, viewState) {
    this.previewed = previewed;
    this.parameter = parameter;
    this.viewState = viewState;
};

/**
 * @return {String} the value when editor is first opened.
 */
PointParameterEditorCore.prototype.getInitialState = function() {
    return this.getValue();
};

/**
 * Triggered when user types value directly into field.
 * @param {String} e Text that user has entered manually.
 */
PointParameterEditorCore.prototype.onTextChange = function(e) {
    const coordinates = e.split(',');
    if (coordinates.length >= 2) {
        this.parameter.value = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
        this.parameter.displayValue = this.getValue();
    }
};

/**
 * @return {String} stored value.
 */
PointParameterEditorCore.prototype.getValue = function() {
    if (defined(this.parameter.value)) {
        return CesiumMath.toDegrees(this.parameter.value.longitude) + ',' + CesiumMath.toDegrees(this.parameter.value.latitude);
    } else {
        return '';
    }
};

/**
 * @param {String} value Value to store.
 */
PointParameterEditorCore.prototype.setValue = function(value) {
    this.parameter.value = value;
    this.parameter.displayValue = this.getValue();
};

/**
 * @param {String} value Value to use to format.
 * @return {String} Stringified JSON that can be used to pass parameter value in URL.
 */
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

/**
 * Prompts the user to select a point on the map.
 */
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
