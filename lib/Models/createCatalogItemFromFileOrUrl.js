"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var createCatalogItemFromUrl = require("./createCatalogItemFromUrl");
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var TerriaError = require("../Core/TerriaError");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var OgrCatalogItem = require("../Models/OgrCatalogItem");
var i18next = require("i18next").default;

/**
 * Asynchronously creates and loads a catalog item for a given file.  The returned promise does not resolve until
 * the catalog item is successfully loaded, and it rejects if the file is not in the expected format or
 * another error occurs during loading.  If the OGR-based conversion service needs to be invoked to convert the file or URL
 * to a compatible format, the user
 *
 * @param  {Terria} terria The Terria instance in which to create the item.
 * @param {File|String} fileOrUrl The file or URL for which to create a catalog item.
 * @param {String} [dataType='auto'] The type of catalog item to create.  If 'auto', the type is deduced from the URL or filename.
 *                                   If 'other', the OGR-based conversion service is used.  This can also be any valid catalog item
 *                                   {@link CatalogItem#type}.
 * @param {Boolean} [confirmConversion=true] If true, and the OGR-based conversion service needs to be invoked, the user will first
 *                                           be asked for permission to upload the file to the conversion service.  If false, the
 *                                           user will not be asked for permission.  If the user denies the request, the promise
 *                                           will be rejected with the string 'The user declined to use the conversion service.'.
 * @return {Promise} A promise that resolves to the created catalog item.
 */
var createCatalogItemFromFileOrUrl = function(
  terria,
  viewState,
  fileOrUrl,
  dataType,
  confirmConversion
) {
  function tryConversionService(newItem) {
    if (terria.configParameters.conversionServiceBaseUrl === false) {
      // Don't allow conversion service. Duplicated in OgrCatalogItem.js
      terria.error.raiseEvent(
        new TerriaError({
          title: i18next.t("models.catalog.unsupportedFileTypeTitle"),
          message: i18next.t("models.catalog.unsupportedFileTypeMessage", {
            appName: terria.appName,
            link:
              '<a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>'
          })
        })
      );
      return undefined;
    } else if (
      name.match(
        /\.(shp|jpg|jpeg|pdf|xlsx|xls|tif|tiff|png|txt|doc|docx|xml|json)$/
      )
    ) {
      terria.error.raiseEvent(
        new TerriaError({
          title: i18next.t("models.catalog.unsupportedFileTypeTitle"),
          message: i18next.t("models.catalog.unsupportedFileTypeMessageII", {
            appName: terria.appName,
            link:
              '<a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>',
            linkII:
              '<a href="http://www.gdal.org/ogr_formats.html">OGR Vector Formats</a>'
          })
        })
      );
      return undefined;
    }
    return getConfirmation(
      terria,
      viewState,
      confirmConversion,
      i18next.t("models.catalog.getConfirmationMessage", {
        appName: terria.appName
      })
    ).then(function(confirmed) {
      return confirmed
        ? loadItem(new OgrCatalogItem(terria), name, fileOrUrl)
        : undefined;
    });
  }

  var isUrl = typeof fileOrUrl === "string";
  dataType = defaultValue(dataType, "auto");

  var name = isUrl ? fileOrUrl : fileOrUrl.name;

  if (dataType === "auto") {
    return when(createCatalogItemFromUrl(name, terria, isUrl)).then(function(
      newItem
    ) {
      //##Doesn't work for file uploads
      if (!defined(newItem)) {
        return tryConversionService();
      } else {
        // It's a file or service we support directly
        // In some cases (web services), the item will already have been loaded by this point.
        return loadItem(newItem, name, fileOrUrl);
      }
    });
  } else if (dataType === "other") {
    // user explicitly chose "Other (use conversion service)"
    return getConfirmation(
      terria,
      viewState,
      confirmConversion,
      i18next.t("models.catalog.readyToUpload", {
        appName: terria.appName
      })
    ).then(function(confirmed) {
      return confirmed
        ? loadItem(createCatalogMemberFromType("ogr", terria), name, fileOrUrl)
        : undefined;
    });
  } else {
    // User has provided a type, so we go with that.
    return loadItem(
      createCatalogMemberFromType(dataType, terria),
      name,
      fileOrUrl
    );
  }
};

/* Returns a promise that returns true if user confirms, or false if they abort. */
function getConfirmation(terria, viewState, confirmConversion, message) {
  if (!confirmConversion) {
    return when(true);
  }

  var d = when.defer(); // there's no `when.promise(resolver)` in when 1.7.1
  viewState.notifications.push({
    confirmText: i18next.t("models.catalog.upload"),
    denyText: i18next.t("models.catalog.cancel"),
    title: i18next.t("models.catalog.useConversion"),
    message: message,
    confirmAction: function() {
      d.resolve(true);
    },
    denyAction: function() {
      d.resolve(false);
    }
  });
  return d.promise;
}

function loadItem(newCatalogItem, name, fileOrUrl) {
  if (typeof fileOrUrl === "string") {
    newCatalogItem.url = fileOrUrl;
  } else {
    newCatalogItem.data = fileOrUrl;
    newCatalogItem.dataSourceUrl = fileOrUrl.name;
    newCatalogItem.dataUrlType = "local";
    newCatalogItem.name = fileOrUrl.name;
  }

  return when(newCatalogItem.load()).yield(newCatalogItem);
}

module.exports = createCatalogItemFromFileOrUrl;
