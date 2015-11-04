'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ReportCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this._loadedShortReport = undefined;
    this._loadedFullReport = undefined;

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

    /**
     * Gets or sets the short version of the report.  The report is a string with Markdown and/or HTML formatting.
     * It may be unsafe and must be sanitized before it is shown to the user.
     * @type {String}
     */
    this.shortReport = undefined;

    /**
     * Gets or sets the short version of the report.  The report is a string with Markdown and/or HTML formatting.
     * It may be unsafe and must be sanitized before it is shown to the user.
     * @type {String}
     */
    this.fullReport = undefined;

    knockout.track(this, ['shortReportUrl', 'fullReportUrl', 'shortReport', 'fullReport']);
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
    }
});

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

/**
 * Cancels the asynchronous process.
 */
ReportCatalogItem.prototype.cancel = function() {
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
