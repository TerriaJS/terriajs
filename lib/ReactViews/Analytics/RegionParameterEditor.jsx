"use strict";

import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';

import RegionPicker from './RegionPicker';
import MapInteractionMode from '../../Models/MapInteractionMode';
import Styles from './parameter-editors.scss';

const RegionParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        viewState: React.PropTypes.object,
        parameter: React.PropTypes.object
    },

    getInitialState() {
        return {
            value: this.getValue()
        };
    },

    getValue() {
        let value = this.props.parameter.value;
        const regionProvider = this.props.parameter.regionProvider;
        if (!defined(regionProvider) || !defined(value)) {
            return "";
        }
        const index = regionProvider.regions.indexOf(value);

        if (index >= 0 && regionProvider.regionNames[index]) {
            value = regionProvider.regionNames[index];
        } else {
            value = value.id;
        }
        return regionProvider.regionType + ": " + value;
    },

    selectRegionOnMap() {
        const terria = this.props.previewed.terria;
        // Cancel any feature picking already in progress.
        terria.pickedFeatures = undefined;

        const that = this;
        const pickPointMode = new MapInteractionMode({
            message: 'Select a region on the map',
            onCancel: function () {
                that.props.previewed.terria.mapInteractionModeStack.pop();
                that.props.viewState.openAddData();
            },
            buttonText: "Done",
            customUi: function() {
                return (<RegionPicker className={Styles.parameterEditor}
                            previewed={that.props.previewed}
                            parameter={that.props.parameter}
                         />
                );
            }
        });
        terria.mapInteractionModeStack.push(pickPointMode);
        that.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
        return (<div>
                    <input className={Styles.field}
                           type="text"
                           readOnly
                           value={this.state.value}/>
                    <button type="button" onClick={this.selectRegionOnMap} className={Styles.btnSelector}>
                        Select region
                    </button>
                </div>);
    }
});

module.exports = RegionParameterEditor;
