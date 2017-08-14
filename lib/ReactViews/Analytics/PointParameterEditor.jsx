'use strict';

import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

import MapInteractionMode from '../../Models/MapInteractionMode';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const PointParameterEditor = createReactClass({
    displayName: 'PointParameterEditor',
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: PropTypes.object,
        parameter: PropTypes.object,
        viewState: PropTypes.object
    },

    setCartographicValueFromText(e) {
        PointParameterEditor.setCartographicValueFromText(e, this.props.parameter);
    },

    setValueFromText(e) {
        PointParameterEditor.setValueFromText(e, this.props.parameter);
    },

    selectPointOnMap() {
        PointParameterEditor.selectOnMap(this.props.previewed.terria, this.props.viewState, this.props.parameter);
    },

    render() {
        return (
            <div>
                <input className={Styles.field}
                       type="text"
                       onChange={this.setValueFromText}
                       onBlur={this.setCartographicValueFromText}
                       value={PointParameterEditor.getDisplayValue(this.props.parameter.value)}
                       placeholder="131.036111, -25.345"/>
                <button type="button" onClick={this.selectPointOnMap} className={Styles.btnSelector}>
                    Select location
                </button>
            </div>
        );
    },
});

/**
 * Triggered when user leaves the field, updates the parameter as a Cartographic.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 */
PointParameterEditor.setCartographicValueFromText = function(e, parameter) {
    const coordinates = e.target.value.split(',');
    if (coordinates.length >= 2) {
        parameter.value = Cartographic.fromDegrees(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
    } else {
        parameter.value = undefined;
    }
};

/**
 * Triggered when user types value directly into field.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 */
PointParameterEditor.setValueFromText = function(e, parameter) {
    parameter.value = e.target.value;
};

/**
 * Given a value, return it in human readable form for display.
 * @param {Object} value Native format of parameter value.
 * @return {String} String for display
 */
PointParameterEditor.getDisplayValue = function(value) {
    if (defined(value)) {
        if (value instanceof Cartographic) {
            return CesiumMath.toDegrees(value.longitude) + ',' + CesiumMath.toDegrees(value.latitude);
        } else {
            return value;
        }
    } else {
        return '';
    }
};

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param {Terria} terria Terria instance.
 * @param {Object} viewState ViewState.
 * @param {FunctionParameter} parameter Parameter.
 */
PointParameterEditor.selectOnMap = function(terria, viewState, parameter) {
    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;

    const pickPointMode = new MapInteractionMode({
        message: 'Select a point by clicking on the map.',
        onCancel: function () {
            terria.mapInteractionModeStack.pop();
            viewState.openAddData();
        }
    });
    terria.mapInteractionModeStack.push(pickPointMode);

    knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe(function(pickedFeatures) {
        if (defined(pickedFeatures.pickPosition)) {
            const value = Ellipsoid.WGS84.cartesianToCartographic(pickedFeatures.pickPosition);
            terria.mapInteractionModeStack.pop();
            parameter.value = value;
            viewState.openAddData();
        }
    });

    viewState.explorerPanelIsVisible = false;
};

module.exports = PointParameterEditor;
