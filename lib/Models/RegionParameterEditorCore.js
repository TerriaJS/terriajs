'use strict';

var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var RegionPicker = require('../ReactViews/Analytics/RegionPicker');
var MapInteractionMode = require('./MapInteractionMode');

var Styles = require('../ReactViews/Analytics/parameter-editors.scss');
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
    var value = this.parameter.regionParameter.value;
    var regionProvider = this.parameter.regionParameter.regionProvider;
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
    this.parameter.regionParameter.value = value;
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
                        parameter={that.parameter.regionParameter}
                     />
                    );
        }
    });
    terria.mapInteractionModeStack.push(pickPointMode);
    that.viewState.explorerPanelIsVisible = false;
};

module.exports = RegionParameterEditorCore;
