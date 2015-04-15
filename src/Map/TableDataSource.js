/*global require*/
"use strict";

var Dataset = require('./Dataset');

/*
TableDataSource object for displaying geo-located datasets
For the time being it acts as a layer on top of a CzmlDataSource
And writes a czml file for it to display
*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var destroyObject = require('../../third_party/cesium/Source/Core/destroyObject');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var loadText = require('../../third_party/cesium/Source/Core/loadText');

/**
* @class TableDataSource is a cesium based datasource for table based geodata
* @name TableDataSource
*
* @alias TableDataSource
* @internalConstructor
* @constructor
*/
var TableDataSource = function () {

    //Create a czmlDataSource to piggyback on
    this.czmlDataSource = new CzmlDataSource();
    this.dataset = new Dataset();
    this.show = true;
    this._colorByValue = true;  //set to false by having only 1 entry in colorMap

    this.setTableStyle( {
        scale: 1.0,
        scaleByValue: false,
        imageUrl: '',
        displayTime: 60,  //minutes
        minDisplayValue: undefined,
        maxDisplayValue: undefined,
        filterOuterValues: false,
        colorMap: [
            {offset: 0.0, color: 'rgba(32,0,200,1.0)'},
            {offset: 0.25, color: 'rgba(0,200,200,1.0)'},
            {offset: 0.5, color: 'rgba(0,200,0,1.0)'},
            {offset: 0.75, color: 'rgba(200,200,0,1.0)'},
            {offset: 1.0, color: 'rgba(200,0,0,1.0)'}
        ]
    });
};

defineProperties(TableDataSource.prototype, {
        /**
         * Gets a human-readable name for this instance.
         * @memberof TableDataSource.prototype
         * @type {String}
         */
        name : {
            get : function() {
                return this.czmlDataSource.name;
            }
        },
         /**
         * Gets the clock settings defined by the loaded CZML.  If no clock is explicitly
         * defined in the CZML, the combined availability of all objects is returned.  If
         * only static data exists, this value is undefined.
         * @memberof TableDataSource.prototype
         * @type {DataSourceClock}
         */
       clock : {
            get : function() {
                return this.czmlDataSource.clock;
            }
        },
         /**
         * Gets the collection of {@link Entity} instances.
         * @memberof TableDataSource.prototype
         * @type {EntityCollection}
         */
       entities : {
            get : function() {
                return this.czmlDataSource.entities;
            }
        },
         /**
         * Gets a value indicating if the data source is currently loading data.
         * @memberof TableDataSource.prototype
         * @type {Boolean}
         */
       isLoading : {
            get : function() {
                return this.czmlDataSource.isLoading;
            }
        },
         /**
         * Gets an event that will be raised when the underlying data changes.
         * @memberof TableDataSource.prototype
         * @type {Event}
         */
       changedEvent : {
            get : function() {
                return this.czmlDataSource.changedEvent;
            }
        },
         /**
         * Gets an event that will be raised if an error is encountered during processing.
         * @memberof TableDataSource.prototype
         * @type {Event}
         */
       errorEvent : {
            get : function() {
                return this.czmlDataSource.errorEvent;
            }
        },
        /**
         * Gets an event that will be raised when the data source either starts or stops loading.
         * @memberof TableDataSource.prototype
         * @type {Event}
         */
        loadingEvent : {
            get : function() {
                return this.czmlDataSource.loadingEvent;
            }
        }
});



TableDataSource.prototype.setTableStyle = function (tableStyle) {
    if (!defined(tableStyle)) {
        return;
    }

    this.scale = tableStyle.scale || this.scale;
    this.scaleByValue = tableStyle.scaleByValue || this.scaleByValue;
    this.imageUrl = tableStyle.imageUrl || this.imageUrl;
    this.displayTime = tableStyle.displayTime || this.displayTime;
    this.minDisplayValue = tableStyle.minDisplayValue;
    this.maxDisplayValue = tableStyle.maxDisplayValue;
    this.filterOuterValues = tableStyle.filterOuterValues || this.filterOuterValues;

    this.setColorGradient(tableStyle.colorMap);
    this.setDataVariable(tableStyle.dataVariable);
};

/**
 * Asynchronously loads the Table at the provided url, replacing any existing data.
 *
 * @param {Object} url The url to be processed.
 *
 * @returns {Promise} a promise that will resolve when the CZML is processed.
 */
TableDataSource.prototype.loadUrl = function (url) {
    if (!defined(url)) {
        return;
    }
    var that = this;
    return loadText(url).then(function(text) {
        return that.loadText(text);
    });
};

/**
 * Asynchronously loads the Table from text, replacing any existing data.
 *
 * @param {Object} text The text to be processed.
 *
 * @returns {Promise} a promise that will resolve when the CZML is processed.
 */
TableDataSource.prototype.loadText = function (text) {
    this.dataset.loadText(text);
    this.setDisplayTimeByPercent(1.0);
    this.setDataVariable(this.dataVariable);
};

/**
* Load a variable
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setDataVariable = function (varName) {
    this.dataset.setDataVariable(varName);
    if (this.dataset.hasLocationData()) {
        this.czmlDataSource.load(this.getCzmlDataPointList());
    }
};

var endScratch = new JulianDate();


TableDataSource.prototype.describe = function(properties) {
    var html = '<table class="cesium-infoBox-defaultTable">';
    for ( var key in properties) {
        if (properties.hasOwnProperty(key)) {
            var value = properties[key];
            if (defined(value)) {
                if (value instanceof JulianDate) {
//                    value = JulianDate.toIso8601(value, 0);
                    value = JulianDate.toDate(value).toDateString();
                }
                if (typeof value === 'object') {
                    html += '<tr><td>' + key + '</td><td>' + this.describe(value) + '</td></tr>';
                } else {
                    html += '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
                }
            }
        }
    }
    html += '</table>';
    return html;
};


/**
* Replaceable visualizer function
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.czmlRecFromPoint = function (point) {

    var rec = {
        "name": "Site Data",
        "description": "empty",
        "position" : {
            "cartographicDegrees" : [0, 0, 0]
        }
    };
    
    var color = this._mapValue2Color(point.val);
    var scale = this._mapValue2Scale(point.val);

    for (var p = 0; p < 3; p++) {
        rec.position.cartographicDegrees[p] = point.pos[p];
    }

    var show = [
        {
            "boolean" : false
        },
        {
            "interval" : "2011-02-04T16:00:00Z/2011-04-04T18:00:00Z",
            "boolean" : true
        }
    ];


    if (this.dataset.hasTimeData()) {
        var start = point.time;
        var finish = JulianDate.addMinutes(point.time, this.displayTime, endScratch);
        rec.availability = JulianDate.toIso8601(start) + '/' + JulianDate.toIso8601(finish);
        show[1].interval = rec.availability;
    }
    else {
        show[0].boolean = true;
        show[1].interval = undefined;
    }

        //no image so use point
    if (!defined(this.imageUrl) || this.imageUrl === '') {
        rec.point = {
            outlineColor: { "rgba" : [0, 0, 0, 255] },
            outlineWidth: 1,
            pixelSize: 8 * scale,
            color: { "rgba" : color },
            show: show
        };
    }
    else {
        rec.billboard = {
            horizontalOrigin : "CENTER",
            verticalOrigin : "BOTTOM",
            image : this.imageUrl,
            scale : scale,
            color : { "rgba" : color },
            show : show
        };
    }

    return rec;
};


/**
* Get a list of display records for the current point list in czml format.
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.getCzmlDataPointList = function () {
    if (this.dataset.loadingData) {
        return;
    }

    var pointList = this.dataset.getPointList();
    
    var dispRecords = [{
        id : 'document',
        version : '1.0'
    }];
    
    for (var i = 0; i < pointList.length; i++) {
        //set position, scale, color, and display time
        var rec = this.czmlRecFromPoint(pointList[i]);
        rec.description = this.describe(this.dataset.getDataRow(pointList[i].row));
        dispRecords.push(rec);
    }
    return dispRecords;
};


/**
* Get a list of display records for the current point list.
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.getDataPointList = function (time) {
    if (this.dataset.loadingData) {
        return;
    }

    var pointList = this.dataset.getPointList();
    
    var dispRecords = [];
    
    var start, finish;
    if (this.dataset.hasTimeData()) {
        start = time;
        finish = JulianDate.addMinutes(time, this.displayTime, endScratch);
    }
    for (var i = 0; i < pointList.length; i++) {
        if (this.dataset.hasTimeData()) {
            if (JulianDate.lessThan(pointList[i].time, start) || 
                JulianDate.greaterThan(pointList[i].time, finish)) {
                continue;
            }
        }
        dispRecords.push(pointList[i].row);
    }
    return dispRecords;
};


TableDataSource.prototype._getNormalizedPoint = function (pntVal) {
    if (this.dataset === undefined || this.dataset.isNoData(pntVal)) {
        return undefined;
    }
    var minVal = this.minDisplayValue || this.dataset.getMinDataValue();
    var maxVal = this.maxDisplayValue || this.dataset.getMaxDataValue();
    var normPoint = (maxVal === minVal) ? 0 : (pntVal - minVal) / (maxVal - minVal);
    if (!this.filterOuterValues) {
        normPoint = Math.max(0.0, Math.min(1.0, normPoint));
    }
    return normPoint;
};


TableDataSource.prototype._mapValue2Scale = function (pntVal) {
    var scale = this.scale;
    var normPoint = this._getNormalizedPoint(pntVal);
    if (defined(normPoint) && normPoint === normPoint) {
        scale *= (this.scaleByValue ? 1.0 * normPoint + 0.5 : 1.0);
    }
    return scale;
};


TableDataSource.prototype._mapValue2Color = function (pntVal) {
    var colors = this.dataImage;
    if (colors === undefined) {
        return this.color;
    }
    var normPoint = this._getNormalizedPoint(pntVal);
    var color = [0, 0, 0, 0];
    if (normPoint !== undefined) {
        var colorIndex = Math.floor(normPoint * (colors.data.length / 4 - 1)) * 4;
        color[0] = colors.data[colorIndex];
        color[1] = colors.data[colorIndex + 1];
        color[2] = colors.data[colorIndex + 2];
        color[3] = colors.data[colorIndex + 3];
    }
    return color;
};

/**
* Set the point display time by percent
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setDisplayTimeByMinutes = function (minutes) {
    if (!defined(minutes) || (typeof minutes !== 'number')) {
        return;
    }
    this.displayTime = minutes;
};


/**
* Set the point display time by percent
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setDisplayTimeByPercent = function (pct) {
    if (!defined(pct) || (typeof pct !== 'number')) {
        return;
    }
    if (this.dataset && this.dataset.hasTimeData() && defined(this.dataset.getMaxTime())) {
        this.displayTime = JulianDate.secondsDifference(this.dataset.getMaxTime(), this.dataset.getMinTime()) * pct / (60.0 * 100.0);
    }
};


/**
* Set the image used to represent the data points
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setImageUrl = function (imageUrl) {
    this.imageUrl = imageUrl;
};

/**
* Get a data url that holds the image for the legend
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.getLegendGraphic = function () {
    //Check if fixed color for all points and if so no legend
    if (!this._colorByValue) {
        return undefined;
    }

    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return;
    }
    var w = canvas.width = 210;
    var h = canvas.height = 160;
    var gradW = 30;
    var gradH = 128;
    var ctx = canvas.getContext('2d');

        // Create Linear Gradient
    var grad = this.colorGradient;
    var linGrad = ctx.createLinearGradient(0,0,0,gradH);
    for (var i = 0; i < grad.length; i++) {
        linGrad.addColorStop(grad[i].offset, grad[i].color);
    }
        //white background
    ctx.fillStyle = "#2F353C";
    ctx.fillRect(0,0,w,h);
        //put 0 at bottom
    ctx.translate(gradW + 15, h-5);
    ctx.rotate(180 * Math.PI / 180);
    ctx.fillStyle = linGrad;
    ctx.fillRect(0,0,gradW,gradH);
    
        //text
    var val;
    var minText = (val = this.minDisplayValue || this.dataset.getMinDataValue()) === undefined ? 'und.' : val.toString();
    var maxText = (val = this.maxDisplayValue || this.dataset.getMaxDataValue()) === undefined ? 'und.' : val.toString();
    var varText = this.dataset.getDataVariable();
    
    ctx.setTransform(1,0,0,1,0,0);
    ctx.font = "16px Arial Narrow";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(varText, 5, 15);
    ctx.fillText(maxText, gradW + 25, 15+h-gradH-5);
    ctx.fillText(minText, gradW + 25, h-5);
    
    return canvas.toDataURL("image/png");
};


/**
* Set the gradient used to color the data points
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setColorGradient = function (colorGradient) {
    if (colorGradient === undefined) {
        return;
    }
    
    this.colorGradient = colorGradient;

    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return;
    }
    var w = canvas.width = 64;
    var h = canvas.height = 256;
    var ctx = canvas.getContext('2d');
    
    // Create Linear Gradient
    var grad = this.colorGradient;
    var linGrad = ctx.createLinearGradient(0,0,0,h);
    if (grad.length === 1) {
        this._colorByValue = false;
        linGrad.addColorStop(0.0, grad[0].color);
        linGrad.addColorStop(1.0, grad[0].color);
    } 
    else {
        for (var i = 0; i < grad.length; i++) {
            linGrad.addColorStop(grad[i].offset, grad[i].color);
        }
    }
    ctx.fillStyle = linGrad;
    ctx.fillRect(0,0,w,h);

    this.dataImage = ctx.getImageData(0, 0, 1, 256);
};

/**
* Destroy the object and release resources
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = TableDataSource;
