/*global require*/
"use strict";

/*
TableDataSource object for displaying geo-located datasets
*/

var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var ClockRange = require('terriajs-cesium/Source/Core/ClockRange');
var ClockStep = require('terriajs-cesium/Source/Core/ClockStep');
var Color = require('terriajs-cesium/Source/Core/Color');
var createGuid = require('terriajs-cesium/Source/Core/createGuid');
var DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var EntityCollection = require('terriajs-cesium/Source/DataSources/EntityCollection');
var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var HorizontalOrigin = require('terriajs-cesium/Source/Scene/HorizontalOrigin');
var Iso8601 = require('terriajs-cesium/Source/Core/Iso8601');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');
var TimeIntervalCollectionProperty = require('terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty');
var VerticalOrigin = require('terriajs-cesium/Source/Scene/VerticalOrigin');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var VarType = require('../Map/VarType');
var formatPropertyValue = require('../Core/formatPropertyValue');
var DataTable = require('./DataTable');
var simplestats = require('simple-statistics');
var Legend = require('./Legend');
/**
* @class TableDataSource is a cesium based datasource for table based geodata
* @name TableDataSource
*
* @alias TableDataSource
* @internalConstructor
* @constructor
*/
var TableDataSource = function() {

    this._name = name;
    this._changed = new CesiumEvent();
    this._error = new CesiumEvent();
    this._loading = new CesiumEvent();
    this._clock = undefined;
    this._entityCollection = new EntityCollection(this);

    this.dataset = new DataTable();
    this.loadingData = false;

    this._colorByValue = true;  //set to false by having only 1 entry in colorMap

    this.scale = 1.0;
    this.scaleByValue = false;
    this.imageUrl = '';
    this.displayDuration = undefined;  //minutes
    this.minDisplayValue = undefined;
    this.maxDisplayValue = undefined;
    this.clampDisplayValue = true;
    this.legendTicks = 0;
    this.colorBins = 7;
    this.colorBinMethod = "auto";
    this.featureInfoFields = undefined;
    //this are not used by the data source but they are stored with the style info for use by region mapping
    this.regionVariable = undefined;
    this.regionType = undefined;

    this.setColorGradient([
        {offset: 0.0, color: 'rgba(32,0,200,1.0)'},
        {offset: 0.25, color: 'rgba(0,200,200,1.0)'},
        {offset: 0.5, color: 'rgba(0,200,0,1.0)'},
        {offset: 0.75, color: 'rgba(200,200,0,1.0)'},
        {offset: 1.0, color: 'rgba(200,0,0,1.0)'}
    ]);
    this.dataVariable = undefined;

    knockout.track(this, ['dataset']);
};

defineProperties(TableDataSource.prototype, {
        /**
         * Gets a human-readable name for this instance.
         * @memberof TableDataSource.prototype
         * @type {String}
         */
        name : {
            get : function() {
                return this._name;
            }
        },
         /**
         * Gets the clock settings defined by the loaded data.  If
         * only static data exists, this value is undefined.
         * @memberof TableDataSource.prototype
         * @type {DataSourceClock}
         */
       clock : {
            get : function() {
                return this._clock;
            }
        },
         /**
         * Gets the collection of {@link Entity} instances.
         * @memberof TableDataSource.prototype
         * @type {EntityCollection}
         */
       entities : {
            get : function() {
                return this._entityCollection;
            }
        },
         /**
         * Gets a value indicating if the data source is currently loading data.
         * @memberof TableDataSource.prototype
         * @type {Boolean}
         */
       isLoading : {
            get : function() {
                return this.loadingData;
            }
        },
         /**
         * Gets a CesiumEvent that will be raised when the underlying data changes.
         * @memberof TableDataSource.prototype
         * @type {CesiumEvent}
         */
       changedEvent : {
            get : function() {
                return this._changed;
            }
        },
         /**
         * Gets a CesiumEvent that will be raised if an error is encountered during processing.
         * @memberof TableDataSource.prototype
         * @type {CesiumEvent}
         */
       errorEvent : {
            get : function() {
                return this._error;
            }
        },
        /**
         * Gets a CesiumEvent that will be raised when the data source either starts or stops loading.
         * @memberof TableDataSource.prototype
         * @type {CesiumEvent}
         */
        loadingEvent : {
            get : function() {
                return this._loading;
            }
        }
});



/**
 * Set the table display style parameters. See documentation at {@link TableStyle}
 */
TableDataSource.prototype.setDisplayStyle = function (style) {
    if (!defined(style)) {
        return;
    }

    this.scale = defaultValue(style.scale, this.scale);
    this.scaleByValue = defaultValue(style.scaleByValue, this.scaleByValue);
    this.imageUrl = defaultValue(style.imageUrl, this.imageUrl);
    this.displayDuration = defaultValue(style.displayDuration, this.displayDuration);
    this.clampDisplayValue = defaultValue(style.clampDisplayValue, this.clampDisplayValue);
    this.legendTicks = defaultValue(style.legendTicks, this.legendTicks);
    //these can be set to undefined with the style
    this.minDisplayValue = style.minDisplayValue;
    this.maxDisplayValue = style.maxDisplayValue;
    this.regionVariable = style.regionVariable;
    this.regionType = style.regionType;
    this.featureInfoFields = style.featureInfoFields;
    this.colorBins = defaultValue(style.colorBins, this.colorBins);
    this.colorBinMethod = defaultValue(style.colorBinMethod, this.colorBinMethod);

    // we need this variable set in order to compute color map, even though we set it again in a minute.
    // this.dataset.setDataVariable(style.dataVariable);

    var that = this;
    var p = when ();
    if (defined(style.colorMap) || defined(style.colorPalette)) {
        p = when (style.loadColorMap()).then(function(cm) {
            that.setColorGradient(cm);
        });
    }

    // Triggers rebuilding of CZML objects for lat-lon datasets.
    return p.then(function() {
        // that.setDataVariable(style.dataVariable);  // this used to be set here, but now set via the setSelectedFunction
        updateEntities(that);
    });
};



/**
 * Set the table display style parameters (see setDisplayStyle for more style format)
 *
 * @returns {Object} An object containing the style parameters for the datasource.
 *
 */
TableDataSource.prototype.getDisplayStyle = function () {

    return {
        scale: this.scale,
        scaleByValue: this.scaleByValue,
        imageUrl: this.imageUrl,
        displayDuration: this.displayDuration,
        minDisplayValue: this.minDisplayValue,
        maxDisplayValue: this.maxDisplayValue,
        clampDisplayValue: this.clampDisplayValue,
        legendTicks: this.legendTicks,
        colorMap: this.colorMap,
        dataVariable: this.dataVariable,
        regionVariable: this.regionVariable,
        regionType: this.regionType,
        featureInfoFields: this.featureInfoFields
    };
};

/**
 * Asynchronously loads the Table at the provided url, replacing any existing data.
 *
 * @param {Object} url The url to be processed.
 *
 * @returns {Promise} a promise that will resolve when the data is processed.
 */
TableDataSource.prototype.loadUrl = function (url) {
    if (!defined(url)) {
        return;
    }
    this.loadingData = true;
    var that = this;
    return loadText(url).then(function(text) {
        that.loadText(text);
        that.loadingData = false;
    }).otherwise(function(error) {
        that.loadingData = false;
        that._error.raiseEvent(that, error);
        window.console.log(error);
        return when.reject(error);
    });
};

/**
 * Loads the Table from text, replacing any existing data.
 *
 * @param {Object} text The text to be processed.
 *
 */
TableDataSource.prototype.loadText = function (text) {
    this.dataset.loadText(text);
    if (this.dataset && this.dataset.hasTimeData() && !defined(this.displayDuration)) {
        // default duration calculation is for a data point to be shown for 1% of the total time span of the dataset
        var percentDisplay = 1.0;
        this.displayDuration = JulianDate.secondsDifference(this.dataset.getTimeMaxValue(), this.dataset.getTimeMinValue()) * percentDisplay / (60.0 * 100.0);
        this._autoDuration = true; // Since no duration was provided, we will use the full interval between each data point and the next
    }

    if (defined(this.dataVariable)) {
        // user-specified variable
        this.setDataVariable(this.dataVariable);
    } else {
        // otherwise pick the first one. Doing it here may simplify life.
        this.setDataVariable(this.dataset.getDataVariableList(true)[0]);
    }
    updateEntities(this);
};

/**
 * Returns a cached, sorted, unique array of JulianDates corresponding to the time values of different data points.
 */

TableDataSource.prototype.timeSlices = function() {
    if (!this.dataset || !this.dataset.hasTimeData()) {
        return undefined;
    }
    if (this._timeSlices) {
        return this._timeSlices;
    }
    var pointList = this.dataset.getPointList();

    this._timeSlices = pointList.map(function(point) { return point.time; });
    this._timeSlices.sort(JulianDate.compare);
    this._timeSlices = this._timeSlices.filter(function(element, index, array) {
        return index === 0 || !JulianDate.equals(array[index-1], element);
    });
    return this._timeSlices;
};

/**
 * Returns a { start, finish } pair of JulianDates corresponding to some pair of rows around this time.
 */
TableDataSource.prototype.getTimeSlice = function(time) {
    function shave(t) {
        // subtract a second from end values to avoid having slices actually overlap.
        return JulianDate.addSeconds(t, -1, new JulianDate());
    }
    var ts = this.timeSlices();
    if (!defined(ts) || ts.length === 0) {
        return undefined;
    }
    if (JulianDate.lessThan(time, ts[0])) {
        // not really consistent here
        return { start: time, finish: shave(ts[0]) };
    }
    for (var i = 0; i < ts.length - 1; i++) {
        if (JulianDate.greaterThan(ts[i+1], time)) {
            return { start: ts[i], finish: shave(ts[i + 1]) };
        }
    }
    if (JulianDate.lessThanOrEquals(time, JulianDate.addMinutes(ts[ts.length-1], this.displayDuration, new JulianDate()))) {
        // just outside the range, but within range + displayDuration
        return {
            start: ts[i],
            finish: JulianDate.addMinutes(time, this.displayDuration, new JulianDate())
        };
    }
    // if time is outside our time slices, we use displayDuration
    // counting backwards from the time is consistent with when not using automatic durations.
    return {
        start: JulianDate.addMinutes(time, -this.displayDuration, new JulianDate()),
        finish: time
    };
};

/**
* Sets the current data variable
*
* @param {String} varName The name of the variable to make the data variable
*
*/
TableDataSource.prototype.setDataVariable = function (varName) {
    this.dataVariable = varName;
    this.dataset.setDataVariable(varName);
    this._changed.raiseEvent(this);
    updateClock(this);
};

// set the features (entities) on this data source
function updateEntities(dataSource) {
    if (dataSource.dataset.hasLocationData()) {
        // remove existing entities first
        dataSource._entityCollection.removeAll();
        var pointList = dataSource.dataset.getPointList();
        for (var i = 0; i < pointList.length; i++) {
            //set position, scale, color, and display time
            var dataRow = dataSource.dataset.getDataRow(pointList[i].row);
            var name = chooseName(dataRow);
            addEntityFromPoint(dataSource, pointList[i], name, dataRow);
        }
        dataSource._changed.raiseEvent(dataSource);
        updateClock(dataSource);
    }
}

function updateClock(dataSource) {
    var clock;
    if (!defined(dataSource._clock)) {
        var availability = dataSource._entityCollection.computeAvailability();
        if (!availability.start.equals(Iso8601.MINIMUM_VALUE)) {
            var startTime = availability.start;
            var stopTime = availability.stop;
            var totalSeconds = JulianDate.secondsDifference(stopTime, startTime);
            var multiplier = Math.round(totalSeconds / 120.0);

            clock = new DataSourceClock();
            clock.startTime = JulianDate.clone(startTime);
            clock.stopTime = JulianDate.clone(stopTime);
            clock.clockRange = ClockRange.LOOP_STOP;
            clock.multiplier = multiplier;
            clock.currentTime = JulianDate.clone(startTime);
            clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
            dataSource._clock = clock;
            return true;
        }
    }
    return false;
}

var endScratch = new JulianDate();

TableDataSource.prototype.describe = function(properties) {
    if (!defined(properties) || properties === null) {
        return '';
    }

    var infoFields = defined(this.featureInfoFields) ? this.featureInfoFields : properties;
    if (infoFields instanceof Array) {
        // allow [ "FIELD1", "FIELD2" ] as a shorthand for { "FIELD1": "FIELD1", "FIELD2": "FIELD2" }
        var o = {};
        infoFields.map(function(s) { o[s] = s; } );
        infoFields = o;
    }

    var html = '<table class="cesium-infoBox-defaultTable">';
    for ( var key in infoFields) {
        if (infoFields.hasOwnProperty(key)) {
            var value = properties[key];
            var name = defined(this.featureInfoFields) ? infoFields[key] : key;
            if (defined(value)) {
                    //see if we should skip this in the details - starts with __
                if (key.substring(0, 2) === '__') {
                    continue;
                } else if (value instanceof JulianDate) {
                    value = JulianDate.toDate(value).toDateString();
                }
                if (typeof value === 'object') {
                    value = this.describe(value);
                } else {
                    value = formatPropertyValue(value);
                }
                html += '<tr><td>' + name + '</td><td>' + value + '</td></tr>';
            }
        }
    }
    html += '</table>';
    return html;
};

function addEntityFromPoint(dataSource, point, name, properties) {
    var objectId = createGuid();
    var entity = new Entity({
        id: objectId,
        name: name
    });
    entity.description = dataSource.describe(properties);
    entity.position = Cartesian3.fromDegrees(point.pos[0], point.pos[1]);
    if (entity.propertyNames.indexOf('properties') === -1) {  // not defined yet, but could be in future
        entity.addProperty('properties');
    }
    entity.properties = properties;

    var color = colorArrayToColor(dataSource._mapValue2Color(point.val));
    var scale = dataSource._mapValue2Scale(point.val);

    var show = new TimeIntervalCollectionProperty();

    if (dataSource.dataset.hasTimeData()) {
        var start = point.time;
        var finish;
        if (dataSource._autoDuration) {
            finish = dataSource.getTimeSlice(point.time).finish;
        } else {
            finish = JulianDate.addMinutes(point.time, dataSource.displayDuration, endScratch);
        }
        entity.availability = new TimeIntervalCollection();
        var availabilityInterval = new TimeInterval({start: start, stop: finish});
        entity.availability.addInterval(availabilityInterval);
        show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: false}));
        show.intervals.addInterval(new TimeInterval({start: start, stop: finish, data: true}));
    }
    else {
        show.intervals.addInterval(new TimeInterval({start: Iso8601.MINIMUM_VALUE, stop: Iso8601.MAXIMUM_VALUE, data: true}));
    }

    //no image so use point
    if (!defined(dataSource.imageUrl) || dataSource.imageUrl === '') {
        entity.point = {
            outlineColor: new Color(0, 0, 0, 1),
            outlineWidth: 1,
            pixelSize: 8 * scale,
            color: color,
            show: show
        };
    }
    else {
        entity.billboard = {
            horizontalOrigin : HorizontalOrigin.CENTER,
            verticalOrigin : VerticalOrigin.BOTTOM,
            image : dataSource.imageUrl,
            scale : scale,
            color : color,
            show : show
        };
    }
    dataSource._entityCollection.add(entity);

    return entity;
}

var defaultName = 'Site Data';

function chooseName(properties) {
    // Choose a name by the same logic as Cesium's GeoJsonDataSource
    // but fall back to the defaultName if none found.
    var nameProperty;

    // Check for the simplestyle specified name first.
    var name = properties.title;
    if (definedNotNull(name)) {
        nameProperty = 'title';
    } else {
        //Else, find the name by selecting an appropriate property.
        //The name will be obtained based on this order:
        //1) The first case-insensitive property with the name 'title',
        //2) The first case-insensitive property with the name 'name',
        //3) The first property containing the word 'title'.
        //4) The first property containing the word 'name',
        var namePropertyPrecedence = Number.MAX_VALUE;
        for (var key in properties) {
            if (properties.hasOwnProperty(key) && properties[key]) {
                var lowerKey = key.toLowerCase();
                if (namePropertyPrecedence > 1 && lowerKey === 'title') {
                    namePropertyPrecedence = 1;
                    nameProperty = key;
                    break;
                } else if (namePropertyPrecedence > 2 && lowerKey === 'name') {
                    namePropertyPrecedence = 2;
                    nameProperty = key;
                } else if (namePropertyPrecedence > 3 && /title/i.test(key)) {
                    namePropertyPrecedence = 3;
                    nameProperty = key;
                } else if (namePropertyPrecedence > 4 && /name/i.test(key)) {
                    namePropertyPrecedence = 4;
                    nameProperty = key;
                }
            }
        }
    }
    if (defined(nameProperty)) {
        return properties[nameProperty];
    } else {
        return defaultName;
    }
}


/**
* Get a list of display records for the current point list.
*
* @param {JulianTime} time The time value to filter the data against
*
* @returns {Array} An array of row indices of point objects that fall within given time segment.
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
        if (this._autoDuration) {
            var span = this.getTimeSlice(time);
            start = span.start;
            finish = span.finish;
        } else {
            start = JulianDate.addMinutes(time, -this.displayDuration, endScratch);
            finish = time;
        }
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


/**
  * Convert the value of a data point to a value between 0.0 and 1.0 */
TableDataSource.prototype._getNormalizedPoint = function (pntVal) {
    if (this.dataset === undefined || this.dataset.isNoData(pntVal)) {
        return undefined;
    }
    var minVal = this.minDisplayValue || this.dataset.getDataMinValue();
    var maxVal = this.maxDisplayValue || this.dataset.getDataMaxValue();
    var normPoint = (maxVal === minVal) ? 0 : (pntVal - minVal) / (maxVal - minVal);
    if (this.clampDisplayValue) {
        normPoint = Math.max(0.0, Math.min(1.0, normPoint));
    }
    return normPoint;
};

TableDataSource.prototype._mapValue2Scale = function (pntVal) {
    var scale = this.scale;
    var normPoint = this._getNormalizedPoint(pntVal);
    if (defined(normPoint) && normPoint === normPoint) { // testing for NaN
        scale *= (this.scaleByValue ? 1.0 * normPoint + 0.5 : 1.0);
    }
    return scale;
};

/**
 * Given a value between 0 and 1, returns the color at that proportion of the pre-computed color gradient.
 * @param  {float}  Fraction of the color gradient.
 * @return {Integer[]}   Four-integer RGBA color.
 */
TableDataSource.prototype._getColorFromGradient = function (v) {
    var colors = this.dataImage;

    var colorIndex = Math.floor(v * (colors.data.length / 4 - 1)) * 4;
    return [
        colors.data[colorIndex],
        colors.data[colorIndex + 1],
        colors.data[colorIndex + 2],
        colors.data[colorIndex + 3]];
};

TableDataSource.prototype._getBinColor = function(pntVal) {
    if (!defined(this._binColors)) {
        return undefined;
    }
    var i = 0;

    while (i < this._binColors.length - 1 && pntVal > this._binColors[i].upperBound) {
        i++;
    }

    if (this._binColors[i] === undefined) {
        console.log('Bad bin ' + i);
        return [0,0,0,0];
    }

    return this._binColors[i].color;
};

TableDataSource.prototype._mapValue2Color = function (pntVal) {

    if (defined(this._binColors)) {
        return this._getBinColor(pntVal);
    }
    if (this.dataImage === undefined) {
        return this.color;
    }
    var normPoint = this._getNormalizedPoint(pntVal);
    if (!defined(normPoint)) {
        return [0,0,0,0];
    } else {
        return this._getColorFromGradient(normPoint);
    }
};

function colorArrayToColor(color) {
    return new Color(color[0]/255, color[1]/255, color[2]/255, color[3]/255);
}

TableDataSource.prototype._minLegendValue = function() {
    var dataMin = this.dataset.getDataMinValue();
    if (dataMin === this.dataset.getDataMaxValue()) {
        return dataMin;
    }

    return defined(this.minDisplayValue) ? this.minDisplayValue : dataMin;
};

TableDataSource.prototype._maxLegendValue = function() {
    var dataMax = this.dataset.getDataMaxValue();
    if (dataMax === this.dataset.getDataMinValue()) {
        return dataMax;
    }

    return defined(this.maxDisplayValue) ? this.maxDisplayValue : dataMax;
};

TableDataSource.prototype._setColorBins = function() {
    if (!defined(this.dataset.selected.data) || this.colorBins <= 0 || this.colorBinMethod.match(/none/i)) {
        this._binColors = undefined;
        return;
    }
    this._binColors = [];

    var vals = this.dataset.getVariableValues(this.dataset.selected.data).filter(function(x) { return typeof x === 'number'; });
    var binCount = Math.min(this.colorBins, vals.length), i; // Must ask for fewer clusters than the number of items.

    // here we convert the output formats of two binning methods into a structure like [ { color: 'green', upperBound: 20 } , { color: 'orange': upperBound: 80 } ]
    if (this.colorBinMethod === 'quantile' || this.colorBinMethod === 'auto' &&  vals.length > 1000) {
        // the quantile method is simpler, less accurate, but faster for large datasets. One issue is we don't check to see if any
        // values actually lie within a given quantile, so it's bad for small datasets.
        for (i = 0; i < binCount; i++) {
            this._binColors.push({
                upperBound: simplestats.quantile(vals, (i + 1) / binCount),
                color: this._getColorFromGradient(i / (binCount - 1))
            });
        }
    } else {
        var clusters = simplestats.ckmeans(vals, binCount);

        // turn the ckmeans format [ [5, 20], [65, 80] ]
        for (i = 0; i < clusters.length; i++) {
            if (i > 0 && clusters[i].length === 1 && clusters[i][0] === clusters[i - 1][clusters[i - 1].length - 1]) {
                // When there are few unique values, we can end up with clusters like [1], [2],[2],[2],[3]. Let's avoid that.
                continue;
            }
            this._binColors.push({
                upperBound: clusters[i][clusters[i].length-1],
            });
        }
        for (i = 0; i < this._binColors.length; i++) {
            this._binColors[i].color = this._getColorFromGradient(i / (this._binColors.length - 1));
        }
    }
};


/**
* Get a data url that holds the image for the legend
*
* @returns {String} A data url that is a png of the legend for the datasource
*
*/
TableDataSource.prototype.getLegendGraphic = function () {
    function fixedPoint(f) {
        return (Math.round(f * 100) / 100).toString();
    }

    function gradientLabelPoints(ticks) {
        var items = [];
        var segments = 2 + ticks;
        for (var i = 1; i <= segments; i++) {
            items.push({
                titleAbove: fixedPoint(minVal + (maxVal - minVal) * (i / segments)),
                titleBelow: (i === 1) ? fixedPoint(minVal) : undefined
            });
        }
        return items;
    }
    //Check if fixed color for all points and if so no legend
    if (!this._colorByValue || !defined(this.dataset.getDataVariable())) {
        return undefined;
    }

    var minVal = this._minLegendValue();
    var maxVal = this._maxLegendValue();
    var dataVar = this.dataset.variables[this.dataset.getDataVariable()];

    var legend;
    if (!this._binColors) {
        // Display a smooth gradient with number of ticks requested.
        legend = new Legend({
            title: dataVar.name,
            barHeightMin: 130,
            gradientColorMap: this.colorMap,
            labelTickColor: 'darkgray',
            items: gradientLabelPoints(this.legendTicks)
        });
    } else if (dataVar.varType === VarType.ENUM) {
        // Enumerated legend labels are centred on each box, and slightly separated.
        legend = new Legend({
            title: dataVar.name,
            itemSpacing: 2,
            items: this._binColors.map(function(b, i) {
                return { 
                    title: dataVar.enumList[i],
                    color: 'rgb(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ')'
                } })
            
        });
    } else {
        // Numeric legends are displayed as thresholds between touching colours, and have an additional value
        // at the bottom.
        legend = new Legend({
            title: dataVar.name,
            itemSpacing: 0,
            items: this._binColors.map(function(b, i) {
                return { 
                    // these long checks are to avoid showing max and min values when they're identical to the second highest and second lowest numbers
                    titleAbove: (i === 0 || i < this._binColors.length - 1 || b.upperBound > this._binColors[i-1].upperBound) ? 
                        (i === this._binColors.length - 1 ? fixedPoint(maxVal) : fixedPoint(b.upperBound)) : 
                        undefined,
                    titleBelow: (i === 0 && b.upperBound !== minVal) ? 
                        fixedPoint(minVal) : 
                        undefined,
                    color: 'rgb(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ')'
                } }, this)
            
        });
    }
    return legend.asPngUrl();
};

/**
* Set the gradient used to color the data points. This is a series of linear colour gradients
* defined by color stops, against which individual data values may be mapped non-linearly.
*
* @param {Array} colorMap A colormap with an array of entries as defined for html5
*   canvas linear gradients e.g., { offset: xx, color: 'rgba(32,0,200,1.0)'}
*
*/
TableDataSource.prototype.setColorGradient = function (colorMap) {
    if (colorMap === undefined) {
        return;
    }

    this.colorMap = colorMap;

    var canvas = document.createElement("canvas");
    if (!defined(canvas)) {
        return;
    }
    var w = canvas.width = 64;
    var h = canvas.height = 256;
    var ctx = canvas.getContext('2d');


    // Create Linear Gradient
    var grad = this.colorMap;
    var linGrad = ctx.createLinearGradient(0,0,0,h);
    if (grad.length === 1) {
        this._colorByValue = false;
    }
    for (var i = 0; i < grad.length; i++) {
        linGrad.addColorStop(grad[i].offset, grad[i].color);
    }
    ctx.fillStyle = linGrad;
    ctx.fillRect(0,0,w,h);

    this.dataImage = ctx.getImageData(0, 0, 1, 256);

    this._setColorBins();
};

/**
* Destroy the object and release resources
*
*/
TableDataSource.prototype.destroy = function () {
    return destroyObject(this);
};

module.exports = TableDataSource;
