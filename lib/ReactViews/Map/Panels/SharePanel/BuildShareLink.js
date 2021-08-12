"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import URI from "urijs";
import { CHART_DATA_CATEGORY_NAME } from "../../../../Core/addedForCharts";
import combineFilters from "../../../../Core/combineFilters";
// import CatalogMember from "../../../../Models/CatalogMember";
import hashEntity from "../../../../Core/hashEntity";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import saveStratumToJson from "../../../../Models/Definition/saveStratumToJson";
import { BaseModel } from "../../../../Models/Definition/Model";

const CatalogMember = {}; // TODO

const userPropWhiteList = ["hideExplorerPanel", "activeTabId"];

export const SHARE_VERSION = "8.0.0";

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
  const initSource = {};
  const initSources = [initSource]; // includeStories ? terria.initSources.slice() : [];

  addStratum(terria, CommonStrata.user, initSource);
  addWorkbench(terria, initSource);
  addTimelineItems(terria, initSource);
  addViewSettings(terria, viewState, initSource);
  addFeaturePicking(terria, initSource);
  addBaseMaps(terria, CommonStrata.definition, initSource);
  if (includeStories) {
    // info that are not needed in scene share data
    addStories(terria, initSource);
  }

  const oldShare = false;
  if (oldShare === true) {
    addUserAddedCatalog(terria, initSources);
    addSharedMembers(terria, initSources);
    addLocationMarker(terria, initSources);
    addTimeline(terria, initSources);
  }

  return {
    version: SHARE_VERSION,
    initSources: initSources
  };
}

function addStratum(terria, stratumId, initSource) {
  initSource.stratum = stratumId;
  initSource.models = {};

  terria.models.forEach((model, id) => {
    const force = terria.workbench.contains(model);
    addModelStratum(terria, model, stratumId, force, initSource);
  });
}

function addBaseMaps(terria, initSource) {}

function addWorkbench(terria, initSource) {
  initSource.workbench = terria.workbench.itemIds.filter(isShareable(terria));
}

function addTimelineItems(terria, initSources) {
  initSources.timeline = terria.timelineStack.itemIds.filter(
    isShareable(terria)
  );
}

function addModelStratum(terria, model, stratumId, force, initSource) {
  const models = initSource.models;

  const id = model.uniqueId;
  if (models[id] !== undefined) {
    return;
  }

  const stratum = model.strata.get(stratumId);
  const dereferenced = model.target;
  const dereferencedStratum = dereferenced
    ? dereferenced.strata.get(stratumId)
    : undefined;

  if (!force && stratum === undefined && dereferencedStratum === undefined) {
    return;
  }

  if (!isShareable(terria)(model.uniqueId)) {
    return;
  }

  models[id] = stratum ? saveStratumToJson(model.traits, stratum) : {};

  if (dereferenced && dereferencedStratum) {
    models[id].dereferenced = saveStratumToJson(
      dereferenced.traits,
      dereferencedStratum
    );
  }

  if (
    model.knownContainerUniqueIds &&
    model.knownContainerUniqueIds.length > 0
  ) {
    models[id].knownContainerUniqueIds = model.knownContainerUniqueIds.slice();
  }

  if (models[id].members) {
    models[id].members = models[id].members.filter(isShareable(terria));
  }

  models[id].type = model.type;
}

/**
 * Returns a function which determines whether a modelId represents a model that can be shared
 * @param  {Object} terria The Terria object.
 * @return {Function} The function which determines whether a modelId can be shared
 */
export function isShareable(terria) {
  return function(modelId) {
    const model = terria.getModelById(BaseModel, modelId);
    return defined(model) && !model.hasLocalData;
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
export function addUserAddedCatalog(terria, initSources) {
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
function addViewSettings(terria, viewState, initSource) {
  const viewer = terria.mainViewer;

  const time = {
    dayNumber: terria.timelineClock.currentTime.dayNumber,
    secondsOfDay: terria.timelineClock.currentTime.secondsOfDay
  };

  let viewerMode;
  if (terria.mainViewer.viewerMode === "cesium") {
    if (terria.mainViewer.viewerOptions.useTerrain) {
      viewerMode = "3d";
    } else {
      viewerMode = "3dSmooth";
    }
  } else {
    viewerMode = "2d";
  }

  initSource.initialCamera = terria.currentViewer
    .getCurrentCameraView()
    .toJson();
  initSource.homeCamera = terria.mainViewer.homeCamera.toJson();
  initSource.baseMaps = {};
  if (viewer.baseMap !== undefined) {
    initSource.baseMaps.defaultBaseMapId = viewer.baseMap.uniqueId;
  }
  if (terria.previewBaseMapId !== undefined) {
    initSource.baseMaps.previewBaseMapId = terria.previewBaseMapId;
  }
  initSource.viewerMode = viewerMode;
  initSource.currentTime = time;
  initSource.showSplitter = terria.showSplitter;
  initSource.splitPosition = terria.splitPosition;

  if (defined(viewState)) {
    const itemIdToUse = viewState.viewingUserData()
      ? defined(viewState.userDataPreviewedItem) &&
        viewState.userDataPreviewedItem.uniqueId
      : defined(viewState.previewedItem) && viewState.previewedItem.uniqueId;

    // don't persist the not-visible-to-user previewed id in the case of sharing from outside the catalog
    if (viewState.explorerPanelIsVisible && itemIdToUse) {
      initSource.previewedItemId = itemIdToUse;
    }
  }
}

/**
 * Add details of currently picked features.
 * @private
 */
function addFeaturePicking(terria, initSource) {
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

    initSource.pickedFeatures = pickedFeatures;
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
  if (terria.timelineStack.topLayer) {
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

function addStories(terria, initSource) {
  if (defined(terria.stories)) {
    initSource.stories = terria.stories.slice();
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
