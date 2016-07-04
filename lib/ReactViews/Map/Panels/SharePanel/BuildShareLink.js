'use strict';

import URI from 'urijs';

import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';

import combineFilters from '../../../../Core/combineFilters';
import CatalogMember from '../../../../Models/CatalogMember';

const userPropWhiteList = ['hideExplorerPanel', 'activeTabId'];

/**
 * Builds a share link that reflects the state of the passed Terria instance.
 *
 * @param terria The terria instance to serialize.
 * @returns {String} A URI that will rebuild the current state when viewed in a browser.
 */
export function buildShareLink(terria) { 
    const uri = new URI(window.location)
        .fragment('')
        .search({ 'start': JSON.stringify(getShareData(terria)) });
    
    userPropWhiteList.forEach(key => uri.addSearch({ key: terria.userProperties[key] }));
    return uri.fragment(uri.query()).query('').toString(); // replace ? with #
}

/**
 * Returns just the JSON that defines the current view.
 * @param  {Object} terria The Terria object.
 * @return {Object}        
 */
function getShareData(terria) {
    const initSources = terria.initSources.slice();

    addUserAddedCatalog(terria, initSources);
    addSharedMembers(terria, initSources);
    addViewSettings(terria, initSources);
    return {
        version: '0.0.05',
        initSources: initSources 
    };
}
/**
 * Is it currently possible to generate short URLs?
 * @param  {Object} terria The Terria object.
 * @return {Boolean}        
 */
export function canShorten(terria) {
    return (terria.urlShortener && terria.urlShortener.isUsable) || (terria.shareDataService && terria.shareDataService.isUsable);
}

/**
 * Like {@link buildShareLink}, but shortens the result using {@link Terria#urlShortener}.
 *
 * @returns {Promise<String>} A promise that will return the shortened url when complete.
 */
export function buildShortShareLink(terria) {
    const urlFromToken = token => new URI(window.location).fragment('share=' + token).toString(); 
    if (defined(terria.shareDataService)) {
        return terria.shareDataService.getShareToken(getShareData(terria)).then(urlFromToken);
    } else {
        return terria.urlShortener.shorten(buildShareLink(terria)).then(urlFromToken);
    } // we assume that URL shortener is defined.
}

/**
 * Adds user-added catalog members to the passed initSources.
 * @private
 */
function addUserAddedCatalog(terria, initSources) {
    const localDataFilterRemembering = rememberRejections(CatalogMember.itemFilters.noLocalData);

    const userAddedCatalog = terria.catalog.serializeToJson({
        itemFilter: combineFilters([
            localDataFilterRemembering.filter,
            CatalogMember.itemFilters.userSuppliedOnly,
            function(item) {
                // If the parent has a URL then this item will just load from that, so don't bother serializing it.
                // Properties that change when an item is enabled like opacity will be included in the shared members
                // anyway.
                return !item.parent || !item.parent.url;
            }
        ])
    });

    // Add an init source with user-added catalog members.
    if (userAddedCatalog.length > 0) {
        initSources.push({
            catalog: userAddedCatalog
        });
    }

    return localDataFilterRemembering.rejections;
}

/**
 * Adds existing catalog members that the user has enabled or opened to the passed initSources object.
 * @private
 */
function addSharedMembers(terria, initSources) {
    const catalogForSharing = flattenCatalog(terria.catalog.serializeToJson({
        itemFilter: combineFilters([
            CatalogMember.itemFilters.noLocalData
        ]),
        propertyFilter: combineFilters([
            CatalogMember.propertyFilters.sharedOnly,
            function(property) {
                return property !== 'name';
            }
        ])
    })).filter(function(item) {
        return item.isEnabled || item.isOpen;
    }).reduce(function(soFar, item) {
        soFar[item.id] = item;
        item.id = undefined;
        return soFar;
    }, {});

    // Eliminate open groups without all ancestors open
    Object.keys(catalogForSharing).forEach(key => {
        const item = catalogForSharing[key];
        const isGroupWithClosedParent = item.isOpen && item.parents.some(parentId => !catalogForSharing[parentId]);

        if (isGroupWithClosedParent) {
            catalogForSharing[key] = undefined;
        }
    });

    if (Object.keys(catalogForSharing).length > 0) {
        initSources.push({
            sharedCatalogMembers: catalogForSharing
        });
    }
}

/**
 * Adds the details of the current view to the init sources.
 * @private
 */
function addViewSettings(terria, initSources) {
    const cameraExtent = terria.currentViewer.getCurrentExtent();

    // Add an init source with the camera position.
    const initialCamera = {
        west: CesiumMath.toDegrees(cameraExtent.west),
        south: CesiumMath.toDegrees(cameraExtent.south),
        east: CesiumMath.toDegrees(cameraExtent.east),
        north: CesiumMath.toDegrees(cameraExtent.north)
    };

    if (defined(terria.cesium)) {
        const cesiumCamera = terria.cesium.scene.camera;
        initialCamera.position = cesiumCamera.positionWC;
        initialCamera.direction = cesiumCamera.directionWC;
        initialCamera.up = cesiumCamera.upWC;
    }

    const homeCamera = {
        west: CesiumMath.toDegrees(terria.homeView.rectangle.west),
        south: CesiumMath.toDegrees(terria.homeView.rectangle.south),
        east: CesiumMath.toDegrees(terria.homeView.rectangle.east),
        north: CesiumMath.toDegrees(terria.homeView.rectangle.north),
        position: terria.homeView.position,
        direction: terria.homeView.direction,
        up: terria.homeView.up
    };

    initSources.push({
        initialCamera: initialCamera,
        homeCamera: homeCamera,
        baseMapName: terria.baseMap.name,
        viewerMode: terria.leaflet ? '2d' : '3d'
    });
}

/**
 * Wraps around a filter function and records all items that are excluded by it. Does not modify the function passed in.
 *
 * @param filterFn The fn to wrap around
 * @returns {{filter: filter, rejections: Array}} The resulting filter function that remembers rejections, and an array
 *          array of the rejected items. As the filter function is used, the rejections array with be populated.
 */
function rememberRejections(filterFn) {
    const rejections = [];

    return {
        filter: function(item) {
            const allowed = filterFn(item);

            if (!allowed) {
                rejections.push(item);
            }

            return allowed;
        },
        rejections: rejections
    };
}

/**
 * Takes the hierarchy of serialized catalog members returned by {@link serializeToJson} and flattens it into an Array.
 * @returns {Array}
 */
function flattenCatalog(items) {
    return items.reduce(function(soFar, item) {
        soFar.push(item);

        if (item.items) {
            soFar = soFar.concat(flattenCatalog(item.items));
            item.items = undefined;
        }

        return soFar;
    }, []);
}
