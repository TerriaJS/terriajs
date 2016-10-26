'use strict';

var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var RegionPicker = require('./RegionPicker');
var MapInteractionMode = require('../../Models/MapInteractionMode');

var Styles = require('./parameter-editors.scss');
var React = require('react');

var RegionParameterEditorCore = function(previewed, parameter, viewState) {
    this.previewed = previewed;
    this.parameter = parameter;
    this.viewState = viewState;
};

RegionParameterEditorCore.prototype.getInitialState = function() {
    return this.getValue();
};

RegionParameterEditorCore.prototype.getValue = function() {
    var value = this.parameter.value;
    var regionProvider = this.parameter.regionProvider;
    if (!defined(regionProvider) || !defined(value)) {
        return "";
    }
    var index = regionProvider.regions.indexOf(value);

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
    var that = this;
    return this.parameter.regionParameter.regionProvider.getRegionFeature(this.previewed.terria, value, undefined).then(function(feature) {
                var regionParameterString = that.parameter.id + '=' + JSON.stringify({
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
    var terria = this.previewed.terria;
    // Cancel any feature picking already in progress.
    terria.pickedFeatures = undefined;

    var that = this;
    var pickPointMode = new MapInteractionMode({
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
