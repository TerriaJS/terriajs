'use strict';

/*global require*/
var AsyncFunctionResultCatalogItem = require('./AsyncFunctionResultCatalogItem');
var RectangleParameter = require('./RectangleParameter');
var CatalogFunction = require('./CatalogFunction');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var DateTimeParameter = require('./DateTimeParameter');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var EnumerationParameter = require('./EnumerationParameter');
var StringParameter = require('./StringParameter');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var PointParameter = require('./PointParameter');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var rectangleToPolygonArray = require('../Core/rectangleToPolygonArray');
var runLater = require('../Core/runLater');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');
var TerriaError = require('../Core/TerriaError');
var URI = require('urijs');
var WebProcessingServiceCatalogItem = require('./WebProcessingServiceCatalogItem');
var xml2json = require('../ThirdParty/xml2json');

function WebProcessingServiceCatalogFunction(terria) {
    CatalogFunction.call(this, terria);

    this._parameters = [];
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

    knockout.track(this, ['_parameters', 'url', 'identifier', 'inputs']);
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

            if (defined(input.LiteralData.AllowedValue)) {
                return new EnumerationParameter({
                    terria: catalogFunction.terria,
                    id: input.Identifier,
                    name: input.Title,
                    description: input.Abstract,
                    possibleValues: input.LiteralData.AllowedValue.Value.slice(),
                    isRequired: (input.minOccurs | 0) > 0
                });
            } else if (defined(input.LiteralData.AnyValue)) {
                return new StringParameter({
                    terria: catalogFunction.terria,
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
            if (!defined(value) || value === '') {
                return undefined;
            }
            return parameter.id + '=' + value;
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
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            if (!defined(value) || value === '') {
                return undefined;
            }
            return parameter.id + '=' + JSON.stringify({
                type: 'object',
                properties: {
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        'date-time': value
                    }
                }
            });
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
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            if (!defined(value) || value === '') {
                return undefined;
            }

            var coordinates = [
                CesiumMath.toDegrees(value.longitude),
                CesiumMath.toDegrees(value.latitude),
            ];

            if (defined(value.height)) {
                coordinates.push(value.height);
            }

            return parameter.id + '=' + JSON.stringify({
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': coordinates
                        }
                    }
                ]
            });
        }
    },
    {
        id: 'RectangleGeometry',
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

            return new RectangleParameter({
                terria: catalogFunction.terria,
                id: input.Identifier,
                name: input.Title,
                description: input.Abstract,
                isRequired: (input.minOccurs | 0) > 0
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            if (!defined(value) || value === '') {
                return undefined;
            }

            return parameter.id + '=' + JSON.stringify({
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': rectangleToPolygonArray(value)
                        }
                    }
                ]
            });
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

WebProcessingServiceCatalogFunction.prototype.invoke = function(parameters) {
    var now = new Date();
    var timestamp = sprintf("%04d-%02d-%02dT%02d:%02d:%02d", now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

    var asyncResult = new AsyncFunctionResultCatalogItem(this.terria);
    asyncResult.name = this.name + ' ' + timestamp;
    asyncResult.description = 'This is the result of invoking the ' + this.name + ' process or service at ' + timestamp + ' with the input parameters below.';

    var inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        (this.parameters || []).reduce(function(previousValue, parameter) {
            return previousValue +
                '<tr>' +
                    '<td style="vertical-align: middle">' + parameter.name + '</td>' +
                    '<td>' + parameter.formatValueAsString(parameters[parameter.id]) + '</td>' +
                '</tr>';
        }, '') +
        '</table>';

    asyncResult.info.push({
        name: 'Inputs',
        content: inputsSection
    });

    var uri = new URI(this.url).query({
        service: 'WPS',
        request: 'Execute',
        version: '1.0.0',
        Identifier: this.identifier,
        DataInputs: createWpsDataInputsFromParameters(this, parameters)
    });

    if (this._statusSupported) {
        uri.addQuery('status', true);
    }

    if (this._storeSupported) {
        uri.addQuery('storeExecuteResponse', true);
    }

    var url = proxyCatalogItemUrl(this, uri.toString(), '1d');

    var that = this;
    var promise = loadXML(url).then(function(xml) {
        return handleExecuteResponse(that, parameters, asyncResult, xml);
    });

    asyncResult.loadPromise = promise;
    asyncResult.isEnabled = true;

    return promise;
};

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

function createWpsDataInputsFromParameters(catalogFunction, parameters) {
    return catalogFunction.parameters.map(function(parameter) {
        var value = parameters[parameter.id];
        return parameter.converter.functionParameterToInput(catalogFunction, parameter, value);
    }).filter(function(convertedParameter) {
        return defined(convertedParameter);
    }).join(';');
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
        var errorMessage = "The reason for failure is unknown.";
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
