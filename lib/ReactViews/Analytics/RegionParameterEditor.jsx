"use strict";

import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';
import RegionPicker from './RegionPicker';
import MapInteractionMode from '../../Models/MapInteractionMode';

const RegionParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        viewState: React.PropTypes.object,
        parameter: React.PropTypes.object
    },

    selectRegionOnMap() {
        RegionParameterEditor.selectOnMap(this.props.viewState, this.props.parameter, this.props.previewed);
    },

    render() {
        return (<div>
                    <input className={Styles.field}
                           type="text"
                           readOnly
                           value={this.props.parameter.displayValue}/>
                    <button type="button" onClick={this.selectRegionOnMap} className={Styles.btnSelector}>
                        Select region
                    </button>
                </div>);
    }
});

/**
 * Prompt user to select/draw on map in order to define parameter.
 * @param {Object} viewState ViewState.
 * @param {FunctionParameter} parameter Parameter.
 * @param {Object} previewed Previewed.
 */
RegionParameterEditor.selectOnMap = function(viewState, parameter, previewed) {
    const terria = previewed.terria;
    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;

    const pickPointMode = new MapInteractionMode({
        message: 'Select a region on the map',
        onCancel: function () {
            terria.mapInteractionModeStack.pop();
            viewState.openAddData();
        },
        buttonText: "Done",
        customUi: function Done() {
            return (<RegionPicker className={Styles.parameterEditor}
                        previewed={previewed}
                        parameter={parameter}
                     />
            );
        }
    });
    terria.mapInteractionModeStack.push(pickPointMode);
    viewState.explorerPanelIsVisible = false;
};

module.exports = RegionParameterEditor;
