import PickedFeatures from "../Map/PickedFeatures/PickedFeatures";
import { observable, makeObservable } from "mobx";
import ViewState from "../ReactViewModels/ViewState";
import { ReactNode } from "react";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";

interface Options {
  onCancel?: () => void;
  message: string;
  messageAsNode?: ReactNode;

  /**
   * The component used for rendering the UI when this MapInteractionMode is
   * active. Defaults to "default".
   */
  panel?: string;

  /**
   * Only used by the "default" UI panel to insert custom UI elements in the
   * default panel.
   */
  customUi?: () => unknown;

  buttonText?: string;
  onEnable?: (viewState: ViewState) => void;
  invisible?: boolean;

  /**
   * When true, in 3D mode, `pickedFeatures.scenePosition`, `PickEvent.scenePosition`
   * and `MouseMoveEvent.scenePosition` will be set. This is opt-in because scene
   * picking is costlier than globe picking.
   */
  enableScenePicking?: boolean;
}

/**
 * Details of a mouse move over the map, passed to {@link MapInteractionMode.mouseMoveEvent}
 * listeners.
 *
 * The positions are scratch objects that are re-used for the next event - clone
 * them if you need to keep them beyond the listener call.
 */
export interface MouseMoveEventProps {
  /**
   * The position on the globe surface (including terrain) under the mouse.
   */
  globePosition: Cartesian3;

  /**
   * The position of the mouse in container/screen coordinates.
   */
  screenPosition: Cartesian2;

  /**
   * The position on the nearest scene feature (3D tiles, primitives, terrain)
   * under the mouse. Only set in 3D mode when `enableScenePicking` is true and
   * the mouse is over something pickable.
   */
  scenePosition?: Cartesian3;
}

/**
 * Details of a pick on the map, passed to {@link MapInteractionMode.pickEvent}
 * listeners.
 */
export interface PickEventProps {
  /**
   * The position on the globe surface (including terrain) that was picked.
   */
  globePosition?: Cartesian3;

  /**
   * The position on the nearest scene feature (3D tiles, primitives, terrain)
   * that was picked. Only set in 3D mode when `enableScenePicking` is true and
   * something pickable was under the cursor.
   */
  scenePosition?: Cartesian3;
}

/**
 * A mode for interacting with the map.
 */
export default class MapInteractionMode {
  readonly onCancel?: () => void;

  readonly buttonText: string;

  @observable
  invisible: boolean;

  @observable
  message: () => string;

  @observable
  messageAsNode: () => ReactNode;

  @observable
  pickedFeatures?: PickedFeatures;

  onEnable?: (viewState: ViewState) => void;

  /**
   * The component used for rendering the UI when this MapInteractionMode is active.
   *
   * The "default" panel {@link DefaultMapInteractionModePanel} renders a small
   * floating UI at the top-center of the map. To use a different UI, register a
   * new panel type by calling {@link registerMapInteractionModePanel} and pass
   * its id as the `panel` option.
   */
  @observable
  panel: string;

  /**
   * Only used by the "default" UI panel to insert custom UI elements in the
   * default panel.
   */
  @observable
  customUi: (() => any) | undefined;

  /**
   * Raised when the user picks a position on the map while this interaction mode
   * is active. Raised for both 2D and 3D maps, at the same time as
   * {@link MapInteractionMode.pickedFeatures} is set.
   */
  readonly pickEvent: CesiumEvent<(props: PickEventProps) => void> =
    new CesiumEvent();

  /**
   * Raised when the user moves the mouse over the map while this interaction
   * mode is active. Raised for both 2D and 3D maps.
   *
   * The event is throttled to at most one per animation frame, and is not
   * raised at all when there are no listeners.
   */
  readonly mouseMoveEvent: CesiumEvent<(props: MouseMoveEventProps) => void> =
    new CesiumEvent();

  /**
   * When true, in 3D mode, `pickedFeatures.scenePosition`,
   * `PickEvent.scenePosition` and `MouseMoveEvent.scenePosition` will be set.
   * This is opt-in because scene picking is costlier than globe picking.
   */
  enableScenePicking: boolean;

  constructor(options: Options) {
    makeObservable(this);
    /**
     * Gets or sets a callback that is invoked when the user cancels the interaction mode.  If this property is undefined,
     * the interaction mode cannot be canceled.
     */
    this.onCancel = options.onCancel;

    /**
     * Gets or sets the details of a custom user interface for this map interaction mode. This property is not used by
     * the `MapInteractionMode` itself, so it can be anything that is suitable for the user interface. In the standard
     * React-based user interface included with TerriaJS, this property is a function that is called with no parameters
     * and is expected to return a React component.
     */
    this.customUi = options.customUi;

    /**
     * Gets or sets the html formatted message displayed on the map when in this mode.
     */
    this.message = function () {
      return options.message;
    };

    /**
     * Gets or sets the react node displayed on the map when in this mode.
     */
    this.messageAsNode = function () {
      return options.messageAsNode;
    };

    /**
     * Set the text of the button for the dialog the message is displayed on.
     */
    this.buttonText = options.buttonText ?? "Cancel";

    /**
     * Gets or sets the features that are currently picked.
     */
    this.pickedFeatures = undefined;

    /**
     * Determines whether a rectangle will be requested from the user rather than a set of pickedFeatures.
     */
    // this.drawRectangle = options.drawRectangle ?? false;
    this.onEnable = options.onEnable;

    this.invisible = options.invisible ?? false;

    /**
     * Component to use for rendering the map interaction panel.
     * Custom panels can be registered using {@link registerMapInteractionModePanel}
     */
    this.panel = options.panel ?? "default";

    this.enableScenePicking = options.enableScenePicking ?? false;
  }
}
