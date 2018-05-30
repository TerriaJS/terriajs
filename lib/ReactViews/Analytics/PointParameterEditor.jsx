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

    getInitialState() {
        return {
            // A flag indicating whether we will display invalid data errors to the user.
            allowInvalidDisplay: false
        };
    },

    inputOnChange(e) {
        PointParameterEditor.storeValueFromText(e, this.props.parameter);

        if (defined(PointParameterEditor.tryParseCartographicValueFromText(e.target.value))) {
            // Once the user has entered a valid value in the field always show whether the input is valid.
            this.setState({allowInvalidDisplay: true});
        }
    },

    inputOnBlur(e) {
        PointParameterEditor.setCartographicValueFromText(e, this.props.parameter);

        // Once the user has left the focus of the field always show whether the input is valid.
        this.setState({allowInvalidDisplay: true});
    },

    isParameterValid () {
        if (defined(this.props.parameter)) {

            if (this.props.parameter.value instanceof Cartographic) {
                return true;
            } else if (PointParameterEditor.tryParseCartographicValueFromText(this.props.parameter.value)) {
                return true;
            }

        }

        return false;
    },

    selectPointOnMap() {
        PointParameterEditor.selectOnMap(this.props.previewed.terria, this.props.viewState, this.props.parameter);
    },

    render() {
        const that = this;
        this.props.parameter.isValid = function () {
            return that.isParameterValid();
        }

        const invalid = ((this.state.allowInvalidDisplay === true) && (this.isParameterValid() === false));
        const style = !invalid ? Styles.field : Styles.fieldInvalid;

        return (
            <div>
                <If condition={invalid}>
                <div className={Styles.warningText}>
                    Please enter valid coordinates (e.g. -25.3450, 131.0361).
                </div>
                </If>
                <input className={style}
                       type="text"
                       onChange={this.inputOnChange}
                       onBlur={this.inputOnBlur}
                       value={PointParameterEditor.getDisplayValue(this.props.parameter.value)}
                       placeholder="-25.3450, 131.0361"/>
                <button type="button" onClick={this.selectPointOnMap} className={Styles.btnSelector}>
                    Select location
                </button>
            </div>
        );
    },
});

/**
 * Triggered when user leaves the field, updates the parameter as a Cartographic if possible otherwise just stores the value.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 */
PointParameterEditor.setCartographicValueFromText = function(e, parameter) {
    const parsedValue = PointParameterEditor.tryParseCartographicValueFromText(e.target.value);
    if (defined(parsedValue)) {
        // Store the value parsed if it is valid.
        parameter.value = parsedValue;
    } else {
        // Still keep the value if its invalid, just store it natively so that we don't obliterate the user entered content.
        parameter.value = e.target.value;
    }
};

/**
 * Parses the value into a Cartographic if it is in a valid format, otherwise returns undefined.
 * @param {String} value Text that is to be parsed.
 * @return {Cartographic} The value if it was able to be parsed otherwise undefined.
 */
PointParameterEditor.tryParseCartographicValueFromText = function(value) {
    const coordinates = value.split(',');
    if (coordinates.length >= 2) {
        const lon = parseFloat(coordinates[0]);
        const lat = parseFloat(coordinates[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
            return Cartographic.fromDegrees(lon, lat);
        }
    }

    return undefined;
};

/**
 * Store the value for later use.
 * @param {String} e Text that user has entered manually.
 * @param {FunctionParameter} parameter Parameter to set value on.
 */
PointParameterEditor.storeValueFromText = function(e, parameter) {
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

PointParameterEditor.isValid = function(value) {
    if (defined(value)) {
        if (value instanceof Cartographic) {
            return true;
        }
    }

    return false;
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
