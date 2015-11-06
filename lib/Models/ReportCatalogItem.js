'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ReportCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this._loadedShortReport = undefined;
    this._loadedFullReport = undefined;
    this._shortReport = undefined;
    this._fullReport = undefined;

    /**
     * Gets or sets the URL from which to obtain the short report.  If {@see ReportCatalogItem#shortReport} is defined, this
     * property is ignored.  This property is observable.
     * @type {String}
     */
    this.shortReportUrl = undefined;

    /**
     * Gets or sets the URL from which to obtain the full report.  If {@see ReportCatalogItem#fullReport} is defined, this
     * property is ignored.  This property is observable.
     * @type {String}
     */
    this.fullReportUrl = undefined;

    knockout.track(this, ['shortReportUrl', 'fullReportUrl']);

    /**
     * Gets or sets the short version of the report.  The report is a string with Markdown and/or HTML formatting.
     * It may be unsafe and must be sanitized before it is shown to the user.
     * @member {String} shortReport
     * @memberOf ReportCatalogItem.prototype
     */
    knockout.defineProperty(this, 'shortReport', {
        get: function() {
            if (defined(this._shortReport)) {
                return this._shortReport;
            } else {
                return this._loadedShortReport;
            }
        },
        set: function(value) {
            this._shortReport = value;
        }
    });

    /**
     * Gets or sets the full version of the report.  The report is a string with Markdown and/or HTML formatting.
     * It may be unsafe and must be sanitized before it is shown to the user.
     * @member {String} fullReport
     * @memberOf ReportCatalogItem.prototype
     */
    knockout.defineProperty(this, 'fullReport', {
        get: function() {
            if (defined(this._fullReport)) {
                return this._fullReport;
            } else {
                return this._loadedFullReport;
            }
        },
        set: function(value) {
            this._fullReport = value;
        }
    });
};

inherit(CatalogItem, ReportCatalogItem);

defineProperties(ReportCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ReportCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'report';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf ReportCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Report';
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CatalogItem.defaultSerializers;
        }
    }
});

ReportCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

ReportCatalogItem.defaultSerializers.shortReport = function(catalogItem, json, prototypeName) {
    if(defined(catalogItem._shortReport)){
           json.shortReport = catalogItem._shortReport;
        }
};

ReportCatalogItem.defaultSerializers.fullReport = function(catalogItem, json, prototypeName) {
    if(defined(catalogItem._fullReport)){
           json.fullReport = catalogItem._fullReport;
        }
};

freezeObject(ReportCatalogItem.defaultSerializers);

ReportCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.shortReportUrl, this.fullReportUrl, this.shortReport, this.fullReport];
};

ReportCatalogItem.prototype._load = function() {
    var reports = [
        defined(this.shortReport) ? this.shortReport : (defined(this.shortReportUrl) ? loadText(this.shortReportUrl) : undefined),
        defined(this.fullReport) ? this.fullReport : (defined(this.fullReportUrl) ? loadText(this.fullReportUrl) : undefined)
    ];

    var that = this;
    return when.all(reports, function(reports) {
        that._loadedShortReport = reports[0];
        that._loadedFullReport = reports[1];
    });
};

ReportCatalogItem.prototype._enable = function() {
};

ReportCatalogItem.prototype._disable = function() {
};

ReportCatalogItem.prototype._show = function() {
};

ReportCatalogItem.prototype._hide = function() {
};

module.exports = ReportCatalogItem;
