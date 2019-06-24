"use strict";

import URI from "urijs";

import CesiumMath from "terriajs-cesium/Source/Core/Math";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import { CHART_DATA_CATEGORY_NAME } from "../../../../Core/addedForCharts";
import combineFilters from "../../../../Core/combineFilters";
import CatalogMember from "../../../../Models/CatalogMember";
import hashEntity from "../../../../Core/hashEntity";
import ViewerMode from "../../../../Models/ViewerMode";

const userPropWhiteList = ["hideExplorerPanel", "activeTabId"];

export const SHARE_VERSION = "0.0.05";

/**
 * Builds a share link that reflects the state of the passed Terria instance.
 *
 * @param terria The terria instance to serialize.
 * @param {ViewState} [viewState] The viewState to read whether we're viewing the catalog or not
 * @param {Object} [options] Options for building the share link.
 * @param {Boolean} [options.includeStories=true] True to include stories in the share link, false to exclude them.
 * @returns {String} A URI that will rebuild the current state when viewed in a browser.
 */
export function buildShareLink(
  terria,
  viewState,
  options = { includeStories: true }
) {
  const uri = new URI(window.location).fragment("").search({
    start: JSON.stringify(getShareData(terria, viewState, options))
  });

  userPropWhiteList.forEach(key =>
    uri.addSearch({ key: terria.userProperties[key] })
  );
  return uri
    .fragment(uri.query())
    .query("")
    .toString(); // replace ? with #
}

/**
 * Returns just the JSON that defines the current view.
 * @param  {Object} terria The Terria object.
 * @param  {ViewState} [viewState] Current viewState.
 * @return {Object}
 */
export function getShareData(
  terria,
  viewState,
  options = { includeStories: true }
) {
  const { includeStories } = options;
  const initSources = includeStories ? terria.initSources.slice() : [];

  addUserAddedCatalog(terria, initSources);
  addSharedMembers(terria, initSources);
  addViewSettings(terria, viewState, initSources);
  addFeaturePicking(terria, initSources);
  addLocationMarker(terria, initSources);
  addTimeline(terria, initSources);
  if (includeStories) {
    // info that are not needed in scene share data
    addStories(terria, initSources);
  }

  return {
    version: SHARE_VERSION,
    initSources: initSources
  };
}
/**
 * Is it currently possible to generate short URLs?
 * @param  {Object} terria The Terria object.
 * @return {Boolean}
 */
export function canShorten(terria) {
  return (
    (terria.urlShortener && terria.urlShortener.isUsable) ||
    (terria.shareDataService && terria.shareDataService.isUsable)
  );
}

/**
 * Like {@link buildShareLink}, but shortens the result using {@link Terria#urlShortener}.
 *
 * @returns {Promise<String>} A promise that will return the shortened url when complete.
 */
export function buildShortShareLink(
  terria,
  viewState,
  options = { includeStories: true }
) {
  const urlFromToken = token =>
    new URI(window.location).fragment("share=" + token).toString();
  if (defined(terria.shareDataService)) {
    return terria.shareDataService
      .getShareToken(getShareData(terria, viewState, options))
      .then(urlFromToken);
  } else {
    return terria.urlShortener
      .shorten(buildShareLink(terria, viewState, options))
      .then(urlFromToken);
  } // we assume that URL shortener is defined.
}

/**
 * Adds user-added catalog members to the passed initSources.
 * @private
 */
function addUserAddedCatalog(terria, initSources) {
  const localDataFilterRemembering = rememberRejections(
    CatalogMember.itemFilters.noLocalData
  );

  const userAddedCatalog = terria.catalog.serializeToJson({
    itemFilter: combineFilters([
      localDataFilterRemembering.filter,
      CatalogMember.itemFilters.userSuppliedOnly,
      function(item) {
        // Chart group should be regenerated through lib/Models/Catalog.js's 'chartDataGroup' property once charting
        // items are loaded again, otherwise it overwrites certain properties through including unnecessarily
        // serialised items
        return !(item.name === CHART_DATA_CATEGORY_NAME);
      },
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
  const catalogForSharing = flattenCatalog(
    terria.catalog.serializeToJson({
      itemFilter: combineFilters([
        function(item) {
          if (CatalogMember.itemFilters.noLocalData(item)) {
            return true;
          } else if (CatalogMember.itemFilters.isCsvForCharting(item)) {
            return true;
          }
          return false;
        }
      ]),
      propertyFilter: combineFilters([
        CatalogMember.propertyFilters.sharedOnly,
        function(property, item) {
          return property !== "name" || item.type === "csv";
        }
      ])
    })
  )
    .filter(function(item) {
      return item.isEnabled || item.isOpen;
    })
    .reduce(function(soFar, item) {
      soFar[item.id] = item;
      item.id = undefined;
      return soFar;
    }, {});

  // Eliminate open groups without all ancestors open
  Object.keys(catalogForSharing).forEach(key => {
    const item = catalogForSharing[key];
    const isGroupWithClosedParent =
      item.isOpen &&
      item.parents.some(parentId => !catalogForSharing[parentId]);

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
function addViewSettings(terria, viewState, initSources) {
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

  const time = {
    dayNumber: terria.clock.currentTime.dayNumber,
    secondsOfDay: terria.clock.currentTime.secondsOfDay
  };

  let viewerMode;
  switch (terria.viewerMode) {
    case ViewerMode.CesiumTerrain:
      viewerMode = "3d";
      break;
    case ViewerMode.CesiumEllipsoid:
      viewerMode = "3dSmooth";
      break;
    case ViewerMode.Leaflet:
      viewerMode = "2d";
      break;
  }

  const terriaSettings = {
    initialCamera: initialCamera,
    homeCamera: homeCamera,
    baseMapName: terria.baseMap.name,
    viewerMode: viewerMode,
    currentTime: time
  };

  if (defined(viewState)) {
    const itemIdToUse = viewState.viewingUserData()
      ? defined(viewState.userDataPreviewedItem) &&
        viewState.userDataPreviewedItem.uniqueId
      : defined(viewState.previewedItem) && viewState.previewedItem.uniqueId;

    // allow for sharing just the explorer-window-is-open if we decide the UI can do that in the future
    if (viewState.explorerPanelIsVisible) {
      terriaSettings.sharedFromExplorerPanel = viewState.explorerPanelIsVisible;
    }
    // don't persist the not-visible-to-user previewed id in the case of sharing from outside the catalog
    if (viewState.explorerPanelIsVisible && itemIdToUse) {
      terriaSettings.previewedItemId = itemIdToUse;
    }
  }

  if (defined(terria.showSplitter)) {
    terriaSettings.showSplitter = terria.showSplitter;
    terriaSettings.splitPosition = terria.splitPosition;
  }
  initSources.push(terriaSettings);
}

/**
 * Add details of currently picked features.
 * @private
 */
function addFeaturePicking(terria, initSources) {
  if (
    defined(terria.pickedFeatures) &&
    terria.pickedFeatures.features.length > 0
  ) {
    const positionInRadians = Ellipsoid.WGS84.cartesianToCartographic(
      terria.pickedFeatures.pickPosition
    );

    const pickedFeatures = {
      providerCoords: terria.pickedFeatures.providerCoords,
      pickCoords: {
        lat: CesiumMath.toDegrees(positionInRadians.latitude),
        lng: CesiumMath.toDegrees(positionInRadians.longitude),
        height: positionInRadians.height
      }
    };

    if (defined(terria.selectedFeature)) {
      // Sometimes features have stable ids and sometimes they're randomly generated every time, so include both
      // id and name as a fallback.
      pickedFeatures.current = {
        name: terria.selectedFeature.name,
        hash: hashEntity(terria.selectedFeature, terria.clock)
      };
    }

    // Remember the ids of vector features only, the raster ones we can reconstruct from providerCoords.
    pickedFeatures.entities = terria.pickedFeatures.features
      .filter(feature => !defined(feature.imageryLayer))
      .map(entity => {
        return {
          name: entity.name,
          hash: hashEntity(entity, terria.clock)
        };
      });

    initSources.push({
      pickedFeatures: pickedFeatures
    });
  }
}

/**
 * Add details of the location marker if it is set.
 * @private
 */
function addLocationMarker(terria, initSources) {
  if (defined(terria.locationMarker)) {
    const position = terria.locationMarker.entities.values[0].position.getValue();
    const positionDegrees = Ellipsoid.WGS84.cartesianToCartographic(position);

    initSources.push({
      locationMarker: {
        name: terria.locationMarker.entities.values[0].name,
        latitude: CesiumMath.toDegrees(positionDegrees.latitude),
        longitude: CesiumMath.toDegrees(positionDegrees.longitude)
      }
    });
  }
}

function addTimeline(terria, initSources) {
  if (terria.timeSeriesStack.topLayer) {
    initSources.push({
      timeline: {
        shouldAnimate: terria.clock.shouldAnimate,
        multiplier: terria.clock.multiplier,
        currentTime: {
          dayNumber: terria.clock.currentTime.dayNumber,
          secondsOfDay: terria.clock.currentTime.secondsOfDay
        }
      }
    });
  }
}

function addStories(terria, initSources) {
  if (defined(terria.stories)) {
    initSources.push({
      stories: terria.stories.slice()
    });
  }
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
