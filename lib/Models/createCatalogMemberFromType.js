"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;

var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

var mapping = {};

/**
 * Creates a type derived from {@link CatalogMember} based on a given type string.
 *
 * @param {String} type The derived type name.
 * @param {Terria} terria The Terria instance.
 */
var createCatalogMemberFromType = function(type, terria) {
  var Constructor = mapping[type];
  if (!defined(Constructor)) {
    throw new TerriaError({
      title: i18next.t("models.catalog.unsupportedTypeTitle"),
      message: i18next.t("models.catalog.unsupportedTypeMessage", {
        type: type,
        appName: terria.appName
      })
    });
  }

  return new Constructor(terria);
};

/**
 * Registers a constructor for a given type of {@link CatalogMember}.
 *
 * @param {String} type The type name for which to register a constructor.
 * @param {Function} constructor The constructor for data items of this type.  The constructor is expected to take a
 *                                {@link Terria} as its first and only required parameter.
 */
createCatalogMemberFromType.register = function(type, constructor) {
  mapping[type] = constructor;
};

module.exports = createCatalogMemberFromType;
