'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var TerriaError = require('../Core/TerriaError');
var defined = require('terriajs-cesium/Source/Core/defined');
var OgrCatalogItem = require('../Models/OgrCatalogItem');

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
var createCatalogItemFromFileOrUrl = function(terria, viewState, fileOrUrl, dataType, confirmConversion) {
    function tryConversionService(newItem) {
       if (name.match(/\.(shp|jpg|jpeg|pdf|xlsx|xls|tif|tiff|png|txt|doc|docx|xml|json)$/)) {
            terria.error.raiseEvent(new TerriaError({
                title: 'Unsupported file type',
                message: 'This file format is not supported by ' + terria.appName + '. Directly supported file formats include: ' +
                '<ul><li>.geojson</li><li>.kml, .kmz</li><li>.csv (in <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>)</li></ul>' +
                'File formats supported through the online conversion service include: ' +
                '<ul><li>Shapefile (.zip)</li><li>MapInfo TAB (.zip)</li><li>Possibly other <a href="http://www.gdal.org/ogr_formats.html">OGR Vector Formats</a></li></ul>'
            }));
            return undefined;
        }
        return getConfirmation(terria, viewState, confirmConversion, 'This file is not directly supported by '+terria.appName+'.\n\n' +
            'Do you want to try uploading it to the '+terria.appName+' conversion service? This may work for ' +
            'small, zipped Esri Shapefiles or MapInfo TAB files.')
            .then(function(confirmed) {
                return confirmed ? loadItem(new OgrCatalogItem(terria), name, fileOrUrl) : undefined;
            });
    }

    var isUrl = typeof fileOrUrl === 'string';
    dataType = defaultValue(dataType, 'auto');

    var name = isUrl ? fileOrUrl : fileOrUrl.name;

    if (dataType === 'auto') {
        return when(createCatalogItemFromUrl(name, terria, isUrl)).then(function(newItem) { //##Doesn't work for file uploads
            if (!defined(newItem)) {
                return tryConversionService();
            } else {
                // It's a file or service we support directly
                // In some cases (web services), the item will already have been loaded by this point.
                return loadItem(newItem, name, fileOrUrl);
            }
        });
    } else if (dataType === 'other') { // user explicitly chose "Other (use conversion service)"
        return getConfirmation(terria, viewState, confirmConversion, 'Ready to upload your file to the ' + terria.appName + ' conversion service?')
            .then(function(confirmed) {
                return confirmed ? loadItem(createCatalogMemberFromType('ogr', terria), name, fileOrUrl) : undefined;
            });
    } else {
        // User has provided a type, so we go with that.
        return loadItem(createCatalogMemberFromType(dataType, terria), name, fileOrUrl);
    }
};

/* Returns a promise that returns true if user confirms, or false if they abort. */
function getConfirmation(terria, viewState, confirmConversion, message) {
    if (!confirmConversion) {
        return when(true);
    }

    var d = when.defer(); // there's no `when.promise(resolver)` in when 1.7.1
    viewState.notifications.push({
        confirmText: 'Upload',
        denyText: 'Cancel',
        title: 'Use conversion service?',
        message: message,
        confirmAction: function () { d.resolve(true); },
        denyAction: function() { d.resolve(false); }
    });
    return d.promise;
}

function loadItem(newCatalogItem, name, fileOrUrl) {
   var lastSlashIndex = name.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
        name = name.substring(lastSlashIndex + 1);
    }

    newCatalogItem.name = name;

    if (typeof fileOrUrl === 'string') {
        newCatalogItem.url = fileOrUrl;
    } else {
        newCatalogItem.data = fileOrUrl;
        newCatalogItem.dataSourceUrl = fileOrUrl.name;
        newCatalogItem.dataUrlType = 'local';
    }

    return when(newCatalogItem.load()).yield(newCatalogItem);
}

module.exports = createCatalogItemFromFileOrUrl;
