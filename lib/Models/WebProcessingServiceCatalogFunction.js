'use strict';

/*global require*/
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');
var LineParameter = require('./LineParameter');
var RectangleParameter = require('./RectangleParameter');
var PolygonParameter = require('./PolygonParameter');
var CatalogFunction = require('./CatalogFunction');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var DateTimeParameter = require('./DateTimeParameter');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var EnumerationParameter = require('./EnumerationParameter');
var StringParameter = require('./StringParameter');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('../Core/loadXML');
var loadWithXhr = require('../Core/loadWithXhr');
var PointParameter = require('./PointParameter');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var runLater = require('../Core/runLater');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');
var TerriaError = require('../Core/TerriaError');
var URI = require('urijs');
var WebProcessingServiceCatalogItem = require('./WebProcessingServiceCatalogItem');
var Reproject = require('../Map/Reproject');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var xml2json = require('../ThirdParty/xml2json');
var Mustache = require('mustache');
var executeWpsTemplate = require('./ExecuteWpsTemplate.xml');
var GeoJsonParameter = require('./GeoJsonParameter');
var RegionTypeParameter = require('./RegionTypeParameter');
var RegionParameter = require('./RegionParameter');

/**
 * A {@link CatalogFunction} that invokes a Web Processing Service (WPS) process.
 *
 * @alias WebProcessingServiceCatalogFunction
 * @constructor
 * @extends CatalogFunction
 *
 * @param {Terria} terria The Terria instance.
 */
function WebProcessingServiceCatalogFunction(terria) {
    CatalogFunction.call(this, terria);

    this._statusSupported = false;
    this._storeSupported = false;

    /**
     * Gets or sets the URL of the WPS server.  This property is observable.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the identifier of this WPS process.  This property is observable.
     * @type {String}
     */
    this.identifier = undefined;

    /**
     * Gets or sets whether to use key value pairs (KVP) embedded in Execute URL, or whether to make a POST request
     * with XML data.
     * @type {Boolean}
     */
    this.executeWithHttpGet = undefined;

    knockout.track(this, ['_parameters', 'url', 'identifier', 'inputs', 'executeWithHttpGet']);
}

inherit(CatalogFunction, WebProcessingServiceCatalogFunction);

defineProperties(WebProcessingServiceCatalogFunction.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf WebProcessingServiceCatalogFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wps';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Processing Service (WPS)'.
     * @memberOf WebProcessingServiceCatalogFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Processing Service (WPS)';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogFunction#invoke} to this process.
     * @memberOf WebProcessingServiceCatalogFunction
     * @type {CatalogFunctionParameters[]}
     */
    parameters : {
        get : function() {
            return this._parameters;
        }
    },
});

/**
 * Gets or sets the list of converters between a WPS Input and a {@link FunctionParameter}.
 * @type {Array}
 */
WebProcessingServiceCatalogFunction.parameterConverters = [
    {
        id: 'LiteralData',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.LiteralData)) {
                return undefined;
            }

            var allowedValues = input.LiteralData.AllowedValues;
            if (defined(input.LiteralData.AllowedValue)) {
                // OGC 05-007r7 Table 29 specifies AllowedValues as name of values for input, not AllowedValue, but for
                // backward compatibility, allow AllowedValue.
                allowedValues = input.LiteralData.AllowedValue;
            }

            if (defined(allowedValues)) {
                var allowed = allowedValues.Value.slice();
                if (typeof allowed  === 'string') {
                    allowed = [allowed];
                }
                return new EnumerationParameter({
                    terria: catalogFunction.terria,
                    catalogFunction: catalogFunction,
                    id: input.Identifier,
                    name: input.Title,
                    description: input.Abstract,
                    possibleValues: allowed,
                    isRequired: (input.minOccurs | 0) > 0
                });
            } else if (defined(input.LiteralData.AnyValue)) {
                return new StringParameter({
                    terria: catalogFunction.terria,
                    catalogFunction: catalogFunction,
                    id: input.Identifier,
                    name: input.Title,
                    description: input.Abstract,
                    isRequired: (input.minOccurs | 0) > 0
                });
            }
            else
            {
                return undefined;
            }
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: value,
                       inputType: 'LiteralData'
                   };
        }
    },
    {
        id: 'DateTime',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.ComplexData) || !defined(input.ComplexData.Default) || !defined(input.ComplexData.Default.Format) || !defined(input.ComplexData.Default.Format.Schema)) {
                return undefined;
            }

            var schema = input.ComplexData.Default.Format.Schema;

            if (schema !== 'http://www.w3.org/TR/xmlschema-2/#dateTime') {
                return undefined;
            }

            return new DateTimeParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputType: 'ComplexData',
                       inputValue: DateTimeParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'PointGeometry',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.ComplexData) || !defined(input.ComplexData.Default) || !defined(input.ComplexData.Default.Format) || !defined(input.ComplexData.Default.Format.Schema)) {
                return undefined;
            }

            var schema = input.ComplexData.Default.Format.Schema;
            if (schema.indexOf('http://geojson.org/geojson-spec.html#') !== 0) {
                return undefined;
            }

            if (schema.substring(schema.lastIndexOf('#') + 1) !== 'point') {
                return undefined;
            }

            return new PointParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputType: 'ComplexData',
                       inputValue: PointParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'LineGeometry',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.ComplexData) || !defined(input.ComplexData.Default) || !defined(input.ComplexData.Default.Format) || !defined(input.ComplexData.Default.Format.Schema)) {
                return undefined;
            }

            var schema = input.ComplexData.Default.Format.Schema;
            if (schema.indexOf('http://geojson.org/geojson-spec.html#') !== 0) {
                return undefined;
            }

            if (schema.substring(schema.lastIndexOf('#') + 1) !== 'linestring') {
                return undefined;
            }

            return new LineParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputType: 'ComplexData',
                       inputValue: LineParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'PolygonGeometry',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.ComplexData) || !defined(input.ComplexData.Default) || !defined(input.ComplexData.Default.Format) || !defined(input.ComplexData.Default.Format.Schema)) {
                return undefined;
            }

            var schema = input.ComplexData.Default.Format.Schema;
            if (schema.indexOf('http://geojson.org/geojson-spec.html#') !== 0) {
                return undefined;
            }

            if (schema.substring(schema.lastIndexOf('#') + 1) !== 'polygon') {
                return undefined;
            }

            return new PolygonParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputType: 'ComplexData',
                       inputValue: PolygonParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'RectangleGeometry',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.BoundingBoxData) || !defined(input.BoundingBoxData.Default) || !defined(input.BoundingBoxData.Default.CRS)) {
                return undefined;
            }
            var code = Reproject.crsStringToCode(input.BoundingBoxData.Default.CRS);
            var usedCrs = input.BoundingBoxData.Default.CRS;
            // Find out if Terria's CRS is supported.
            if (code !== Reproject.TERRIA_CRS) {
                for (var i=0; i<input.BoundingBoxData.Supported.CRS.length; i++) {
                    if (Reproject.crsStringToCode(input.BoundingBoxData.Supported.CRS[i]) === Reproject.TERRIA_CRS) {
                        code = Reproject.TERRIA_CRS;
                        usedCrs = input.BoundingBoxData.Supported.CRS[i];
                        break;
                    }
                }
            }
            // We are currently only supporting Terria's CRS, because if we reproject we don't know the URI or whether
            // the bounding box order is lat-long or long-lat.
            if (!defined(code)) {
                return undefined;
            }

            return new RectangleParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0,
                crs: usedCrs
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            var bboxMinCoord1, bboxMinCoord2, bboxMaxCoord1, bboxMaxCoord2, urn;
            // We only support CRS84 and EPSG:4326
            if (parameter.crs.indexOf('crs84') !== -1) {
                // CRS84 uses long, lat rather that lat, long order.
                bboxMinCoord1 = CesiumMath.toDegrees(value.west);
                bboxMinCoord2 = CesiumMath.toDegrees(value.south);
                bboxMaxCoord1 = CesiumMath.toDegrees(value.east);
                bboxMaxCoord2 = CesiumMath.toDegrees(value.north);
                // Comfortingly known as WGS 84 longitude-latitude according to Table 3 in OGC 07-092r1.
                urn = 'urn:ogc:def:crs:OGC:1.3:CRS84';

            } else {
                // The URN value urn:ogc:def:crs:EPSG:6.6:4326 shall mean the Coordinate Reference System (CRS) with code
                // 4326 specified in version 6.6 of the EPSG database available at http://www.epsg.org/. That CRS specifies
                // the axis order as Latitude followed by Longitude.
                // We don't know about other URN versions, so are going to return 6.6 regardless of what was requested.
                bboxMinCoord1 = CesiumMath.toDegrees(value.south);
                bboxMinCoord2 = CesiumMath.toDegrees(value.west);
                bboxMaxCoord1 = CesiumMath.toDegrees(value.north);
                bboxMaxCoord2 = CesiumMath.toDegrees(value.east);
                urn = 'urn:ogc:def:crs:EPSG:6.6:4326';
            }

            return {
                       inputType: 'BoundingBoxData',
                       inputValue: bboxMinCoord1 + ',' + bboxMinCoord2 + ',' + bboxMaxCoord1 + ',' + bboxMaxCoord2 + ',' + urn
                   };
        }
    },
    {
         id: 'GeoJsonGeometry',
         inputToFunctionParameter: function(catalogFunction, input) {
             if (!defined(input.ComplexData) || !defined(input.ComplexData.Default) || !defined(input.ComplexData.Default.Format) || !defined(input.ComplexData.Default.Format.Schema)) {
                 return undefined;
             }

             var schema = input.ComplexData.Default.Format.Schema;
             if (schema.indexOf('http://geojson.org/geojson-spec.html#') === 0 && schema.indexOf('http://geojson.org/geojson-spec.html') !== 0) {
                 return undefined;
             }

             var regionTypeParameter = new RegionTypeParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: 'regionType',
                name: 'Region Type',
                description: 'The type of region to analyze.'
             });

             var regionParameter = new RegionParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: 'regionParameter',
                name: 'Region Parameter',
                regionProvider: regionTypeParameter
             });

             return new GeoJsonParameter({
                 terria: catalogFunction.terria,
                 catalogFunction: catalogFunction,
                 id: input.Identifier,
                 name: input.Title,
                 description: input.Abstract,
                 isRequired: (input.minOccurs | 0) > 0,
                 regionParameter: regionParameter
             });
         },
         functionParameterToInput: function(catalogFunction, parameter, value) {
             return parameter.getProcessedValue(value);
         }
    }
   ];

WebProcessingServiceCatalogFunction.prototype._load = function() {
    var uri = new URI(this.url).query({
        service: 'WPS',
        request: 'DescribeProcess',
        version: '1.0.0',
        Identifier: this.identifier
    });

    var url = proxyCatalogItemUrl(this, uri.toString(), '1d');

    var that = this;
    return loadXML(url).then(function(xml) {
        // Is this really a DescribeProcess response?
        if (!xml || !xml.documentElement || (xml.documentElement.localName !== 'ProcessDescriptions')) {
            throw new TerriaError({
                    title: 'Invalid WPS server',
                    message: '\
An error occurred while invoking DescribeProcess on the WPS server for process name '+that.name+'.  The server\'s response does not appear to be a valid DescribeProcess document.  \
<p>This error may also indicate that the processing server you specified is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the processing server again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
            });
        }

        var json = xml2json(xml);

        if (!defined(json.ProcessDescription)) {
            throw new TerriaError({
                sender: that,
                title: 'Process does not have a process description',
                message: 'The WPS DescribeProcess for this process does not include a ProcessDescription.'
            });
        }

        that._storeSupported = json.ProcessDescription.storeSupported === 'true';
        that._statusSupported = json.ProcessDescription.statusSupported === 'true';

        function throwNoInputs() {
            throw new TerriaError({
                sender: that,
                title: 'Process does not have any inputs',
                message: 'This WPS process does not specify any inputs.'
            });
        }

        var dataInputs = json.ProcessDescription.DataInputs;
        if (!defined(dataInputs)) {
            throwNoInputs();
        }

        var inputs = dataInputs.Input;
        if (!defined(inputs)) {
            throwNoInputs();
        }

        if (!Array.isArray(inputs)) {
            inputs = [inputs];
        }

        that._parameters = inputs.map(createParameterFromWpsInput.bind(undefined, that));
    });
};

/**
 * Invoke the WPS function with the provided parameterValues.
 * @return {Promise}
 */
WebProcessingServiceCatalogFunction.prototype.invoke = function() {
    var now = new Date();
    var timestamp = sprintf('%04d-%02d-%02dT%02d:%02d:%02d', now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

    var asyncResult = new ResultPendingCatalogItem(this.terria);
    asyncResult.name = this.name + ' ' + timestamp;
    asyncResult.description = 'This is the result of invoking the ' + this.name + ' process or service at ' + timestamp + ' with the input parameters below.';

    var inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        (this.parameters || []).reduce(function(previousValue, parameter) {
            return previousValue +
                '<tr>' +
                    '<td style="vertical-align: middle">' + parameter.name + '</td>' +
                    '<td>' + parameter.formatValueAsString(parameter.value) + '</td>' +
                '</tr>';
        }, '') +
        '</table>';

    asyncResult.info.push({
        name: 'Inputs',
        content: inputsSection
    });

    var that = this;
    when.all(createWpsDataInputsFromParameters(this)).then(function(dataInputs) {
        var proxyCacheDuration = '1d';
        var promise;
        if (that.executeWithHttpGet) {
            promise = loadResponseWithKvp(that, dataInputs, asyncResult, proxyCacheDuration);
        } else {
            promise = loadResponse(that, dataInputs, asyncResult, proxyCacheDuration);
        }

        asyncResult.loadPromise = promise;
        asyncResult.isEnabled = true;

        return promise;
    });
};

function loadResponseWithKvp(that, dataInputs, asyncResult, proxyCacheDuration) {
    dataInputs = dataInputs.join(";");
    var uri = new URI(that.url).query({
        service: 'WPS',
        request: 'Execute',
        version: '1.0.0',
        Identifier: that.identifier,
        DataInputs: dataInputs
    });
    if (that._statusSupported) {
        uri.addQuery('status', true);
    }

    if (that._storeSupported) {
        uri.addQuery('storeExecuteResponse', true);
    }
    var url = proxyCatalogItemUrl(that, uri.toString(), proxyCacheDuration);
    var parameterValues = that.getParameterValues();
    var promise = loadXML(url).then(function(xml) {
        return handleExecuteResponse(that, parameterValues, asyncResult, xml);
    });
    return promise;
}

function loadResponse(that, dataInputs, asyncResult, proxyCacheDuration) {
    var parameters = {identifier: htmlEscapeText(that.identifier),
                      storeExecuteResponse: that._storeSupported,
                      status: that._statusSupported,
                      dataInputs: dataInputs};
    var xmlInput = Mustache.render(executeWpsTemplate, parameters);
    var uri = new URI(that.url).query({
        service: 'WPS',
        request: 'Execute'
    });
    var url = proxyCatalogItemUrl(that, uri.toString(), proxyCacheDuration);
    var parameterValues = that.getParameterValues();
    var promise = loadWithXhr({
        url: url,
        method: 'POST',
        data: xmlInput,
        overrideMimeType: 'text/xml',
        responseType: 'document'
    }).then(function(xml) {
        return handleExecuteResponse(that, parameterValues, asyncResult, xml);
    });
    return promise;
}

function createParameterFromWpsInput(catalogFunction, input) {
    for (var i = 0; i < WebProcessingServiceCatalogFunction.parameterConverters.length; ++i) {
        var converter = WebProcessingServiceCatalogFunction.parameterConverters[i];
        var functionParameter = converter.inputToFunctionParameter(catalogFunction, input);
        if (defined(functionParameter)) {
            functionParameter.converter = converter;
            return functionParameter;
        }
    }

    throw new TerriaError({
        sender: catalogFunction,
        title: 'Unsupported parameter type',
        message: 'The parameter ' + input.Identifier + ' is not a supported type of parameter.'
    });
}

function htmlEscapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createWpsDataInputsFromParameters(catalogFunction) {
    return catalogFunction.parameters.map(function(parameter) {
        var value = parameter.value;
        if (!defined(value) || value === '') {
            return undefined;
        }

        var processedValue = parameter.converter.functionParameterToInput(catalogFunction, parameter, value);
        return when(processedValue.inputValue).then(function(inputValue) {
            if (!defined(inputValue) || inputValue === '') {
                return undefined;
            }
            if (catalogFunction.executeWithHttpGet) {
                return parameter.id + '=' + inputValue;
            } else {
                var dataInputObj = {
                    inputIdentifier: htmlEscapeText(parameter.id),
                    inputValue: htmlEscapeText(inputValue),
                    inputType: htmlEscapeText(processedValue.inputType)
                };
                return dataInputObj;
            }
        });
    }).filter(function(convertedParameter) {
        return defined(convertedParameter);
    });
}

function handleExecuteResponse(catalogFunction, parameterValues, asyncResult, xmlResponse) {
    if (!xmlResponse || !xmlResponse.documentElement || (xmlResponse.documentElement.localName !== 'ExecuteResponse')) {
        throw new TerriaError({
            sender: catalogFunction,
            title: 'Invalid WPS server response',
            message: '\
An error occurred while accessing the status location on the WPS server for process name '+catalogFunction.name+'.  The server\'s response does not appear to be a valid ExecuteResponse document.  \
<p>This error may also indicate that the processing server you specified is temporarily unavailable or there is a \
problem with your internet connection.  If the problem persists, please report it by \
sending an email to <a href="mailto:'+catalogFunction.terria.supportEmail+'">'+catalogFunction.terria.supportEmail+'</a>.</p>'
        });
    }

    var json = xml2json(xmlResponse);

    var status = json.Status;
    if (!defined(status)) {
        throw new TerriaError({
            sender: catalogFunction,
            title: 'Invalid response from WPS server',
            message: 'The response from the WPS server does not include a Status element.'
        });
    }

    if (defined(status.ProcessFailed)) {
        var errorMessage = 'The reason for failure is unknown.';
        if (defined(status.ProcessFailed.ExceptionReport) && defined(status.ProcessFailed.ExceptionReport.Exception)) {
            if (defined(status.ProcessFailed.ExceptionReport.Exception.ExceptionText)) {
                errorMessage = status.ProcessFailed.ExceptionReport.Exception.ExceptionText;
            } else if (defined(status.ProcessFailed.ExceptionReport.Exception.Exception)) {
                errorMessage = status.ProcessFailed.ExceptionReport.Exception.Exception;
            }
        }

        asyncResult.isFailed = true;
        asyncResult.shortReport = 'Web Processing Service invocation failed.  More details are available on the Info panel.';
        asyncResult.moreFailureDetailsAvailable = true;
        asyncResult.info.push({
            name: 'Error Details',
            content: errorMessage
        });
    } else if (defined(status.ProcessSucceeded)) {
        var resultCatalogItem = new WebProcessingServiceCatalogItem(catalogFunction.terria);
        resultCatalogItem.name = asyncResult.name;
        resultCatalogItem.description = asyncResult.description;
        resultCatalogItem.parameters = catalogFunction.parameters;
        resultCatalogItem.parameterValues = parameterValues;
        resultCatalogItem.wpsResponseUrl = json.statusLocation;
        resultCatalogItem.wpsResponse = json;
        resultCatalogItem.dataUrl = json.statusLocation;
        // make this clickable if an absolute url path is returned
        if (json.statusLocation.indexOf('/') === 0) {
            resultCatalogItem.dataUrl = catalogFunction.url.substr(0, catalogFunction.url.lastIndexOf('/')) + json.statusLocation;
        }
        asyncResult.isEnabled = false;
        resultCatalogItem.isEnabled = true;
    } else if (defined(json.statusLocation) && asyncResult.isEnabled) {
        // Continue polling the status location, waiting 500ms between each response and the next request.
        return runLater(function() {
            return loadXML(proxyCatalogItemUrl(catalogFunction, json.statusLocation, '1d')).then(function(xml) {
                return handleExecuteResponse(catalogFunction, parameterValues, asyncResult, xml);
            });
        }, 500);
    }
}

module.exports = WebProcessingServiceCatalogFunction;
