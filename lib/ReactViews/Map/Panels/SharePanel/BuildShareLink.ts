"use strict";

import { runInAction } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import URI from "urijs";
import hashEntity from "../../../../Core/hashEntity";
import isDefined from "../../../../Core/isDefined";
import { isJsonArray } from "../../../../Core/Json";
import ReferenceMixin from "../../../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../../Models/Definition/Model";
import saveStratumToJson from "../../../../Models/Definition/saveStratumToJson";
import GlobeOrMap from "../../../../Models/GlobeOrMap";
import HasLocalData from "../../../../Models/HasLocalData";
import {
  InitSourceData,
  InitSourcePickedFeatures,
  ViewModeJson
} from "../../../../Models/InitSource";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";

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
  terria: Terria,
  viewState: ViewState,
  options = { includeStories: true }
) {
  const uri = new URI(window.location).fragment("").search({
    start: JSON.stringify(getShareData(terria, viewState, options))
  });

  userPropWhiteList.forEach(key =>
    uri.addSearch({ key: terria.userProperties.get(key) })
  );
  return uri
    .fragment(uri.query())
    .query("")
    .toString(); // replace ? with #
}

/**
 * Returns just the JSON that defines the current view.
 * @param  {import("../../../../Models/Terria").default} terria The Terria object.
 * @param  {ViewState} [viewState] Current viewState.
 * @return {Object}
 */
export function getShareData(
  terria: Terria,
  viewState: ViewState,
  options = { includeStories: true }
) {
  return runInAction(() => {
    const { includeStories } = options;
    const initSource: InitSourceData = {};
    const initSources = [initSource]; // includeStories ? terria.initSources.slice() : [];

    addStratum(terria, CommonStrata.user, initSource);
    addWorkbench(terria, initSource);
    addTimelineItems(terria, initSource);
    addViewSettings(terria, viewState, initSource);
    addFeaturePicking(terria, initSource);
    addBaseMaps(terria, initSource);
    if (includeStories) {
      // info that are not needed in scene share data
      addStories(terria, initSource);
    }

    return {
      version: SHARE_VERSION,
      initSources: initSources
    };
  });
}

/**
 * Serialise all model data from a given stratum except feature highlight
 * and serialise all ancestors of any models serialised
 * @param {import("../../../../Models/Terria").default} terria
 * @param {CommonStrata} stratumId
 * @param {Object} initSource
 */
function addStratum(
  terria: Terria,
  stratumId: string,
  initSource: InitSourceData
) {
  initSource.stratum = stratumId;
  initSource.models = {};

  terria.modelValues.forEach(model => {
    if (model.uniqueId === GlobeOrMap.featureHighlightID) return;
    const force = terria.workbench.contains(model);
    addModelStratum(terria, model, stratumId, force, initSource);
  });

  // Go through knownContainerUniqueIds and make sure they exist in models
  Object.keys(initSource.models).forEach(modelId => {
    const model = terria.getModelById(BaseModel, modelId);
    if (model)
      model.completeKnownContainerUniqueIds.forEach(containerId => {
        if (!initSource.models?.[containerId]) {
          const containerModel = terria.getModelById(BaseModel, containerId);
          if (containerModel)
            addModelStratum(
              terria,
              containerModel,
              stratumId,
              true,
              initSource
            );
        }
      });
  });
}

function addBaseMaps(terria: Terria, initSource: InitSourceData) {}

function addWorkbench(terria: Terria, initSource: InitSourceData) {
  initSource.workbench = terria.workbench.itemIds.filter(isShareable(terria));
}

function addTimelineItems(terria: Terria, initSources: InitSourceData) {
  initSources.timeline = terria.timelineStack.itemIds.filter(
    isShareable(terria)
  );
}

function addModelStratum(
  terria: Terria,
  model: BaseModel,
  stratumId: string,
  force: boolean,
  initSource: InitSourceData
) {
  const models = initSource.models;

  const id = model.uniqueId;

  if (!id || !models || models?.[id] !== undefined) {
    return;
  }

  const stratum = model.strata.get(stratumId);
  const dereferenced = ReferenceMixin.isMixedInto(model)
    ? model.target
    : undefined;
  const dereferencedStratum = dereferenced
    ? dereferenced.strata.get(stratumId)
    : undefined;

  if (!force && stratum === undefined && dereferencedStratum === undefined) {
    return;
  }

  if (!isShareable(terria)(id)) {
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

  if (isJsonArray(models[id].members)) {
    models[id].members = models[id].members?.filter(isShareable(terria));
  }

  models[id].type = model.type;
}

/**
 * Returns a function which determines whether a modelId represents a model that can be shared
 * @param  {Object} terria The Terria object.
 * @return {Function} The function which determines whether a modelId can be shared
 */
export function isShareable(terria: Terria) {
  return function(modelId: string) {
    const model = terria.getModelById(BaseModel, modelId);
    return (
      model &&
      ((HasLocalData.is(model) && !model.hasLocalData) ||
        !HasLocalData.is(model))
    );
  };
}

/**
 * Is it currently possible to generate short URLs?
 * @param  {Object} terria The Terria object.
 * @return {Boolean}
 */
export function canShorten(terria: Terria) {
  return terria.shareDataService && terria.shareDataService.isUsable;
}

/**
 * Like {@link buildShareLink}, but shortens the result using {@link Terria#urlShortener}.
 *
 * @returns {Promise<String>} A promise that will return the shortened url when complete.
 */
export function buildShortShareLink(
  terria: Terria,
  viewState: ViewState,
  options = { includeStories: true }
) {
  const urlFromToken = (token: string) =>
    new URI(window.location).fragment("share=" + token).toString();
  if (isDefined(terria.shareDataService)) {
    return terria.shareDataService
      ?.getShareToken(getShareData(terria, viewState, options))
      .then(urlFromToken);
  }
}

/**
 * Adds the details of the current view to the init sources.
 * @private
 */
function addViewSettings(
  terria: Terria,
  viewState: ViewState,
  initSource: InitSourceData
) {
  const viewer = terria.mainViewer;

  // const time = {
  //   dayNumber: terria.timelineClock.currentTime.dayNumber,
  //   secondsOfDay: terria.timelineClock.currentTime.secondsOfDay
  // };

  let viewerMode: ViewModeJson;
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
  if (terria.baseMapsModel.previewBaseMapId !== undefined) {
    initSource.baseMaps.previewBaseMapId =
      terria.baseMapsModel.previewBaseMapId;
  }
  initSource.viewerMode = viewerMode;
  // initSource.currentTime = time;
  initSource.showSplitter = terria.showSplitter;
  initSource.splitPosition = terria.splitPosition;

  if (isDefined(viewState)) {
    const itemIdToUse = viewState.viewingUserData()
      ? isDefined(viewState.userDataPreviewedItem) &&
        viewState.userDataPreviewedItem.uniqueId
      : isDefined(viewState.previewedItem) && viewState.previewedItem.uniqueId;

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
function addFeaturePicking(terria: Terria, initSource: InitSourceData) {
  if (
    isDefined(terria.pickedFeatures) &&
    terria.pickedFeatures.features.length > 0 &&
    terria.pickedFeatures.pickPosition
  ) {
    const positionInRadians = Ellipsoid.WGS84.cartesianToCartographic(
      terria.pickedFeatures.pickPosition
    );

    const pickedFeatures: InitSourcePickedFeatures = {
      providerCoords: terria.pickedFeatures.providerCoords,
      pickCoords: {
        lat: CesiumMath.toDegrees(positionInRadians.latitude),
        lng: CesiumMath.toDegrees(positionInRadians.longitude),
        height: positionInRadians.height
      }
    };

    if (isDefined(terria.selectedFeature)) {
      // Sometimes features have stable ids and sometimes they're randomly generated every time, so include both
      // id and name as a fallback.
      pickedFeatures.current = {
        name: terria.selectedFeature.name,
        hash: hashEntity(terria.selectedFeature, terria.timelineClock)
      };
    }

    // Remember the ids of vector features only, the raster ones we can reconstruct from providerCoords.
    pickedFeatures.entities = terria.pickedFeatures.features
      .filter(feature => !isDefined(feature.imageryLayer))
      .map(entity => {
        return {
          name: entity.name,
          hash: hashEntity(entity, terria.timelineClock)
        };
      });

    initSource.pickedFeatures = pickedFeatures;
  }
}

function addStories(terria: Terria, initSource: InitSourceData) {
  if (isDefined(terria.stories)) {
    initSource.stories = terria.stories.slice();
  }
}
