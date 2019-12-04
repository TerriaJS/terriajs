"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

var LineParameter = require("./LineParameter");
var RectangleParameter = require("./RectangleParameter");
var PolygonParameter = require("./PolygonParameter");
var DateTimeParameter = require("./DateTimeParameter");
var EnumerationParameter = require("./EnumerationParameter");
var StringParameter = require("./StringParameter");
var PointParameter = require("./PointParameter");
var BooleanParameter = require("./BooleanParameter");
var BooleanParameterGroup = require("./BooleanParameterGroup");

var mapping = {
  [StringParameter.prototype.type]: StringParameter,
  [EnumerationParameter.prototype.type]: EnumerationParameter,
  [BooleanParameter.prototype.type]: BooleanParameter,
  [BooleanParameterGroup.prototype.type]: BooleanParameterGroup,
  [DateTimeParameter.prototype.type]: DateTimeParameter,
  [PointParameter.prototype.type]: PointParameter,
  [LineParameter.prototype.type]: LineParameter,
  [PolygonParameter.prototype.type]: PolygonParameter,
  [RectangleParameter.prototype.type]: RectangleParameter
};

/**
 * Creates a type derived from {@link FunctionParameter} based on a given type string.
 *
 * @param {String} type The derived type name.
 * @param {Object} options Options to pass to the constructor.
 */
var createParameterFromType = function(type, options) {
  var Constructor = mapping[type];
  if (!defined(Constructor)) {
    throw new TerriaError({
      title: i18next.t("models.createParameter.unsupportedErrorTitle"),
      message: i18next.t("models.createParameter.unsupportedErrorMessage", {
        type: type
      })
    });
  }

  return new Constructor(options);
};

/**
 * Registers a constructor for a given type of {@link FunctionParameter}.
 *
 * @param {String} type The type name for which to register a constructor.
 * @param {Function} constructor The constructor for function parameters of this type.  The constructor is expected to take an options
 *                   object as its first and only parameter.
 */
createParameterFromType.register = function(type, constructor) {
  mapping[type] = constructor;
};

module.exports = createParameterFromType;
