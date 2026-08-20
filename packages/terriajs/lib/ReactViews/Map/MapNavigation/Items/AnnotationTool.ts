import i18next from "i18next";
import { makeObservable, reaction, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import isDefined from "../../../../Core/isDefined";
import AnnotationCatalogItem from "../../../../Models/Catalog/CatalogItems/AnnotationCatalogItem";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import MapInteractionMode from "../../../../Models/MapInteractionMode";
import Terria from "../../../../Models/Terria";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../../../Styled/Icon";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";

export const ANNOTATION_TOOL_ID = "annotation-tool";
export const ANNOTATIONS_ITEM_ID = "__TERRIAJS-ANNOTATIONS__";

interface AnnotationToolOptions {
  terria: Terria;
  viewState: ViewState;
}

/**
 * Map navigation tool for creating text annotations. When active, clicking the map
 * places a marker and opens a rich-text editor; clicking an existing annotation lets
 * the user edit or delete it. Annotations are stored on a single
 * {@link AnnotationCatalogItem} on the workbench so they persist in share links and
 * render in both 2D and 3D.
 */
export class AnnotationTool extends MapNavigationItemController {
  static id = ANNOTATION_TOOL_ID;
  static displayName = "AnnotationTool";

  private readonly terria: Terria;
  private readonly viewState: ViewState;
  private pickMode?: MapInteractionMode;
  private disposePickSubscription?: () => void;

  constructor(props: AnnotationToolOptions) {
    super();
    this.terria = props.terria;
    this.viewState = props.viewState;
    makeObservable(this);
  }

  get glyph(): any {
    return GLYPHS.location;
  }

  get viewerMode(): ViewerMode | undefined {
    return undefined;
  }

  /**
   * @overrides
   */
  activate() {
    const item = this.getOrCreateItem();
    runInAction(() => {
      this.terria.pickedFeatures = undefined;
    });
    this.setCursor("crosshair");
    this.pickNextPoint(item);
    super.activate();
  }

  /**
   * @overrides
   */
  deactivate() {
    this.stopPicking();
    this.setCursor("auto");
    super.deactivate();
  }

  /** Get the shared annotations catalog item, creating and adding it if necessary. */
  private getOrCreateItem(): AnnotationCatalogItem {
    let item = this.terria.getModelById(
      AnnotationCatalogItem,
      ANNOTATIONS_ITEM_ID
    );
    if (item === undefined) {
      item = new AnnotationCatalogItem(ANNOTATIONS_ITEM_ID, this.terria);
      item.setTrait(
        CommonStrata.definition,
        "name",
        i18next.t(($) => $.annotations.name)
      );
      this.terria.addModel(item);
    }
    void this.terria.workbench.add(item);
    return item;
  }

  /**
   * Push a fresh interaction mode and listen for a single click, re-arming for the
   * next point once handled (mirrors the loop in {@link UserDrawing}).
   */
  private pickNextPoint(item: AnnotationCatalogItem): void {
    const pickMode = new MapInteractionMode({
      message: `<div><strong>${i18next.t(
        ($) => $.annotations.messageHeader
      )}</strong><br/><i>${i18next.t(
        ($) => $.annotations.clickToAdd
      )}</i></div>`,
      buttonText: i18next.t(($) => $.annotations.doneBtn),
      onCancel: () => {
        this.deactivate();
      },
      onEnable: (viewState: ViewState) => {
        runInAction(() => (viewState.explorerPanelIsVisible = false));
      }
    });
    this.pickMode = pickMode;
    runInAction(() => {
      this.terria.mapInteractionModeStack.push(pickMode);
    });

    this.disposePickSubscription = reaction(
      () => pickMode.pickedFeatures,
      async (pickedFeatures, _previous, thisReaction) => {
        if (!isDefined(pickedFeatures)) return;
        if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
          await pickedFeatures.allFeaturesAvailablePromise;
        }
        if (!isDefined(pickedFeatures.pickPosition)) return;

        thisReaction.dispose();

        // Did the user click an existing annotation marker?
        const clicked = pickedFeatures.features?.find((feature) =>
          isDefined(item.getAnnotation(String(feature.id)))
        );
        if (clicked) {
          this.openEditorForExisting(item, String(clicked.id));
        } else {
          this.openEditorForNew(item, pickedFeatures.pickPosition);
        }

        // Re-arm for the next point (the modal overlay blocks map clicks until
        // it is dismissed).
        runInAction(() => {
          this.terria.mapInteractionModeStack.pop();
        });
        this.pickNextPoint(item);
      }
    );
  }

  private openEditorForNew(
    item: AnnotationCatalogItem,
    pickPosition: Cartesian3
  ): void {
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(pickPosition);
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    this.viewState.openAnnotationEditor({
      initialText: "",
      isNew: true,
      onSave: (text: string) => {
        item.addAnnotation({ longitude, latitude, text });
      }
    });
  }

  private openEditorForExisting(item: AnnotationCatalogItem, id: string): void {
    const annotation = item.getAnnotation(id);
    this.viewState.openAnnotationEditor({
      initialText: annotation?.text ?? "",
      isNew: false,
      onSave: (text: string) => item.updateAnnotation(id, { text }),
      onDelete: () => item.removeAnnotation(id)
    });
  }

  private stopPicking(): void {
    this.disposePickSubscription?.();
    this.disposePickSubscription = undefined;
    runInAction(() => {
      const stack = this.terria.mapInteractionModeStack;
      if (this.pickMode && stack[stack.length - 1] === this.pickMode) {
        stack.pop();
      }
    });
    this.pickMode = undefined;
  }

  private setCursor(cursor: string): void {
    if (isDefined(this.terria.cesium)) {
      this.terria.cesium.cesiumWidget.canvas.setAttribute(
        "style",
        `cursor: ${cursor}`
      );
    } else if (isDefined(this.terria.leaflet)) {
      const container = document.getElementById("cesiumContainer");
      if (container !== null) {
        container.setAttribute("style", `cursor: ${cursor}`);
      }
    }
  }
}

export default AnnotationTool;
