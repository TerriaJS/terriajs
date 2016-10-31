'use strict';

const defined = require('terriajs-cesium/Source/Core/defined');

const RegionPicker = require('./RegionPicker');
const MapInteractionMode = require('../../Models/MapInteractionMode');

const Styles = require('./parameter-editors.scss');
const React = require('react');

const RegionParameterEditorCore = function(previewed, parameter, viewState) {
    this.previewed = previewed;
    this.parameter = parameter;
    this.viewState = viewState;
};

RegionParameterEditorCore.prototype.getInitialState = function() {
    return this.getValue();
};

RegionParameterEditorCore.prototype.getValue = function() {
    let value = this.parameter.value;
    const regionProvider = this.parameter.regionProvider;
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
};

RegionParameterEditorCore.prototype.setValue = function(value) {
    this.parameter.value = value;
    this.parameter.displayValue = this.getValue();
};

RegionParameterEditorCore.prototype.formatValueForUrl = function(value) {
    const that = this;
    return this.parameter.regionParameter.regionProvider.getRegionFeature(this.previewed.terria, value, undefined).then(function(feature) {
        const regionParameterString = that.parameter.id + '=' + JSON.stringify({
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': feature.geometry
                }
            ]
        });
        return regionParameterString;
    });
};

RegionParameterEditorCore.prototype.selectOnMap = function() {
    const terria = this.previewed.terria;
    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;

    const that = this;
    const pickPointMode = new MapInteractionMode({
        message: 'Select a region on the map',
        onCancel: function () {
            that.previewed.terria.mapInteractionModeStack.pop();
            that.viewState.openAddData();
        },
        buttonText: "Done",
        customUi: function() {
            return (<RegionPicker className={Styles.parameterEditor}
                        previewed={that.previewed}
                        parameter={that.parameter}
                     />
                    );
        }
    });
    terria.mapInteractionModeStack.push(pickPointMode);
    that.viewState.explorerPanelIsVisible = false;
};

module.exports = RegionParameterEditorCore;
