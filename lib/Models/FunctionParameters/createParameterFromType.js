"use strict";

import { defined } from "cesium";
var TerriaError = require("../../Core/TerriaError").default;
import i18next from "i18next";

import LineParameter from "./LineParameter";
import RectangleParameter from "./RectangleParameter";
import PolygonParameter from "./PolygonParameter";
import DateTimeParameter from "./DateTimeParameter";
import EnumerationParameter from "./EnumerationParameter";
import StringParameter from "./StringParameter";
import PointParameter from "./PointParameter";
import BooleanParameter from "./BooleanParameter";
import BooleanParameterGroup from "./BooleanParameterGroup";

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
var createParameterFromType = function (type, options) {
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
createParameterFromType.register = function (type, constructor) {
  mapping[type] = constructor;
};

export default createParameterFromType;
