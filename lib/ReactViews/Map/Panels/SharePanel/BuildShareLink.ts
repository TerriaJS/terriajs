import { uniq } from "lodash-es";
import { computed, runInAction, toJS } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import URI from "urijs";
import getDereferencedIfExists from "../../../../Core/getDereferencedIfExists";
import hashEntity from "../../../../Core/hashEntity";
import isDefined from "../../../../Core/isDefined";
import CatalogMemberMixin from "../../../../ModelMixins/CatalogMemberMixin";
import ReferenceMixin from "../../../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../../Models/Definition/Model";
import saveStratumToJson from "../../../../Models/Definition/saveStratumToJson";
import GlobeOrMap from "../../../../Models/GlobeOrMap";
import { HashParams } from "../../../../Models/HashParams";
import HasLocalData from "../../../../Models/HasLocalData";
import {
  InitSourceData,
  InitSourcePickedFeatures,
  ShareInitSourceData,
  ViewModeJson
} from "../../../../Models/InitSource";
import ShareDataService from "../../../../Models/ShareDataService";
import Terria from "../../../../Models/Terria";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import Result from "../../../../Core/Result";
import { JsonObject } from "../../../../Core/Json";

const hashParamsToShare = ["hideExplorerPanel"] as const;

export const SHARE_VERSION = "8.0.0";

export function encodeHashParams(
  hashParams: Partial<HashParams>,
  paramsToEncode: (keyof HashParams)[] = [
    "clean",
    "hideWelcomeMessage",
    "map",
    "ignoreErrors",
    "hideWorkbench",
    "hideExplorerPanel",
    "configUrl",
    "tools",
    "initFragments",
    "extra"
  ]
): Record<string, string> {
  const {
    clean,
    hideWelcomeMessage,
    map,
    ignoreErrors,
    hideWorkbench,
    hideExplorerPanel,
    configUrl,
    tools,
    initFragments = [],
    extra = {}
  } = hashParams;

  const encoded: Record<string, string> = {
    ...(clean ? { clean: "" } : {}),
    ...(hideWelcomeMessage ? { hideWelcomeMessage: "" } : {}),
    ...(map ? { map } : {}),
    ...(ignoreErrors ? { ignoreErrors: "" } : {}),
    ...(hideWorkbench ? { hideWorkbench: "" } : {}),
    ...(hideExplorerPanel ? { hideExplorerPanel: "" } : {}),
    ...(configUrl ? { configUrl } : {}),
    ...(tools ? { tools: "" } : {})
  };

  for (const key of Object.keys(encoded)) {
    if (!paramsToEncode.includes(key as keyof HashParams)) {
      delete encoded[key];
    }
  }

  if (paramsToEncode.includes("initFragments")) {
    for (const initFragment of initFragments) {
      encoded[initFragment] = "";
    }
  }

  if (paramsToEncode.includes("extra")) {
    for (const [key, value] of Object.entries(extra)) {
      encoded[key] = value as string;
    }
  }

  return encoded;
}

export interface IShareLinkService {
  canShorten: boolean;
  shouldShorten: boolean;
  shareMaxRequestSize: string | undefined;
  shareMaxRequestSizeBytes: number | undefined;
  buildShareLink(
    viewState?: ViewState,
    options?: { includeStories: boolean }
  ): Promise<string>;
  resolveShareLink(shareToken: string): Promise<Result<JsonObject | undefined>>;
}

export class ShareLinkService implements IShareLinkService {
  private _shareDataService: ShareDataService | undefined;
  private _terria: Terria;
  private _hashParams: Partial<HashParams>;

  constructor(
    terria: Terria,
    shareDataService?: ShareDataService,
    hashParams?: Partial<HashParams>
  ) {
    this._terria = terria;
    this._hashParams = hashParams ?? {};
    this._shareDataService = shareDataService;
  }

  /**
   * Is it currently possible to generate short URLs?
   */
  get canShorten(): boolean {
    return !!this._shareDataService && !!this._shareDataService.isUsable;
  }

  @computed
  get shouldShorten(): boolean {
    return this.canShorten && !!this._terria.configParameters.shortenShareUrls;
  }

  get shareDataService(): ShareDataService | undefined {
    return this._shareDataService;
  }

  get shareMaxRequestSize(): string | undefined {
    return this._shareDataService?.shareMaxRequestSize;
  }

  get shareMaxRequestSizeBytes(): number | undefined {
    return this._shareDataService?.shareMaxRequestSizeBytes;
  }

  /**
   * Builds a share link that reflects the state of the passed Terria instance.
   * If `terria.configParameters.shortenShareUrls` is true and a `ShareDataService` is available, the share link will be shortened using the `ShareDataService`.
   * Otherwise, the share link will include the full share data in the URL.
   */
  async buildShareLink(
    viewState?: ViewState,
    options = { includeStories: true }
  ): Promise<string> {
    const shareData = getShareData(this._terria, viewState, options);

    if (this.shouldShorten) {
      const token = await this._shareDataService!.getShareToken(shareData);
      if (typeof token === "string") {
        return this.buildBaseShareUrl(this._terria, {
          share: token
        });
      }
    }
    return this.buildBaseShareUrl(this._terria, {
      start: JSON.stringify(getShareData(this._terria, viewState, options))
    });
  }

  async resolveShareLink(
    shareToken: string
  ): Promise<Result<JsonObject | undefined>> {
    if (!this._shareDataService) {
      return Result.error(
        new Error("No ShareDataService available to resolve share link")
      );
    }
    try {
      const shareData = await this._shareDataService.resolveData(shareToken);
      return new Result(shareData);
    } catch (error) {
      return Result.error(
        new Error(
          `Failed to resolve share link: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  /** Create base share link URL - with `hashParameters` applied on top.
   * This will copy over some hash params - see `configParamsToShare`
   */
  private buildBaseShareUrl(terria: Terria, extraParams: Partial<HashParams>) {
    const uri = new URI(document.baseURI).fragment("").search("");

    if (terria.developmentEnv) {
      const params = encodeHashParams(this._hashParams);

      uri.addSearch(params);
    } else {
      const params = encodeHashParams(this._hashParams, [
        ...hashParamsToShare,
        "initFragments"
      ]);

      uri.addSearch(params);
    }

    uri.addSearch(extraParams);

    return uri.fragment(uri.query()).query("").toString();
  }
}

/**
 * Returns just the JSON that defines the current view.
 * @param  {Terria} terria The Terria object.
 * @param  {ViewState} [viewState] Current viewState.
 * @return {Object}
 */
export function getShareData(
  terria: Terria,
  viewState?: ViewState,
  options = { includeStories: true }
): ShareInitSourceData {
  return runInAction(() => {
    const { includeStories } = options;
    const initSource: InitSourceData = {};
    const initSources = [initSource];

    addStratum(terria, CommonStrata.user, initSource);
    addWorkbench(terria, initSource);
    addTimelineItems(terria, initSource);
    addViewSettings(terria, viewState, initSource);
    addFeaturePicking(terria, initSource);
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
 * @param {Terria} terria
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

  terria.modelValues.forEach((model) => {
    if (model.uniqueId === GlobeOrMap.featureHighlightID) return;
    const force = terria.workbench.contains(model);
    addModelStratum(terria, model, stratumId, force, initSource);
  });

  // Go through knownContainerUniqueIds and make sure they exist in models
  Object.keys(initSource.models).forEach((modelId) => {
    const model = terria.getModelById(BaseModel, modelId);
    if (model)
      model.completeKnownContainerUniqueIds.forEach((containerId) => {
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

  const members = toJS(models[id].members);

  if (Array.isArray(members)) {
    models[id].members = uniq(
      models[id].members?.filter((member) =>
        typeof member === "string" ? isShareable(terria)(member) : false
      )
    );
  }

  models[id].type = model.type;
}

/**
 * Returns a function which determines whether a modelId represents a model that can be shared
 * @param  {Object} terria The Terria object.
 * @return {Function} The function which determines whether a modelId can be shared
 */
export function isShareable(terria: Terria) {
  return function (modelId: string) {
    const model = terria.getModelById(BaseModel, modelId);

    if (CatalogMemberMixin.isMixedInto(model) && !model.shareable) {
      return false;
    }

    // If this is a Reference, then use the model.target, otherwise use the model
    const dereferenced =
      typeof model === "undefined"
        ? model
        : getDereferencedIfExists(terria.getModelById(BaseModel, modelId)!);

    if (
      CatalogMemberMixin.isMixedInto(dereferenced) &&
      !dereferenced.shareable
    ) {
      return false;
    }

    return (
      model &&
      ((HasLocalData.is(dereferenced) && !dereferenced.hasLocalData) ||
        !HasLocalData.is(dereferenced))
    );
  };
}

/**
 * Adds the details of the current view to the init sources.
 * @private
 */
function addViewSettings(
  terria: Terria,
  viewState?: ViewState,
  initSource: InitSourceData = {}
) {
  const viewer = terria.mainViewer;

  let viewerMode: ViewModeJson;
  if (terria.mainViewer.viewerMode === ViewerMode.Cesium) {
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
  initSource.viewerMode = viewerMode;

  initSource.showSplitter = terria.configParameters.showSplitter;
  initSource.splitPosition = terria.configParameters.splitPosition;

  initSource.settings = {
    baseMaximumScreenSpaceError:
      terria.configParameters.baseMaximumScreenSpaceError,
    useNativeResolution: terria.configParameters.useNativeResolution,
    alwaysShowTimeline: terria.timelineStack.alwaysShowingTimeline,
    baseMapId: viewer.baseMap?.uniqueId,
    terrainSplitDirection: terria.configParameters.terrainSplitDirection,
    depthTestAgainstTerrainEnabled:
      terria.configParameters.depthTestAgainstTerrainEnabled
  };

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
        hash: hashEntity(terria.selectedFeature, terria)
      };
    }

    // Remember the ids of vector features only, the raster ones we can reconstruct from providerCoords.
    pickedFeatures.entities = terria.pickedFeatures.features
      .filter((feature) => !isDefined(feature.imageryLayer?.imageryProvider))
      .map((entity) => {
        return {
          name: entity.name,
          hash: hashEntity(entity, terria)
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
