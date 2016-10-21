'use strict';

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var UserDrawing = require('./UserDrawing');

var PolygonParameterEditorCore = function(previewed, parameter, viewState) {
    this.previewed = previewed;
    this.parameter = parameter;
    this.viewState = viewState;
    var that = this;
    this.userDrawing = new UserDrawing({
                    terria: that.previewed.terria,
                    onPointClicked: function(pointEntities) {
                            var pointEnts = pointEntities.entities.values;
                            var pointsLongLats = [];
                            for (var i=0; i < pointEnts.length; i++) {
                                var currentPoint = pointEnts[i];
                                var currentPointPos = currentPoint.position.getValue(that.previewed.terria.clock.currentTime);
                                var cartographic = Ellipsoid.WGS84.cartesianToCartographic(currentPointPos);
                                var points = [];
                                points.push(CesiumMath.toDegrees(cartographic.longitude));
                                points.push(CesiumMath.toDegrees(cartographic.latitude));
                                pointsLongLats.push(points);
                            }
                            that.parameter.value = [pointsLongLats];
                        },
                    onCleanUp: function() {
                            that.viewState.openAddData();
                        }
                    });
};

PolygonParameterEditorCore.prototype.getInitialState = function() {
    return this.getValue();
};

PolygonParameterEditorCore.prototype.onTextChange = function(e) {
    this.setValue(e.target.value);
};

PolygonParameterEditorCore.prototype.getValue = function() {
    var rawValue = this.parameter.value;
    if (!defined(rawValue) || rawValue.length < 1) {
        return '';
    }
    var pointsLongLats = rawValue[0];

    var polygon = '';
    for (var i = 0; i < pointsLongLats.length; i++) {
        polygon += '[' + pointsLongLats[i][0].toFixed(3) + ', ' + pointsLongLats[i][1].toFixed(3) + ']';
        if (i !== pointsLongLats.length - 1) {
            polygon += ', ';
        }
    }
    if (polygon.length > 0) {
        return '[' + polygon + ']';
    } else {
        return '';
    }
};

PolygonParameterEditorCore.prototype.setValue = function(value) {
    this.parameter.value = value;
};

PolygonParameterEditorCore.prototype.selectOnMap = function() {
    this.userDrawing.enterDrawMode();
    this.viewState.explorerPanelIsVisible = false;
};

module.exports = PolygonParameterEditorCore;
