import createGuid from "terriajs-cesium/Source/Core/createGuid";
import TerriaError from "../../../Core/TerriaError";
import Terria from "../../../Models/Terria";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import { IconGlyph } from "../../../Styled/Icon";
import MapNavigationItemController from "../MapNavigationItemController";
import { NavigationItemLocation } from "../MapNavigationModel";

interface SimpleButton {
  /**
   * Removes the button from the toolbar
   */
  removeButton: () => void;
}

interface SimpleButtonOptions extends BaseButtonOptions {
  /**
   * Called when user clicks the button
   */
  onClick: () => void;
}

interface ModeButton {
  /**
   * Removes the button from the toolbar
   */
  removeButton: () => void;

  /**
   * Closes the mode if it is open
   */
  closeMode: () => void;
}

interface ModeButtonOptions extends BaseButtonOptions {
  /**
   * Called when user enters the mode
   */
  onUserEnterMode: () => void;

  /**
   * Called when user leaves the mode by toggling the mode button
   */
  onUserCloseMode: () => void;
}

export interface BaseButtonOptions {
  /**
   * Button text
   */
  text: string;

  /**
   * Button icon
   */
  icon: IconGlyph;

  /**
   * Button tooltip
   */
  tooltip?: string;

  /**
   * The toolbar has 2 groups, TOP and BOTTOM (BOTTOM is where you will find the feedback button)
   * `position` indicates where to place the button.
   */
  position?: NavigationItemLocation;

  /**
   * A numeric order of the button
   */
  order?: number;

  /**
   * Whether the button should be visible in 2d, 3d or otherwise any map mode.
   */
  mapMode?: ButtonMapMode;
}

/**
 * The map modes in which a nav buttons will be visible
 */
export type ButtonMapMode = "2d" | "3d" | "any";

/**
 * Add a simple clickable button to the map toolbar. This button is useful for performing some action when the user clicks on it.
 *
 * @param viewState - The {@link ViewState} instance
 * @param options - Options for the simple clickable button
 * @returns A simple button instance with a method to remove the button from the toolbar.
 *
 * @example
 * ```ts
 *   const locationButton = MapToolbar.addButton(viewState, {
 *     text: "My location",
 *     tooltip: "Mark your current location on the map",
 *     icon: Icon.GLYPH.location,
 *     onClick: () => {
 *       // code to show marker
 *     }
 *   })
 *   // and later
 *   locationButton.removeButton();
 * ```
 */
export function addButton(
  viewState: ViewState,
  options: SimpleButtonOptions
): SimpleButton {
  const terria = viewState.terria;
  const id = createGuid();
  const { icon, mapMode, onClick } = options;
  const controller = new SimpleButtonController(terria, {
    icon,
    mapMode,
    onClick
  });

  terria.mapNavigationModel.addItem({
    id,
    name: options.text,
    title: options.tooltip,
    location: options.position ?? "TOP",
    order: options.order ?? terria.mapNavigationModel.items.length,
    controller
  });

  return {
    removeButton: () => terria.mapNavigationModel.remove(id)
  };
}

/**
 * Add a mode button to the map toolbar. This button is useful for launching tools that have an open and close mode.
 *
 * @param viewState - The {@link ViewState} instance
 * @param options - Options for the simple mode button
 * @returns A mode button instance with a method to remove the button from the toolbar.
 *
 * @example
 * ```ts
 *   const pedestrianButton = MapToolbar.addModeButton(viewState, {
 *     text: "Pedestrian mode",
 *     tooltip: "Use keyboard navigation to walk and fly around the map",
 *     icon: Icon.GLYPH.pedestrian,
 *     onUserEnterMode: () => {
 *       // code to put the map in pedestrian mode
 *     },
 *     onUserCloseMode: () => {
 *       // code to run when user closes the mode by toggling the button
 *     }
 *   })
 *   // and later, to close the mode from some other part of the UI
 *   pedestrianButton.closeMode();
 * ```
 */
export function addModeButton(
  viewState: ViewState,
  options: ModeButtonOptions
): ModeButton {
  const terria = viewState.terria;
  const id = createGuid();
  const { icon, mapMode, onUserEnterMode, onUserCloseMode } = options;
  const controller = new ModalButtonController(terria, {
    icon,
    mapMode,
    onUserEnterMode,
    onUserCloseMode
  });

  terria.mapNavigationModel.addItem({
    id,
    name: options.text,
    title: options.tooltip,
    location: options.position ?? "TOP",
    order: options.order,
    controller
  });

  return {
    removeButton: () => terria.mapNavigationModel.remove(id),
    closeMode: () => controller.closeMode()
  };
}

interface SimpleButtonControllerOptions {
  icon: IconGlyph;
  mapMode?: ButtonMapMode;
  onClick: () => void;
}

/**
 * A simple button controller
 */
class SimpleButtonController extends MapNavigationItemController {
  constructor(
    readonly terria: Terria,
    readonly options: SimpleButtonControllerOptions
  ) {
    super();
  }

  get glyph(): { id: string } {
    return this.options.icon;
  }

  get viewerMode(): ViewerMode | undefined {
    const mapMode = this.options.mapMode;
    return mapMode === "2d"
      ? ViewerMode.Leaflet
      : mapMode === "3d"
      ? ViewerMode.Cesium
      : undefined;
  }

  handleClick() {
    try {
      this.options.onClick();
    } catch (err) {
      this.terria.raiseErrorToUser(TerriaError.from(err));
    }
    super.handleClick();
  }
}

interface ModalButtonControllerOptions {
  icon: IconGlyph;
  mapMode?: ButtonMapMode;
  onUserEnterMode: () => void;
  onUserCloseMode: () => void;
}

/**
 * A modal button controller
 */
class ModalButtonController extends MapNavigationItemController {
  constructor(
    readonly terria: Terria,
    readonly options: ModalButtonControllerOptions
  ) {
    super();
  }

  get glyph(): { id: string } {
    return this.options.icon;
  }

  get viewerMode(): ViewerMode | undefined {
    const mapMode = this.options.mapMode;
    return mapMode === "2d"
      ? ViewerMode.Leaflet
      : mapMode === "3d"
      ? ViewerMode.Cesium
      : undefined;
  }

  activate() {
    try {
      this.options.onUserEnterMode();
    } catch (err) {
      this.terria.raiseErrorToUser(TerriaError.from(err));
      return;
    }
    super.activate();
  }

  deactivate() {
    try {
      this.options.onUserCloseMode();
    } catch (err) {
      this.terria.raiseErrorToUser(TerriaError.from(err));
    }
    super.deactivate();
  }

  closeMode() {
    super.deactivate();
  }
}
