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
            // We set this to false because we only want to see errors once the have attempted to enter data.
            allowInvalidDisplay: false,
            // A flag which protects overwriting the user text while the user is editing the field.
            preventTextChange: false,
            // A state value to store and persist the user entered text.
            text: ""
        };
    },

    inputOnChange(e) {
        this.setCartographicValueFromText(e, this.props.parameter);

        if (defined(this.props.parameter.tryParseCartographicValueFromTextLonLat(e.target.value))) {
            // Once the user has entered a valid value in the field always show whether the input is valid.
            this.setState({allowInvalidDisplay: true});
        }
    },

    inputOnFocus(e) {
        // Store the text as it is currently formatted, as we will immediately revert to using the text value rather
        // then using the live parameter value once the preventTextChange flag is set.
        this.setState({text: this.getDisplayValue()});

        // We prevent updating the text input while the user is entering text so that we don't variances because the
        // values are stored as floats.
        this.setState({preventTextChange: true});
    },

    inputOnBlur(e) {
        // Free up so that the live value is now displayed.
        this.setState({preventTextChange: false});

        // Once the user has left the focus of the field always show whether the input is valid.
        this.setState({allowInvalidDisplay: true});
    },

    selectPointOnMap() {
        PointParameterEditor.selectOnMap(this.props.previewed.terria, this.props.viewState, this.props.parameter);
    },

    setCartographicValueFromText(e, parameter) {
        parameter.parseParameterLonLat(e.target.value);
        this.setState({text: e.target.value});
    },

    getDisplayValue() {
        const digits = 5;
        const value = this.props.parameter.value;

        if ((this.state.preventTextChange !== true) && defined(value) && (value instanceof Cartographic)) {
            return CesiumMath.toDegrees(value.longitude).toFixed(digits) + ', ' + CesiumMath.toDegrees(value.latitude).toFixed(digits);
        }

        return this.state.text;
    },

    render() {
        const invalid = ((this.state.allowInvalidDisplay === true) && (defined(this.props.parameter)) && (this.props.parameter.isValid === false));
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
                       onFocus={this.inputOnFocus}
                       value={this.getDisplayValue()}
                       placeholder="-25.3450, 131.0361"/>
                <button type="button" onClick={this.selectPointOnMap} className={Styles.btnSelector}>
                    Select location
                </button>
            </div>
        );
    },
});


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
