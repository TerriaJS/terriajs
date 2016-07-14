import addUserCatalogMember from './../Models/addUserCatalogMember';
import createCatalogItemFromFileOrUrl from './../Models/createCatalogItemFromFileOrUrl';
import defined from 'terriajs-cesium/Source/Core/defined';
import getDataType from '../Core/getDataType';
import raiseErrorOnRejectedPromise from './raiseErrorOnRejectedPromise';
import readJson from '../Core/readJson';
import TerriaError from './../Core/TerriaError';
import when from 'terriajs-cesium/Source/ThirdParty/when';

function addUserFiles(files, terria, viewState, fileType) {
    const dataType = fileType || getDataType().localDataType[0];
    if (!defined(files)) {
        terria.error.raiseEvent(new TerriaError({
                sender: this,
                title: 'File API not supported',
                message: '\
Sorry, your web browser does not support the File API, which '+terria.appName+' requires in order to \
add data from a file on your system.  Please upgrade your web browser.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
            }));
    }

    const promises = [];

    for (let i = 0; i < files.length; ++i) {
        const file = files[i];

        terria.analytics.logEvent('uploadFile', 'browse', file.name);

        if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
            const promise = readJson(file).then(json => {
                if (json.catalog || json.services) {
                    // This is an init file.
                    return terria.addInitSource(json);
                }
                return addUserCatalogMember(terria, createCatalogItemFromFileOrUrl(terria, viewState, file, dataType.value, true));
            });
            promises.push(raiseErrorOnRejectedPromise(terria, promise));
        } else {
            promises.push(addUserCatalogMember(terria, createCatalogItemFromFileOrUrl(terria, viewState, file, dataType.value, true)));
        }
    }

    return when.all(promises, addedItems => {
        return addedItems.filter(item => item && !(item instanceof TerriaError));
    });
}

module.exports = addUserFiles;
