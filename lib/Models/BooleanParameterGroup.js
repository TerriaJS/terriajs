"use strict";

/*global require*/

var BooleanParameter = require("./BooleanParameter");
var FunctionParameter = require("./FunctionParameter");
var inherit = require("../Core/inherit");

/**
 * A catalog input type that groups Boolean Parameters for a category.
 *
 * @alias BooleanParameterGroup
 * @constructor
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {Boolean} [options.allValue] Whether or not to have {id: OneForAll.id, value: OneForAll.value} in this.value
 * @param {Boolean} [options.allCascade] Whether OneForAll being true passes all {id: ParameterList.id, value: true} values through to this.value
 * @param {BooleanParameter} [options.OneForAll] A Boolean Parameter that checks and disables the BooleanParameters in the ParameterList when checked, and unchecks and enables them when unchecked. Used to send one option for the entire category/have one option click/reset all options in the category
 * @param {BooleanParameter[]} [options.ParameterList] An array of Boolean Parameters that belong to a category
 */

var BooleanParameterGroup = function(options) {
  /*
   * OneForAll and ParameterList can't be specified directly becase they get
   * infinite recursion issues when getting.
   * ES6 has Proxy objects, which should work as a neater way of indirectly
   * manipulating variables than having public get and set for private
   * properties, and as long as Proxy objects count as existing members,
   * dont have to change lib/Core/updateFromJson
   */
  this.OneForAll = new Proxy({}, {});
  this.ParameterList = new Proxy([], {});
  this.allValue = true;
  this.allCascade = false;
  FunctionParameter.call(this, options);
  Object.defineProperty(this, "value", {
    get: function() {
      return this.getValue();
    }
  });
  Object.defineProperty(this, "_value", {
    get: function() {
      return this.getValue();
    }
  });
};

BooleanParameterGroup.AvailableFormatters = {
  default: formatAsArrayOfObjects,
  groupIsOpaque: formatAsStringOfKeyEqualsBoolean,
  groupIsTransparent: formatAsArrayOfObjects
};

function formatAsArrayOfObjects(value) {
  return value;
}

function formatAsStringOfKeyEqualsBoolean(value) {
  return value.map(param => param.id + "=" + param.value.toString()).join("&");
}

function makeBooleanEditorFromJson(object, inTerria, inCatalogFunction) {
  if (!isEmpty(object) && object.id) {
    object.terria = inTerria; //BooleanParameter needs terria
    object.catalogFunction = inCatalogFunction; //BooleanParameter belongs to the same catalogFunction
    return new BooleanParameter(object);
  }
  return {};
}

function makeBooleanEditorArrayFromJson(
  objectArray,
  inTerria,
  inCatalogFunction
) {
  var ParameterObjects = [];
  if (typeof objectArray !== "undefined" && objectArray.length > 0) {
    objectArray.forEach(function(object) {
      ParameterObjects.push(
        makeBooleanEditorFromJson(object, inTerria, inCatalogFunction)
      );
    });
  }
  return ParameterObjects;
}

inherit(FunctionParameter, BooleanParameterGroup);

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

BooleanParameterGroup.defaultUpdaters = {};

BooleanParameterGroup.defaultUpdaters.OneForAll = function(
  functionParameter,
  json,
  propertyName,
  options
) {
  functionParameter.OneForAll = makeBooleanEditorFromJson(
    json[propertyName],
    functionParameter.terria,
    functionParameter.catalogFunction
  );
};

BooleanParameterGroup.defaultUpdaters.ParameterList = function(
  functionParameter,
  json,
  propertyName,
  options
) {
  functionParameter.ParameterList = makeBooleanEditorArrayFromJson(
    json[propertyName],
    functionParameter.terria,
    functionParameter.catalogFunction
  );
};

BooleanParameterGroup.prototype.getValue = function() {
  var param_values = this.ParameterList.map(parameter =>
    parameter.value
      ? {
          id: parameter.id,
          value: parameter.value
        }
      : undefined
  );
  if (this.allValue === true && this.OneForAll.value === true) {
    if (this.allCascade === true) {
      param_values.unshift({
        id: this.OneForAll.id,
        value: this.OneForAll.value
      });
    } else {
      param_values = [
        {
          id: this.OneForAll.id,
          value: this.OneForAll.value
        }
      ];
    }
  }
  /*param_values.unshift(this.OneForAll.value ? {
      [this.OneForAll.id] : this.OneForAll.value
    } : undefined
    );*/
  return param_values.filter(item => item !== undefined);
};

Object.defineProperties(BooleanParameterGroup.prototype, {
  /**
   * Gets the type of this parameter.
   * @memberof BooleanParameterGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "boolean-group";
    }
  },
  updaters: {
    get: function() {
      return BooleanParameterGroup.defaultUpdaters;
    }
  }
});

module.exports = BooleanParameterGroup;
