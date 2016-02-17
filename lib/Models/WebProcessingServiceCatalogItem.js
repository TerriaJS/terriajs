'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var URI = require('urijs');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var xml2json = require('../ThirdParty/xml2json');

/**
 * A catalog item representing the result of invoking a web processing service (WPS).
 *
 * @alias WebProcessingServiceCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function WebProcessingServiceCatalogItem(terria) {
    CatalogItem.call(this, terria);

    /**
     * Gets or sets the URL of the WPS completed response.  This property is ignored if
     * {@link WebProcessingServiceCatalogItem#wpsResponse} is defined.  This property is observable.
     * @type {String}
     */
    this.wpsResponseUrl = undefined;

    /**
     * Gets or sets the completed WPS response, as either XML or the result of passing the
     * XML through {@link xml2json}.
     * @type {Object|Document}
     */
    this.wpsResponse = undefined;

    /**
     * A short report of the WPS result to show on the now viewing tab.  If not specified, this
     * property is generated from the WPS response.  This property is observable.
     * @type {String}
     */
    this.shortReport = undefined;

    knockout.track(this, ['wpsResponseUrl', 'wpsResponse', 'shortReport']);
}

inherit(CatalogItem, WebProcessingServiceCatalogItem);

defineProperties(WebProcessingServiceCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GeoJsonCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wps-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GeoJSON'.
     * @memberOf GeoJsonCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Processing Service Result';
        }
    }
});

WebProcessingServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.wpsResponseUrl, this.wpsResponse];
};

WebProcessingServiceCatalogItem.prototype._load = function() {
    if (defined(this.shortReport)) {
        return;
    }

    var wpsResponsePromise;
    if (defined(this.wpsResponse)) {
        wpsResponsePromise = when(this.wpsResponse);
    } else {
        wpsResponsePromise = loadXML(proxyCatalogItemUrl(this, this.wpsResponseUrl, '1d'));
    }

    var that = this;
    return wpsResponsePromise.then(function(xmlOrJson) {
        var json;
        if (xmlOrJson instanceof Document) {
            json = xml2json(xmlOrJson);
        } else {
            json = xmlOrJson;
        }

        var processOutputs = json.ProcessOutputs;
        if (!defined(processOutputs)) {
            return;
        }

        var outputs = processOutputs.Output;
        if (!defined(outputs)) {
            return;
        } else if (!Array.isArray(outputs)) {
            outputs = [outputs];
        }

        var report = '';

        for (var i = 0; i < outputs.length; ++i) {
            var outputTitle = outputs[i].Title;

            if (!defined(outputs[i].Data) || !defined(outputs[i].Data.LiteralData)) {
                continue;
            }

            var literalData = outputs[i].Data.LiteralData;

            report += '*' + outputTitle + '*: ';

            if (defined(literalData) && literalData.match(/[.\/](png|jpg|jpeg|gif|svg)/i)) {
                report += '[![' + outputTitle + '](' + literalData + ')](' + literalData + ')';
            } else if (literalData.indexOf('http:') === 0 || literalData.indexOf('https:') === 0) {
                var uri = new URI(literalData);
                report += '[' + uri.filename() + '](' + literalData + ')';
            } else {
                report += literalData;
            }

            report += '\n\n';
        }

        that.shortReport = report;
    });
};

WebProcessingServiceCatalogItem.prototype._enable = function() {
};

WebProcessingServiceCatalogItem.prototype._disable = function() {
};

WebProcessingServiceCatalogItem.prototype._show = function() {
};

WebProcessingServiceCatalogItem.prototype._hide = function() {
};

module.exports = WebProcessingServiceCatalogItem;
