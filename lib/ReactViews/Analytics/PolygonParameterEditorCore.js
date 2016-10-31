'use strict';

const CesiumMath = require('terriajs-cesium/Source/Core/Math');
const defined = require('terriajs-cesium/Source/Core/defined');
const Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
const UserDrawing = require('../../Models/UserDrawing');

const PolygonParameterEditorCore = function(previewed, parameter, viewState) {
    this.previewed = previewed;
    this.parameter = parameter;
    this.viewState = viewState;
    const that = this;
    this.userDrawing = new UserDrawing({
        terria: that.previewed.terria,
        onPointClicked: function(pointEntities) {
            const pointEnts = pointEntities.entities.values;
            const pointsLongLats = [];
            for (let i=0; i < pointEnts.length; i++) {
                const currentPoint = pointEnts[i];
                const currentPointPos = currentPoint.position.getValue(that.previewed.terria.clock.currentTime);
                const cartographic = Ellipsoid.WGS84.cartesianToCartographic(currentPointPos);
                const points = [];
                points.push(CesiumMath.toDegrees(cartographic.longitude));
                points.push(CesiumMath.toDegrees(cartographic.latitude));
                pointsLongLats.push(points);
            }
            that.parameter.value = [pointsLongLats];
            that.parameter.displayValue = that.getValue();
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
    const rawValue = this.parameter.value;
    if (!defined(rawValue) || rawValue.length < 1) {
        return '';
    }
    const pointsLongLats = rawValue[0];

    let polygon = '';
    for (let i = 0; i < pointsLongLats.length; i++) {
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

PolygonParameterEditorCore.prototype.formatValueForUrl = function(value) {
    if (!defined(value) || value === '') {
        return undefined;
    }

    return this.parameter.id + '=' + JSON.stringify({
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': value
                }
            }
        ]
    });
};

PolygonParameterEditorCore.prototype.selectOnMap = function() {
    this.userDrawing.enterDrawMode();
    this.viewState.explorerPanelIsVisible = false;
};

module.exports = PolygonParameterEditorCore;
