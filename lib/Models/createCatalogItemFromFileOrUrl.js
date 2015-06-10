'use strict';

/*global require,confirm*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var createCatalogItemFromUrl = require('./createCatalogItemFromUrl');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');

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

    var newCatalogItem;
    if (dataType === 'auto') {
        newCatalogItem = createCatalogItemFromUrl(name, terria);

        if (newCatalogItem.type === 'ogr' && defaultValue(confirmConversion, true) && !confirm('\
This file type is not directly supported by '+terria.appName+'.  However, it may be possible to convert it to a known \
format using the '+terria.appName+' conversion service.  Click OK to upload the file to the '+terria.appName+' conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
            return when.reject('The user declined to use the conversion service.');
        }

    } else if (dataType === 'other') {
        if (defaultValue(confirmConversion, true) && !confirm('\
In order to convert this file to a format supported by '+terria.appName+', it must be uploaded to the '+terria.appName+' conversion service. \
Click OK to upload the file to the '+terria.appName+' conversion service now.  Or, click Cancel \
and the file will not be uploaded or added to the map.')) {
            return when.reject('The user declined to use the conversion service.');
        }

        newCatalogItem = createCatalogMemberFromType('ogr', terria);
    } else {
        newCatalogItem = createCatalogMemberFromType(dataType, terria);
    }

    var lastSlashIndex = name.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
        name = name.substring(lastSlashIndex + 1);
    }

    newCatalogItem.name = name;

    if (isUrl) {
        newCatalogItem.url = fileOrUrl;
    } else {
        newCatalogItem.data = fileOrUrl;
        newCatalogItem.dataSourceUrl = fileOrUrl.name;
    }

    return newCatalogItem.load().then(function() {
        return newCatalogItem;
    });
};

module.exports = createCatalogItemFromFileOrUrl;
