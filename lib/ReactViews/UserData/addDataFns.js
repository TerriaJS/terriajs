import when from 'terriajs-cesium/Source/ThirdParty/when';

import defined from 'terriajs-cesium/Source/Core/defined';
import readJson from '../../Core/readJson';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';
import TerriaError from '../../Core/TerriaError';

import addUserCatalogMember from '../../Models/addUserCatalogMember';
import ArcGisCatalogGroup from '../../Models/ArcGisCatalogGroup';
import ArcGisMapServerCatalogItem from '../../Models/ArcGisMapServerCatalogItem';
import createCatalogItemFromFileOrUrl from '../../Models/createCatalogItemFromFileOrUrl';
import OpenStreetMapCatalogItem from '../../Models/OpenStreetMapCatalogItem';
import WebFeatureServiceCatalogGroup from '../../Models/WebFeatureServiceCatalogGroup';
import WebMapServiceCatalogGroup from '../../Models/WebMapServiceCatalogGroup';
import WebMapTileServiceCatalogGroup from '../../Models/WebMapTileServiceCatalogGroup';

const WFS_URL_REGEX = /\bwfs\b/i;

export function handleFile(terria, allowDropInitFiles, localDataType, e) {
    e.preventDefault();
    const files = e.target.files;

    if (!defined(files)) {
        throw new TerriaError({title: 'File API Not Supported', message: 'You attempted to upload a file to Terria but your browser doesn\'t support it'});
    }

    if (files.length > 0) {
        const promises = [];

        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            terria.analytics.logEvent('uploadFile', 'browse', file.name);
            if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
                raiseErrorOnRejectedPromise(terria, readJson(file).then((json)=>{
                    if (allowDropInitFiles && (json.catalog || json.services)) {
                        // This is an init file.
                        return terria.addInitSource(json);
                    }
                    promises.push(addUserCatalogMember(terria, createCatalogItemFromFileOrUrl(terria, file, localDataType.value, true)));
                }));
            } else {
                promises.push(addUserCatalogMember(terria, createCatalogItemFromFileOrUrl(terria, file, localDataType.value, true)));
            }
        }

        return when.all(promises);
    }

    return when();
}

export function handleUrl(terria, remoteUrl, remoteDataType, e) {
    e.preventDefault();

    const url = this.state.remoteUrl;
    terria.analytics.logEvent('addDataUrl', url);

    let promise;
    if (remoteDataType.value === 'auto') {
        const wmsThenWfs = [loadWms, loadWfs];
        const wfsThenWms = [loadWfs, loadWms];
        const others = [loadWmts, loadMapServer, loadMapServerLayer, loadFile];

        let loadFunctions;

        // Does this look like a WFS URL?  If so, try that first (before WMS).
        // This accounts for the fact that a single URL often works as both WMS and WFS.
        if (WFS_URL_REGEX.test(url)) {
            loadFunctions = wfsThenWms.concat(others);
        } else {
            loadFunctions = wmsThenWfs.concat(others);
        }

        promise = loadAuto(terria, loadFunctions);
    } else if (remoteDataType.value === 'wms-getCapabilities') {
        promise = loadWms(terria, remoteUrl);
    } else if (remoteDataType.value === 'wfs-getCapabilities') {
        promise = loadWfs(terria, remoteUrl);
    } else if (remoteDataType.value === 'esri-group') {
        promise = loadMapServer(terria, remoteUrl).otherwise(() => {
            return loadMapServerLayer(terria, remoteUrl);
        });
    } else if (remoteDataType.value === 'open-street-map') {
        promise = loadOpenStreetMapServer(terria, remoteUrl);
    } else {
        promise = loadFile(terria, remoteUrl, remoteDataType);
    }

    return addUserCatalogMember(terria, promise);
}

/**
 * Loads data, automatically determining the format.
 *
 * @returns {Promise}
 */
function loadAuto(terria, loadFunctions, index) {
    index = 0;
    const loadFunction = loadFunctions[index];

    return loadFunction(terria).otherwise(function() {
        return loadAuto(terria, loadFunctions, index + 1);
    });
}

/**
 * Loads a Web Map Service catalog group.
 *
 * @returns {Promise}
 */
function loadWms(terria, remoteUrl) {
    const wms = new WebMapServiceCatalogGroup(terria);
    wms.name = remoteUrl;
    wms.url = remoteUrl;

    return wms.load().then(function() {
        return wms;
    });
}

/**
 * Loads a Web Feature Service catalog group.
 *
 * @returns {Promise}
 */
function loadWfs(terria, remoteUrl) {
    const wfs = new WebFeatureServiceCatalogGroup(terria);
    wfs.name = remoteUrl;
    wfs.url = remoteUrl;

    return wfs.load().then(function() {
        return wfs;
    });
}

/**
 * Loads a Web Map Tile Service catalog group.
 *
 * @returns {Promise}
 */
function loadWmts(terria, remoteUrl) {
    const wmts = new WebMapTileServiceCatalogGroup(terria);
    wmts.name = remoteUrl;
    wmts.url = remoteUrl;

    return wmts.load().then(function() {
        return wmts;
    });
}

/**
 * Loads an ArcGis catalog group.
 *
 * @returns {Promise.<T>}
 */
function loadMapServer(terria, remoteUrl) {
    const mapServer = new ArcGisCatalogGroup(terria);
    mapServer.name = remoteUrl;
    mapServer.url = remoteUrl;

    return mapServer.load().then(function() {
        return mapServer;
    });
}

/**
 * Loads a single ArcGis layer.
 *
 * @returns {Promise.<T>}
 */
function loadMapServerLayer(terria, remoteUrl) {
    const mapServer = new ArcGisMapServerCatalogItem(terria);
    mapServer.name = remoteUrl;
    mapServer.url = remoteUrl;
    return mapServer.load().then(function() {
        return mapServer;
    });
}

/**
 * Loads an item from a open street map server.
 *
 * @param viewModel
 * @returns {Promise.<T>}
 */
function loadOpenStreetMapServer(terria, remoteUrl) {
    const openStreetMapServer = new OpenStreetMapCatalogItem(terria);
    openStreetMapServer.name = remoteUrl;
    openStreetMapServer.url = remoteUrl;

    return openStreetMapServer.load().then(function() {
        return openStreetMapServer;
    });
}

/**
 * Loads a catalog item from a file.
 */
function loadFile(terria, remoteUrl, remoteDataType) {
    return createCatalogItemFromFileOrUrl(terria, remoteUrl, remoteDataType, true);
}
