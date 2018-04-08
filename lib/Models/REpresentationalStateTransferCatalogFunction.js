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
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var PointParameter = require('./PointParameter');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');
var TerriaError = require('../Core/TerriaError');
var URI = require('urijs');
var Reproject = require('../Map/Reproject');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var knockout  = require('terriajs-cesium/Source/ThirdParty/knockout');
var BooleanParameter = require('./BooleanParameter');

/**
 * A {@link CatalogFunction} that invokes a Representational State Transfer (REST) process.
 *
 * @alias REpresentationalStateTransferCatalogFunction
 * @constructor
 * @extends CatalogFunction
 *
 * @param {Terria} terria The Terria instance.
 */
function REpresentationalStateTransferCatalogFunction(terria) {
    CatalogFunction.call(this, terria);

    /**
     * Gets or sets the URL of the REST server.  This property is observable.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the identifier of this REST process.  This property is observable.
     * @type {String}
     */
    this.identifier = undefined;

    /**
     * Gets or sets whether to use key value pairs (KVP) embedded in Execute URL, or whether to make a POST request
     * with XML data.
     * @type {Boolean}
     */
    this.executeWithHttpGet = true;

    /**
     *Gets or sets the input parameters defined as a set of {@link FunctionParameter} objects. 
     *@type {Object}
     */
    this.input = undefined;
    knockout.track(this,['_parameters','url','input']);
    //knockout.track(this, ['_parameters', 'url', 'inputs', 'executeWithHttpGet']);
}

inherit(CatalogFunction, REpresentationalStateTransferCatalogFunction);

defineProperties(REpresentationalStateTransferCatalogFunction.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf REpresentationalStateTransferCatalogFunction.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'rest';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Representational State Transfer (REST)'.
     * @memberOf REpresentationalStateTransferCatalogFunction.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Representational State Transfer (REST)';
        }
    },

    /**
     * Gets the parameters used to {@link CatalogFunction#invoke} to this process.
     * @memberOf REpresentationalStateTransferCatalogFunction
     * @type {CatalogFunctionParameters[]}
     */
    parameters : {
        get : function() {
            return this._parameters;
        }
    },

});

/**
 * Gets or sets the list of converters between a REST Input and a {@link FunctionParameter}.
 * @type {Array}
 */
REpresentationalStateTransferCatalogFunction.parameterConverters = [
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
        id: 'Checkbox',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.Checkbox)) {
                return undefined;
            }
            return new BooleanParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.Identifier,
                description: input.Abstract,
                name: input.Identifier,
                hasNamedStates: false,
                defaultValue: false
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: value,
                       inputType: 'Checkbox'
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
    }
   ];

REpresentationalStateTransferCatalogFunction.prototype._load = function() {
    var inputs = this.input;
    if (!Array.isArray(inputs)) {
        inputs = [inputs];
    }
    this._parameters = inputs.map(createParameterFromRestInput.bind(undefined, this));
};

/**
 * Invoke the REST function with the provided parameterValues.
 * @return {Promise}
 */
REpresentationalStateTransferCatalogFunction.prototype.invoke = function() {
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
    when.all(createRestDataInputsFromParameters(this)).then(function(dataInputs) {
        var proxyCacheDuration = '1d';
        var promise;
        if (that.executeWithHttpGet) {
            promise = loadResponseWithKvp(that, dataInputs, asyncResult, proxyCacheDuration);
        } else {
		//only GET for now
            //promise = loadResponse(that, dataInputs, asyncResult, proxyCacheDuration);
        }

        asyncResult.loadPromise = promise;
        asyncResult.isEnabled = true;

        return promise;
    });
};

function loadResponseWithKvp(that, dataInputs, asyncResult, proxyCacheDuration) {
    dataInputs = dataInputs.join("&");
    var uri = new URI(that.url).query({
        DataInputs: dataInputs
    });
    var url = proxyCatalogItemUrl(that, uri.toString(), proxyCacheDuration);
    var promise = loadJson(url).then(function(json) {
          json.catalog[0].name = asyncResult.name;
          json.catalog[0].info = asyncResult.info;
          json.catalog[0].description = asyncResult.description;
          json.catalog[0].isEnabled = true;
          json.catalog[0].isMappable = true;
          //console.log(json);
          asyncResult.isEnabled = false;
          return that.terria.addInitSource(json);
    });
    return promise;
}


/*
 * HTTP post method for potential implementation and testing
function loadResponse(that, dataInputs, asyncResult, proxyCacheDuration) {
    var parameters = {identifier: htmlEscapeText(that.identifier),
                      storeExecuteResponse: that._storeSupported,
                      status: that._statusSupported,
                      dataInputs: dataInputs};
    var xmlInput = Mustache.render(executeWpsTemplate, parameters);
    var uri = new URI(that.url);
    var url = proxyCatalogItemUrl(that, uri.toString(), proxyCacheDuration);
    var parameterValues = that.getParameterValues();
    var promise = loadWithXhr({
        url: url,
        method: 'POST',
        data: xmlInput,
        overrideMimeType: 'text/xml',
        responseType: 'document'
    }).then(function(resp) {
        return loadJson(resp).then(function(json){
            json.catalog[0].name = asyncResult.name;
            json.catalog[0].info = asyncResult.info;
            json.catalog[0].description = asyncResult.description;
            json.catalog[0].isEnabled = true;
            json.catalog[0].isMappable = true;
            asyncResult.isEnabled = false;
            return that.terria.addInitSource(json);
        });
    });
    return promise;
}
*/

function createParameterFromRestInput(catalogFunction, input) {
    for (var i = 0; i < REpresentationalStateTransferCatalogFunction.parameterConverters.length; ++i) {
        var converter = REpresentationalStateTransferCatalogFunction.parameterConverters[i];
        var functionParameter = converter.inputToFunctionParameter(catalogFunction, input);
        if (defined(functionParameter)) {
            functionParameter.converter = converter;
            return functionParameter;
        }
    }

    throw new TerriaError({
        sender: catalogFunction,
        title: 'Unsupported parameter type',
        message: 'The parameter ' + input.Identifier + ' is not a supported type of parameter. Full input is ' +JSON.stringify(input)
    });
}


function htmlEscapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createRestDataInputsFromParameters(catalogFunction) {
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

module.exports = REpresentationalStateTransferCatalogFunction;
