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
     *Gets or sets the input parameters defined as a set of {@link FunctionParameter} objects. 
     *@type {Object}
     */
    this.input = undefined;
    knockout.track(this,['_parameters','url','input']);
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
        id: 'EnumerationParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.EnumerationParameter)) {
                return undefined;
            }
            return new EnumerationParameter({
                    terria: catalogFunction.terria,
                    catalogFunction: catalogFunction,
                    id: input.EnumerationParameter.id,
                    name: input.EnumerationParameter.name,
                    description: input.EnumerationParameter.description,
                    possibleValues: input.EnumerationParameter.possibleValues,
                    isRequired: input.EnumerationParameter.isRequired
                });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: value
                   };
        }
    },
    {
        id: 'StringParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.StringParameter)) {
                return undefined;
            }
             return new StringParameter({
                    terria: catalogFunction.terria,
                    catalogFunction: catalogFunction,
                    id: input.StringParameter.id,
                    name: input.StringParameter.name,
                    description: input.StringParameter.description,
                    isRequired: input.StringParameter.isRequired
                });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: value
                   };
        }
    },
    {
        id: 'BooleanParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.BooleanParameter)) {
                return undefined;
            }
            return new BooleanParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.BooleanParameter.id,
                description: input.BooleanParameter.description,
                name: input.BooleanParameter.name,
                hasNamedStates: false,
                defaultValue: false
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: value
                   };
        }
    },
    {
        id: 'DateTimeParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.DateTimeParameter)) {
                return undefined;
            }
            return new DateTimeParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.DateTimeParameter.id,
                name: input.DateTimeParameter.name,
                description: input.DateTimeParameter.description,
                isRequired: input.DateTimeParameter.isRequired
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: DateTimeParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'PointParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.PointParameter)) {
                return undefined;
            }
            return new PointParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.PointParameter.id,
                name: input.PointParameter.name,
                description: input.PointParameter.description,
                isRequired: input.PointParameter.isRequired
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: PointParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'LineParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.LineParameter)) {
                return undefined;
            }
            return new LineParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.LineParameter.id,
                name: input.LineParameter.name,
                description: input.LineParameter.description,
                isRequired: input.LineParameter.isRequired
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: LineParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'PolygonParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.PolygonParameter)) {
                return undefined;
            }
            return new PolygonParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.PolygonParameter.id,
                name: input.PolygonParameter.name,
                description: input.PolygonParameter.description,
                isRequired: input.PolygonParameter.isRequired
            });
        },
        functionParameterToInput: function(catalogFunction, parameter, value) {
            return {
                       inputValue: PolygonParameter.formatValueForUrl(value)
                   };
        }
    },
    {
        id: 'RectangleParameter',
        inputToFunctionParameter: function(catalogFunction, input) {
            if (!defined(input.RectangleParameter)) {
                return undefined;
            }
            return new RectangleParameter({
                terria: catalogFunction.terria,
                catalogFunction: catalogFunction,
                id: input.RectangleParameter.id,
                name: input.RectangleParameter.name,
                description: input.RectangleParameter.description,
                isRequired: input.RectangleParameter.isRequired
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
                       inputValue: bboxMinCoord1 + ',' + bboxMinCoord2 + ',' + bboxMaxCoord1 + ',' + bboxMaxCoord2 + ',' + urn
                   };
        }
    }
   ];


REpresentationalStateTransferCatalogFunction.prototype._load = function() {
    var inputs = this.input;
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
        (this._parameters || []).reduce(function(previousValue, parameter) {
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
        promise = loadResponseWithKvp(that, dataInputs, asyncResult, proxyCacheDuration);
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
          console.log(json);
          asyncResult.isEnabled = false;
          return that.terria.addInitSource(json);
    });
    return promise;
}


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
            return parameter.id + '=' + inputValue;
        });
    }).filter(function(convertedParameter) {
        return defined(convertedParameter);
    });
}

module.exports = REpresentationalStateTransferCatalogFunction;
