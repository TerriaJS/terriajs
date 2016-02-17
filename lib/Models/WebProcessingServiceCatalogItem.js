'use strict';

/*global require*/
var CatalogItem = require('./CatalogItem');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var PointParameter = require('./PointParameter');
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

    this._geojsonCatalogItem = undefined;

    /**
     * Gets or sets the parameters to the WPS function.
     * @type {FunctionParameter[]}
     */
    this.parameters = undefined;

    /**
     * Gets or sets the values of the parameters that were used to invoke this function.
     * @type {Object}
     */
    this.parameterValues = undefined;

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
     * @memberOf WebProcessingServiceCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wps-result';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Processing Service Result'.
     * @memberOf WebProcessingServiceCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Processing Service Result';
        }
    },

    /**
     * Gets the data source associated with this catalog item.
     * @memberOf WebProcessingServiceCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return defined(this._geojsonCatalogItem) ? this._geojsonCatalogItem.dataSource : undefined;
        }
    }
});

WebProcessingServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.wpsResponseUrl, this.wpsResponse];
};

WebProcessingServiceCatalogItem.prototype._load = function() {
    if (defined(this._geojsonCatalogItem)) {
        this._geojsonCatalogItem._hide();
        this._geojsonCatalogItem._disable();
        this._geojsonCatalogItem = undefined;
    }

    var geojson;
    if (defined(this.parameters) && defined(this.parameterValues)) {
        var firstPointParameter = this.parameters.filter(function(parameter) { return parameter instanceof PointParameter; })[0];
        if (defined(firstPointParameter)) {
            var cartographic = this.parameterValues[firstPointParameter.id];
            geojson = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [CesiumMath.toDegrees(cartographic.longitude), CesiumMath.toDegrees(cartographic.latitude)]
                },
                properties: {
                    title: firstPointParameter.name,
                    foo: 'bar'
                }
            };
        }
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

        if (!defined(that.shortReport)) {
            that.shortReport = report;
        }

        if (!defined(that.featureInfoTemplate)) {
            that.featureInfoTemplate =
                '<h2>Inputs</h2>' +
                '<table>' +
                (that.parameters || []).reduce(function(previousValue, parameter) {
                    return  previousValue +
                        '<tr>' +
                            '<td>' + parameter.name + '</td>' +
                            '<td>' + that.parameters[parameter.id] + '</td>' +
                        '</tr>';
                }) +
                '</table>' +
                '<h2>Outputs</h2>' +
                '<table>' +
                '</table>';
        }

        if (defined(geojson)) {
            that._geojsonCatalogItem = new GeoJsonCatalogItem(that.terria);
            that._geojsonCatalogItem.name = that.name;
            that._geojsonCatalogItem.data = geojson;
            return that._geojsonCatalogItem.load().then(function() {
                if (!defined(that.rectangle)) {
                    that.rectangle = that._geojsonCatalogItem.rectangle;
                }
            });
        }
    });
};

WebProcessingServiceCatalogItem.prototype._enable = function() {
    if (defined(this._geojsonCatalogItem)) {
        this._geojsonCatalogItem._enable();
    }
};

WebProcessingServiceCatalogItem.prototype._disable = function() {
    if (defined(this._geojsonCatalogItem)) {
        this._geojsonCatalogItem._disable();
    }
};

WebProcessingServiceCatalogItem.prototype._show = function() {
    if (defined(this._geojsonCatalogItem)) {
        this._geojsonCatalogItem._show();
    }
};

WebProcessingServiceCatalogItem.prototype._hide = function() {
    if (defined(this._geojsonCatalogItem)) {
        this._geojsonCatalogItem._hide();
    }
};

module.exports = WebProcessingServiceCatalogItem;
