"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

/**
 * Adds a user's catalog item or group to the catalog.
 *
 * @param  {Terria} terria The Terria instance to contain the catalog member.
 * @param {CatalogItem|Promise} newCatalogItemOrPromise The catalog member to add, or a promise for a catalog member.
 * @param {Object} [options] An object with the following members:
 * @param {Boolean} [options.enable=true] True to enable the newly-added member if it is an item; otherwise, false.
 * @param {Boolean} [options.open=true] True to open the newly-added member if it is a group; otherwise, false.
 * @param {Boolean} [options.zoomTo=true] True to zoom and use the clock of the newly-added member if it is an item; otherwise, false.
 * @return {Promise} A promise that resolves to the catalog item when loaded successfully, or to a {@link TerriaError} if loading fails.  The {@link TerriaError} is reported
 *                   by raising {@link Terria#error} prior to resolving.  The promise never rejects.
 */
var addUserCatalogMember = function(
  terria,
  newCatalogMemberOrPromise,
  options
) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  return when(newCatalogMemberOrPromise, function(newCatalogItem) {
    if (!defined(newCatalogItem)) {
      return;
    }

    newCatalogItem.isUserSupplied = true;

    terria.catalog.userAddedDataGroup.add(newCatalogItem);

    if (defaultValue(options.open, true) && defined(newCatalogItem.isOpen)) {
      newCatalogItem.isOpen = true;
    }

    if (
      defaultValue(options.enable, true) &&
      defined(newCatalogItem.isEnabled)
    ) {
      newCatalogItem.isEnabled = true;
    }

    if (
      defaultValue(options.zoomTo, true) &&
      defined(newCatalogItem.zoomToAndUseClock)
    ) {
      newCatalogItem.zoomToAndUseClock();
    }

    terria.catalog.userAddedDataGroup.isOpen = true;

    return newCatalogItem;
  }).otherwise(function(e) {
    if (!(e instanceof TerriaError)) {
      e = new TerriaError({
        title: i18next.t("models.userData.addingDataErrorTitle"),
        message: i18next.t("models.userData.addingDataErrorTitle")
      });
    }

    terria.error.raiseEvent(e);

    return e;
  });
};

module.exports = addUserCatalogMember;
