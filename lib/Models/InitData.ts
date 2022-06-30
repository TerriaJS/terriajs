import { runInAction, toJS, when } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import getDereferencedIfExists from "../Core/getDereferencedIfExists";
import isDefined from "../Core/isDefined";
import {
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  JsonObject
} from "../Core/Json";
import Result from "../Core/Result";
import TerriaError, { TerriaErrorSeverity } from "../Core/TerriaError";
import { loadPickedFeaturesFromJson } from "../Map/PickedFeatures/PickedFeatures";
import { getName } from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeVarying from "../ModelMixins/TimeVarying";
import CameraView from "./CameraView";
import CatalogMemberFactory from "./Catalog/CatalogMemberFactory";
import SplitItemReference from "./Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "./Definition/CommonStrata";
import { BaseModel } from "./Definition/Model";
import updateModelFromJson from "./Definition/updateModelFromJson";
import upsertModelFromJson from "./Definition/upsertModelFromJson";
import { InitSourceData } from "./InitSource";
import NoViewer from "./NoViewer";
import Terria from "./Terria";
import { isViewerMode, setViewerMode } from "./ViewerMode";

export async function applyInitData(
  terria: Terria,
  {
    initData,
    replaceStratum = false,
    canUnsetFeaturePickingState = false
  }: {
    initData: InitSourceData;
    replaceStratum?: boolean;
    // When feature picking state is missing from the initData, unset the state only if terria flag is true
    // This is for eg, set to true when switching through story slides.
    canUnsetFeaturePickingState?: boolean;
  }
): Promise<void> {
  const errors: TerriaError[] = [];

  initData = toJS(initData);

  const stratumId =
    typeof initData.stratum === "string"
      ? initData.stratum
      : CommonStrata.definition;

  // Extract the list of CORS-ready domains.
  if (Array.isArray(initData.corsDomains)) {
    terria.corsProxy.corsDomains.push(...(<string[]>initData.corsDomains));
  }

  // Add catalog members
  if (initData.catalog !== undefined) {
    terria.catalog.group
      .addMembersFromJson(stratumId, initData.catalog)
      .pushErrorTo(errors);
  }

  // Show/hide elements in mapNavigationModel
  if (isJsonObject(initData.elements)) {
    terria.elements.merge(initData.elements);
    // we don't want to go through all elements unless they are added.
    if (terria.mapNavigationModel.items.length > 0) {
      terria.elements.forEach((element, key) => {
        if (isDefined(element.visible)) {
          if (element.visible) {
            terria.mapNavigationModel.show(key);
          } else {
            terria.mapNavigationModel.hide(key);
          }
        }
      });
    }
  }

  // Add stories
  if (Array.isArray(initData.stories)) {
    terria.stories = initData.stories;
    terria.storyPromptShown++;
  }

  // Add map settings
  if (isJsonString(initData.viewerMode)) {
    const viewerMode = initData.viewerMode.toLowerCase();
    if (isViewerMode(viewerMode)) setViewerMode(viewerMode, terria.mainViewer);
  }

  if (isJsonObject(initData.baseMaps)) {
    terria.baseMapsModel
      .loadFromJson(CommonStrata.definition, initData.baseMaps)
      .pushErrorTo(errors, "Failed to load basemaps");
  }

  if (isJsonObject(initData.homeCamera)) {
    terria.loadHomeCamera(initData.homeCamera);
  }

  if (isJsonObject(initData.initialCamera)) {
    const initialCamera = CameraView.fromJson(initData.initialCamera);
    terria.currentViewer.zoomTo(initialCamera, 2.0);
  }

  if (isJsonBoolean(initData.showSplitter)) {
    terria.showSplitter = initData.showSplitter;
  }

  if (isJsonNumber(initData.splitPosition)) {
    terria.splitPosition = initData.splitPosition;
  }

  if (isJsonObject(initData.settings)) {
    if (isJsonNumber(initData.settings.baseMaximumScreenSpaceError)) {
      terria.setBaseMaximumScreenSpaceError(
        initData.settings.baseMaximumScreenSpaceError
      );
    }
    if (isJsonBoolean(initData.settings.useNativeResolution)) {
      terria.setUseNativeResolution(initData.settings.useNativeResolution);
    }
    if (isJsonBoolean(initData.settings.alwaysShowTimeline)) {
      terria.timelineStack.setAlwaysShowTimeline(
        initData.settings.alwaysShowTimeline
      );
    }
    if (isJsonString(initData.settings.baseMapId)) {
      terria.mainViewer.setBaseMap(
        terria.baseMapsModel.baseMapItems.find(
          item => item.item.uniqueId === initData.settings!.baseMapId
        )?.item
      );
    }
    if (isJsonNumber(initData.settings.terrainSplitDirection)) {
      terria.terrainSplitDirection = initData.settings.terrainSplitDirection;
    }
    if (isJsonBoolean(initData.settings.depthTestAgainstTerrainEnabled)) {
      terria.depthTestAgainstTerrainEnabled =
        initData.settings.depthTestAgainstTerrainEnabled;
    }
  }

  // Copy but don't yet load the workbench.
  const workbench = Array.isArray(initData.workbench)
    ? initData.workbench.slice()
    : [];

  const timeline = Array.isArray(initData.timeline)
    ? initData.timeline.slice()
    : [];

  // NOTE: after terria Promise, terria function is no longer an `@action`
  const models = initData.models;
  if (isJsonObject(models, false)) {
    await Promise.all(
      Object.keys(models).map(async modelId => {
        (
          await loadModelStratum(
            terria,
            modelId,
            stratumId,
            models,
            replaceStratum
          )
        ).pushErrorTo(errors);
      })
    );
  }

  runInAction(() => {
    if (isJsonString(initData.previewedItemId)) {
      terria.previewedItemId = initData.previewedItemId;
    }
  });

  // Set the new contents of the workbench.
  const newItemsRaw = filterOutUndefined(
    workbench.map(modelId => {
      if (typeof modelId !== "string") {
        errors.push(
          new TerriaError({
            sender: terria,
            title: "Invalid model ID in workbench",
            message: "A model ID in the workbench list is not a string."
          })
        );
      } else {
        return terria.getModelByIdOrShareKey(BaseModel, modelId);
      }
    })
  );

  const newItems: BaseModel[] = [];

  // Maintain the model order in the workbench.
  while (true) {
    const model = newItemsRaw.shift();
    if (model) {
      await pushAndLoadMapItems(model, newItems, errors);
    } else {
      break;
    }
  }

  runInAction(() => (terria.workbench.items = newItems));

  // For ids that don't correspond to models resolve an id by share keys
  const timelineWithShareKeysResolved = new Set(
    filterOutUndefined(
      timeline.map(modelId => {
        if (typeof modelId !== "string") {
          errors.push(
            new TerriaError({
              sender: terria,
              title: "Invalid model ID in timeline",
              message: "A model ID in the timneline list is not a string."
            })
          );
        } else {
          if (terria.getModelById(BaseModel, modelId) !== undefined) {
            return modelId;
          } else {
            return terria.getModelIdByShareKey(modelId);
          }
        }
      })
    )
  );

  // TODO: the timelineStack should be populated from the `timeline` property,
  // not from the workbench.
  runInAction(
    () =>
      (terria.timelineStack.items = terria.workbench.items
        .filter(item => {
          return (
            item.uniqueId && timelineWithShareKeysResolved.has(item.uniqueId)
          );
          // && TODO: what is a good way to test if an item is of type TimeVarying.
        })
        .map(item => <TimeVarying>item))
  );

  if (isJsonObject(initData.pickedFeatures)) {
    when(() => !(terria.currentViewer instanceof NoViewer)).then(() => {
      if (isJsonObject(initData.pickedFeatures)) {
        loadPickedFeaturesFromJson(terria, initData.pickedFeatures);
      }
    });
  } else if (canUnsetFeaturePickingState) {
    runInAction(() => {
      terria.pickedFeatures = undefined;
      terria.selectedFeature = undefined;
    });
  }

  if (errors.length > 0)
    throw TerriaError.combine(errors, {
      message: {
        key: "models.terria.loadingInitSourceErrorTitle"
      }
    });
}

async function loadModelStratum(
  terria: Terria,
  modelId: string,
  stratumId: string,
  allModelStratumData: JsonObject,
  replaceStratum: boolean
): Promise<Result<BaseModel | undefined>> {
  const thisModelStratumData = allModelStratumData[modelId] || {};
  if (!isJsonObject(thisModelStratumData)) {
    throw new TerriaError({
      sender: terria,
      title: "Invalid model traits",
      message: "The traits of a model must be a JSON object."
    });
  }

  const cleanStratumData = { ...thisModelStratumData };
  delete cleanStratumData.dereferenced;
  delete cleanStratumData.knownContainerUniqueIds;

  const errors: TerriaError[] = [];

  const containerIds = thisModelStratumData.knownContainerUniqueIds;
  if (Array.isArray(containerIds)) {
    // Groups that contain terria item must be loaded before terria item.
    await Promise.all(
      containerIds.map(async containerId => {
        if (typeof containerId !== "string") {
          return;
        }
        const container = (
          await loadModelStratum(
            terria,
            containerId,
            stratumId,
            allModelStratumData,
            replaceStratum
          )
        ).pushErrorTo(errors, `Failed to load container ${containerId}`);

        if (container) {
          const dereferenced = ReferenceMixin.isMixedInto(container)
            ? container.target
            : container;
          if (GroupMixin.isMixedInto(dereferenced)) {
            (await dereferenced.loadMembers()).pushErrorTo(
              errors,
              `Failed to load group ${dereferenced.uniqueId}`
            );
          }
        }
      })
    );
  }

  const model = (
    await terria.getModelByIdShareKeyOrCatalogIndex(modelId)
  ).pushErrorTo(errors);
  if (model?.uniqueId !== undefined) {
    // Update modelId from model sharekeys or CatalogIndex sharekeys
    modelId = model.uniqueId;
  }

  // If terria model is a `SplitItemReference` we must load the source item first
  const splitSourceId = cleanStratumData.splitSourceItemId;
  if (
    cleanStratumData.type === SplitItemReference.type &&
    typeof splitSourceId === "string"
  ) {
    (
      await loadModelStratum(
        terria,
        splitSourceId,
        stratumId,
        allModelStratumData,
        replaceStratum
      )
    ).pushErrorTo(errors, `Failed to load SplitItemReference ${splitSourceId}`);
  }

  const loadedModel = upsertModelFromJson(
    CatalogMemberFactory,
    terria,
    "/",
    stratumId,
    {
      ...cleanStratumData,
      id: modelId
    },
    {
      replaceStratum
    }
  ).pushErrorTo(errors);

  if (loadedModel && Array.isArray(containerIds)) {
    containerIds.forEach(containerId => {
      if (
        typeof containerId === "string" &&
        loadedModel.knownContainerUniqueIds.indexOf(containerId) < 0
      ) {
        loadedModel.knownContainerUniqueIds.push(containerId);
      }
    });
  }
  // If we're replacing the stratum and the existing model is already
  // dereferenced, we need to replace the dereferenced stratum, too,
  // even if there's no trace of it in the load data.
  let dereferenced: JsonObject | undefined = isJsonObject(
    thisModelStratumData.dereferenced
  )
    ? thisModelStratumData.dereferenced
    : undefined;
  if (
    loadedModel &&
    replaceStratum &&
    dereferenced === undefined &&
    ReferenceMixin.isMixedInto(loadedModel) &&
    loadedModel.target !== undefined
  ) {
    dereferenced = {};
  }
  if (loadedModel && ReferenceMixin.isMixedInto(loadedModel)) {
    (await loadedModel.loadReference()).pushErrorTo(
      errors,
      `Failed to load reference ${loadedModel.uniqueId}`
    );

    if (isDefined(loadedModel.target)) {
      updateModelFromJson(
        loadedModel.target,
        stratumId,
        dereferenced || {},
        replaceStratum
      ).pushErrorTo(
        errors,
        `Failed to update model from JSON: ${loadedModel.target!.uniqueId}`
      );
    }
  } else if (dereferenced) {
    throw new TerriaError({
      sender: terria,
      title: "Model cannot be dereferenced",
      message: `Model ${getName(
        loadedModel
      )} has a \`dereferenced\` property, but the model cannot be dereferenced.`
    });
  }

  if (loadedModel) {
    const dereferencedGroup = getDereferencedIfExists(loadedModel);
    if (GroupMixin.isMixedInto(dereferencedGroup)) {
      if (dereferencedGroup.isOpen) {
        (await dereferencedGroup.loadMembers()).pushErrorTo(
          errors,
          `Failed to open group ${dereferencedGroup.uniqueId}`
        );
      }
    }
  }

  return new Result(
    loadedModel,
    TerriaError.combine(errors, {
      // This will set TerriaErrorSeverity to Error if the model which FAILED to load is in the workbench.
      severity: () =>
        terria.workbench.items.find(
          workbenchItem => workbenchItem.uniqueId === modelId
        )
          ? TerriaErrorSeverity.Error
          : TerriaErrorSeverity.Warning,
      message: {
        key: "models.terria.loadModelErrorMessage",
        parameters: { model: modelId }
      }
    })
  );
}

async function pushAndLoadMapItems(
  model: BaseModel,
  newItems: BaseModel[],
  errors: TerriaError[]
) {
  if (ReferenceMixin.isMixedInto(model)) {
    (await model.loadReference()).pushErrorTo(errors);

    if (model.target !== undefined) {
      await pushAndLoadMapItems(model.target, newItems, errors);
    } else {
      errors.push(
        TerriaError.from(
          "Reference model has no target. Model Id: " + model.uniqueId
        )
      );
    }
  } else if (GroupMixin.isMixedInto(model)) {
    (await model.loadMembers()).pushErrorTo(errors);

    model.memberModels.map(async m => {
      await pushAndLoadMapItems(m, newItems, errors);
    });
  } else if (MappableMixin.isMixedInto(model)) {
    newItems.push(model);
    (await model.loadMapItems()).pushErrorTo(errors);
  } else {
    errors.push(
      TerriaError.from(
        "Can not load an un-mappable item to the map. Item Id: " +
          model.uniqueId
      )
    );
  }
}
