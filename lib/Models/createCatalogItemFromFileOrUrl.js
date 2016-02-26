'use strict';

/*global require,confirm*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var PopupMessageConfirmationViewModel = require('../ViewModels/PopupMessageConfirmationViewModel.js');

var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var TerriaError = require('../Core/TerriaError');

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
var createCatalogItemFromFileOrUrl = function(terria, fileOrUrl, dataType, confirmConversion) {
    var isUrl = typeof fileOrUrl === 'string';
    dataType = defaultValue(dataType, 'auto');

    var name = isUrl ? fileOrUrl : fileOrUrl.name;

    var newCatalogItem, q;
    var d = confirmConversion ? when.defer() : when(true);
    if (name.match(/\.(shp|jpg|jpeg|pdf|xlsx|xls|tif|tiff|png|txt|doc|docx)$/)) {
        terria.error.raiseEvent(new TerriaError({
            title: 'Unsupported file type',
            message: 'This file format is not supported by ' + terria.appName + '. Directly supported file formats include: ' + 
            '<ul><li>.geojson</li><li>.kml</li><li>.csv (in <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>)</li></ul>' + 
            'File formats supported through the online conversion service include: ' +
            '<ul><li>Shapefile (.zip)</li><li>MapInfo TAB (.zip)</li><li>Possibly other <a href="http://www.gdal.org/ogr_formats.html">OGR Vector Formats</a></li></ul>'
        }));
        return undefined;
    } else if (dataType === 'auto') {
        newCatalogItem = createCatalogItemFromUrl(name, terria);
        if (newCatalogItem.type === 'ogr') {
            q = when(d).then(function() { return loadItem(newCatalogItem, name, fileOrUrl); });
            if (confirmConversion) showConfirmation(d.resolve, 'This file is not directly supported by '+terria.appName+'.\n\n' +
                'Do you want to try uploading it to the '+terria.appName+' conversion service? This may work for ' +
                'small, zipped Esri Shapefiles or MapInfo TAB files.');
            return q;
        } // else it's a file we support directly
    } else if (dataType === 'other') { // user explicitly chose "Other (use conversion service)"
        q = when(d).then(function() { 
            return loadItem(createCatalogMemberFromType('ogr', terria), name, fileOrUrl); 
        });
        if (confirmConversion) 
            showConfirmation(d.resolve, 'Ready to upload your file to the ' + terria.appName + ' conversion service?');        
        return q;
    } else {
        return loadItem(createCatalogMemberFromType(dataType, terria), name, fileOrUrl);
    }
};

function showConfirmation(callback, message) {
    PopupMessageConfirmationViewModel.open('ui', { 
        confirmText: 'Upload', 
        title: 'Use conversion service?',
        message: message,
        confirmAction: callback,
        enableDeny: true,
        denyAction: function() { this.close(); }
    });
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
    }

    return newCatalogItem.load().yield(newCatalogItem);
}

module.exports = createCatalogItemFromFileOrUrl;
