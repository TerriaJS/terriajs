'use strict';

/*global require*/
var CatalogFunction = require('./CatalogFunction');
var DateTimeParameter = require('./DateTimeParameter');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var EnumerationParameter = require('./EnumerationParameter');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var PointParameter = require('./PointParameter');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var TerriaError = require('../Core/TerriaError');
var URI = require('urijs');
var xml2json = require('../ThirdParty/xml2json');

function WebProcessingServiceCatalogFunction(terria) {
    CatalogFunction.call(this, terria);

    this._parameters = [];

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
    // LiteralData -> EnumerationParameter
    {
        id: 'LiteralData',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.LiteralData)) {
                return undefined;
            }

            return new EnumerationParameter({
                terria: catalogFunction.terria,
                id: input.Identifier,
                name: input.Title,
                possibleValues: input.LiteralData.AllowedValue.Value.slice()
            });
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
                name: input.Title
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
                name: input.Title
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            if (!defined(value) || value === '') {
                return undefined;
            }

            var coordPairs = value.split(' ');
            var coords = [];

            for (var i = 0; i < coordPairs.length; i++) {
                var coordPair = coordPairs[i].split(',');
                coords.push(coordPair);
            }

            return parameter.id + '=' + JSON.stringify({
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': coords[0]
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
    var uri = new URI(this.url).query({
        service: 'WPS',
        request: 'Execute',
        version: '1.0.0',
        Identifier: this.identifier,
        DataInputs: createWpsDataInputsFromParameters(this, parameters)
    });

    var url = proxyCatalogItemUrl(this, uri.toString(), '1d');

    var that = this;
    return loadXML(url).then(function(xml) {
        // Is this really an ExecuteProcess response?
        if (!xml || !xml.documentElement || (xml.documentElement.localName !== 'ExecuteResponse')) {
            throw new TerriaError({
                sender: that,
                title: 'Invalid WPS server',
                message: '\
An error occurred while invoking ExecuteProcess on the WPS server for process name '+that.name+'.  The server\'s response does not appear to be a valid ExecuteProcess document.  \
<p>This error may also indicate that the processing server you specified is temporarily unavailable or there is a \
problem with your internet connection.  If the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
            });
        }

        var json = xml2json(xml);
        console.log(json);
    });
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

module.exports = WebProcessingServiceCatalogFunction;
