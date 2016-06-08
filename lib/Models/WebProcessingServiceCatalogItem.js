'use strict';

/*global require*/
var RectangleParameter = require('./RectangleParameter');
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
var rectangleToPolygonArray = require('../Core/rectangleToPolygonArray');
var ShortReportSection = require('./ShortReportSection');
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

    knockout.track(this, ['wpsResponseUrl', 'wpsResponse']);
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
        var firstRectangleParameter = this.parameters.filter(function(parameter) { return parameter instanceof RectangleParameter; })[0];
        if (defined(firstRectangleParameter)) {
            var rect = this.parameterValues[firstRectangleParameter.id];
            geojson = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: rectangleToPolygonArray(rect)
                },
                properties: {
                    title: firstRectangleParameter.name,
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

        for (var i = 0; i < outputs.length; ++i) {
            if (!defined(outputs[i].Data)) {
                continue;
            }

            // skip process contexts
            if (defined(outputs[i].Identifier) && outputs[i].Identifier === ".context") {
                continue;
            }

            if (defined(outputs[i].Data.LiteralData)) {
                that.shortReportSections.push(new ShortReportSection({
                    name: outputs[i].Title,
                    content: formatOutputValue(outputs[i].Title, outputs[i].Data.LiteralData)
                }));
            } else if (defined(outputs[i].Data.ComplexData)) {
                var content = outputs[i].Data.ComplexData;
                if (outputs[i].Data.ComplexData.mimeType === "text/csv" || outputs[i].Data.ComplexData.mimeType === "application/json")
                {
                    content = '<collapsible title="' + outputs[i].Title + '" open="' + (i === 0 ? 'true' : 'false') + '">\n\n';
                    content += '<chart data=\'' + outputs[i].Data.ComplexData + '\' styling="histogram"></chart>\n\n';
                }

                that.shortReportSections.push(new ShortReportSection({
                    content: content
                }));
            }
        }

        var inputsSection =
            '<table class="cesium-infoBox-defaultTable">' +
            (that.parameters || []).reduce(function(previousValue, parameter) {
                return previousValue +
                    '<tr>' +
                        '<td style="vertical-align: middle">' + parameter.name + '</td>' +
                        '<td>' + parameter.formatValueAsString(that.parameterValues[parameter.id]) + '</td>' +
                    '</tr>';
            }, '') +
            '</table>';

        var outputsSection =
            '<table class="cesium-infoBox-defaultTable">' +
            (outputs || []).reduce(function(previousValue, output) {
                if (!defined(output.Data) || (!defined(output.Data.LiteralData) && !defined(output.Data.ComplexData))) {
                    return previousValue;
                }
                var content = "";
                if (defined(output.Data.LiteralData)) {
                    content = formatOutputValue(output.Title, output.Data.LiteralData);
                } else if (defined(output.Data.ComplexData)) {
                    if (output.Data.ComplexData.mimeType === "text/csv" || output.Data.ComplexData.mimeType === "application/json")
                    {
                        content = '<chart data=\'' + output.Data.ComplexData + '\' styling: "feature-info">';
                    }
                    // Support other types of ComplexData here as it becomes necessary.
                }

                return previousValue +
                    '<tr>' +
                        '<td style="vertical-align: middle">' + output.Title + '</td>' +
                        '<td>' + content + '</td>' +
                    '</tr>';
            }, '') +
            '</table>';

        var section = that.findInfoSection('Inputs');
        if (!defined(section)) {
            that.info.push({
                name: 'Inputs',
                content: inputsSection
            });
        }

        if (!defined(that.featureInfoTemplate)) {
            that.featureInfoTemplate =
                '#### Inputs\n\n' +
                inputsSection + '\n\n' +
                '#### Outputs\n\n' +
                outputsSection;
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

function formatOutputValue(title, value) {
    if (!defined(value)) {
        return '';
    }

    var values = value.split(',');

    return values.reduce(function(previousValue, currentValue) {
        if (value.match(/[.\/](png|jpg|jpeg|gif|svg)/i)) {
            return previousValue + '<a href="' + currentValue + '"><img src="' + currentValue + '" alt="' + title + '" /></a>';
        } else if (currentValue.indexOf('http:') === 0 || currentValue.indexOf('https:') === 0) {
            var uri = new URI(currentValue);
            return previousValue + '<a href="' + currentValue + '">' + uri.filename() + '</a>';
        } else {
            return previousValue + currentValue;
        }
    }, '');
}

module.exports = WebProcessingServiceCatalogItem;
