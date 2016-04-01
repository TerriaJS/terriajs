'use strict';

import URI from 'urijs';

import CesiumMath from 'terriajs-cesium/Source/Core/Math';
import defined from 'terriajs-cesium/Source/Core/defined';

import combineFilters from '../../../../Core/combineFilters';
import CatalogMember from '../../../../Models/CatalogMember';

const userPropWhiteList = ['hideExplorerPanel', 'activeTabId'];

export function buildShareLink(terria) {
    // Build the share URL.
    const request = {
        version: '0.0.05',
        initSources: terria.initSources.slice()
    };

    addUserAddedCatalog(terria, request.initSources);
    addSharedMembers(terria, request.initSources);
    addViewSettings(terria, request.initSources);

    const requestString = JSON.stringify(request);
    return `${getUri()}#start=${encodeURIComponent(requestString)}${generateUserPropertiesQuery(terria)}`;
}

export function buildShortShareLink(terria) {
    return terria.urlShortener.shorten(buildShareLink(terria)).then(function(token) {
        return `${getUri()}#share=${token}`;
    });
}

function getUri() {
    const uri = new URI(window.location);

    // Remove the portion of the URL after the hash.
    uri.fragment('');
    return uri.toString();
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
 * Generates a query string for custom user properties.
 *
 * @returns {String}
 * @private
 */
function generateUserPropertiesQuery(terria) {
    return userPropWhiteList.reduce((querySoFar, key) => {
        const val = terria.userProperties[key];
        return val ? `${querySoFar}&${key}=${encodeURIComponent(val)}` : querySoFar;
    }, '');
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
