/*global require,$*/
"use strict";

var Dataset = require('./Dataset');

/*
TableDataSource object for displaying geo-located datasets
For the time being it acts as a layer on top of a CzmlDataSource
And writes a czml file for it to display
*/

//TODO: DOCUMENT using model in GeoJsonDataSource

var defaultValue = require('../third_party/cesium/Source/Core/defaultValue');
var CzmlDataSource = require('../third_party/cesium/Source/DataSources/CzmlDataSource');
var Color = require('../third_party/cesium/Source/Core/Color');
var defineProperties = require('../third_party/cesium/Source/Core/defineProperties');
var destroyObject = require('../third_party/cesium/Source/Core/destroyObject');
var JulianDate = require('../third_party/cesium/Source/Core/JulianDate');

var EMPTY_OBJECT = {};


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

    this.color = Color.RED;

    this.pts_max = 10000;
    this.leadTimeMin = 0;
    this.trailTimeMin = 60;
    this.scale = 1.0;
    this.scale_by_val = true;

    var defaultGradient = [
        {offset: 0.0, color: '#00f'},
        {offset: 0.25, color: '#0ff'},
        {offset: 0.25, color: '#0ff'},
        {offset: 0.5, color: '#0f0'},
        {offset: 0.5, color: '#0f0'},
        {offset: 0.75, color: '#ff0'},
        {offset: 0.75, color: '#ff0'},
        {offset: 1.0, color: '#f00'}
    ];
    this.colorGradient = defaultGradient;
    this.setColorGradient(defaultGradient);
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

/**
 * Asynchronously loads the Table at the provided url, replacing any existing data.
 *
 * @param {Object} url The url to be processed.
 *
 * @returns {Promise} a promise that will resolve when the CZML is processed.
 */
TableDataSource.prototype.loadUrl = function (url) {
    var that = this;
    this.dataset.loadUrl({ url: url, callback: function (data) {
        that.setLeadTimeByPercent(0.0);
        that.setTrailTimeByPercent(1.0);
        that.czmlDataSource.load(that.getDataPointList(), 'TableDataSource');
        }
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
    var that = this;
    this.dataset.loadText(text);
    that.setLeadTimeByPercent(0.0);
    that.setTrailTimeByPercent(1.0);
    that.czmlDataSource.load(that.getDataPointList(), 'TableDataSource');
};

/**
* Load a variable
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setCurrentVariable = function (varname) {
    var that = this;
    this.dataset.setCurrentVariable({ variable: varname, callback: function (data) { 
        that.czmlDataSource.load(that.getDataPointList(), 'TableDataSource');
        }
    });
};

var startScratch = new JulianDate();
var endScratch = new JulianDate();

/**
* Replaceable visualizer function
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.czmlRecFromPoint = function (point) {
    var rec = {
        "billboard" : {
            "horizontalOrigin" : "CENTER",
            "verticalOrigin" : "BOTTOM",
            "image" : "./images/pow32.png",
            "scale" : 1.0,
            "color" : { "rgba" : [255, 0, 0, 255] },
            "show" : [{
                    "boolean" : false
                }, {
                "interval" : "2011-02-04T16:00:00Z/2011-04-04T18:00:00Z",
                "boolean" : true
            }]
        },
        "position" : {
            "cartographicDegrees" : [0, 0, 0]
        }
    };
    rec.billboard.color.rgba = this._mapValue2Color(point.val);
    rec.billboard.scale = this._mapValue2Scale(point.val);
    for (var p = 0; p < 3; p++) {
        rec.position.cartographicDegrees[p] = point.pos[p];
    }

    if (this.dataset.hasTimeData()) {
        var start = JulianDate.addMinutes(point.time, -this.leadTimeMin, startScratch);
        var finish = JulianDate.addMinutes(point.time, this.trailTimeMin, endScratch);
        rec.billboard.show[1].interval = JulianDate.toIso8601(start) + '/' + JulianDate.toIso8601(finish);
    }
    else {
        rec.billboard.show[0].boolean = true;
        rec.billboard.show[1].interval = undefined;
    }
    return rec;
};


/**
* Get a list of display records for the current point list.
*  Currently defaults to a czml based output
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.getDataPointList = function () {
    var data = this.dataset;
    if (data._loadingData) {
        return;
    }
    //update the datapoint collection
    var pointList = this.dataset.getPointList();
    
    var dispRecords = [{
        id : 'document',
        version : '1.0'
    }];
    
    for (var i = 0; i < pointList.length; i++) {
        //set position, scale, color, and display time
        var rec = this.czmlRecFromPoint(pointList[i]);
        dispRecords.push(rec);
    }
    return dispRecords;
};

TableDataSource.prototype._getNormalizedPoint = function (pt_val) {
    var data = this.dataset;
    if (data === undefined || data.isNoData(pt_val)) {
        return undefined;
    }
    var min_val = data.getMinVal();
    var max_val = data.getMaxVal();
    var normPoint = (max_val === min_val) ? 0 : (pt_val - min_val) / (max_val - min_val);
    return normPoint;
};

TableDataSource.prototype._mapValue2Scale = function (pt_val) {
    var scale = this.scale;
    var normPoint = this._getNormalizedPoint(pt_val);
    if (normPoint !== undefined) {
        scale *= (this.scale_by_val ? 1.0 * normPoint + 0.5 : 1.0);
    }
    return scale;
};


TableDataSource.prototype._mapValue2Color = function (pt_val) {
    var colors = this.dataImage;
    if (colors === undefined) {
        return this.color;
    }
    var normPoint = this._getNormalizedPoint(pt_val);
    var color = [0, 0, 0, 0];
    if (normPoint !== undefined) {
        var clr_idx = Math.floor(normPoint * (colors.data.length / 4 - 1)) * 4;
        color = colors.data.subarray(clr_idx, clr_idx+4);
        color[3] *= this.color.alpha;
    }
    return color;
};

/**
* Set the lead time by percent
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setLeadTimeByPercent = function (pct) {
    if (this.dataset && this.dataset.hasTimeData()) {
        var data = this.dataset;
        this.leadTimeMin = JulianDate.secondsDifference(data.getMaxTime(), data.getMinTime()) * pct / (60.0 * 100.0);
    }
};

/**
* Set the trailing time by percent
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setTrailTimeByPercent = function (pct) {
    if (this.dataset && this.dataset.hasTimeData()) {
        var data = this.dataset;
        this.trailTimeMin = JulianDate.secondsDifference(data.getMaxTime(), data.getMinTime()) * pct / (60.0 * 100.0);
    }
};


//TODO: canvas is an easy way to do this, but html5 specific
TableDataSource.prototype.createGradient = function (ctx) {
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    // Create Linear Gradient
    var lingrad = ctx.createLinearGradient(0,0,0,h);
    var grad = this.colorGradient;
    for (var i = 0; i < grad.length; i++) {
        lingrad.addColorStop(grad[i].offset, grad[i].color);
    }
    ctx.fillStyle = lingrad;
    ctx.fillRect(0,0,w,h);
};

/**
* Set the gradient used to color the data points
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setColorGradient = function () {
    //create 2d canvas
    if (!document.getElementById("grad_div")) {
        $('body').append('<div id="grad_div"></div>');
        $('<canvas/>', { 'id': 'gradCanvas', 'Width': 64, 'Height': 256, 'Style': "display: none" }).appendTo('#grad_div');
    }
    var grad_canvas = $('#gradCanvas')[0];
    var ctx = grad_canvas.getContext('2d');
    this.createGradient(ctx);
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
