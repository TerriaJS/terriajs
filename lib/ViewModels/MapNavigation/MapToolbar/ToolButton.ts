import { action, computed } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import TerriaError from "../../../Core/TerriaError";
import ViewerMode from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import MapNavigationItemController from "../MapNavigationItemController";
import { BaseButtonOptions } from "./Buttons";

export interface ToolButtonOptions<ToolProps = any> extends BaseButtonOptions {
  tool: {
    name: string;
    component: () =>
      | React.ComponentType<ToolProps>
      | Promise<React.ComponentType<ToolProps>>;
    props?: ToolProps;
  };
}

/**
 * ToolButton
 *
 */
export interface ToolButton<ToolProps = any> {
  /**
   * Removes the button from the toolbar
   */
  removeButton: () => void;

  /**
   * Closes the tool if it is open
   */
  closeTool: () => void;

  /**
   * Can be used to programatically open the tool
   *
   * @param props Additional Props to pass to the tool. This is useful, for
   * example, if you want to open the tool in a specific mode.
   */
  openTool: (props?: Partial<ToolProps>) => void;
}

/**
 * Add a button to open a Tool UI to the map navigation menu.
 *
 * This is useful for external plugins to add buttons to the navigation menu that launches some custom work flow.
 *
 * @param viewState The ViewState instance
 * @param buttonOptionsGenerator A function that when called, returns {@link ToolButtonOptions} for the new button
 * @returns A {@link ToolButton} instance
 */
export function addToolButton<ToolProps = any>(
  viewState: ViewState,
  buttonOptionsGenerator: (
    button: ToolButton<ToolProps>
  ) => ToolButtonOptions<ToolProps>
): ToolButton<ToolProps> {
  const terria = viewState.terria;
  const getController = () => {
    // Retreive controller through mapNavigationModel to ensure the button hasn't been removed
    const controller = terria.mapNavigationModel.findItem(id)?.controller;
    return controller instanceof ToolButtonController ? controller : undefined;
  };

  const toolButton = {
    removeButton: () => terria.mapNavigationModel.remove(id),
    closeTool: () => getController()?.closeTool(),
    openTool: (props?: Partial<ToolProps>) => getController()?.openTool(props)
  };
  const options = buttonOptionsGenerator(toolButton);
  const controller = new ToolButtonController(viewState, options);
  const id = createGuid();

  terria.mapNavigationModel.addItem({
    id,
    name: options.text,
    title: options.tooltip,
    location: options.position ?? "TOP",
    order: options.order,
    controller
  });

  return toolButton;
}

export class ToolButtonController<
  ToolProps = {}
> extends MapNavigationItemController {
  constructor(
    readonly viewState: ViewState,
    readonly options: ToolButtonOptions<ToolProps>
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

  @computed
  get isToolOpen() {
    return this.viewState.currentTool?.toolName === this.options.tool.name;
  }

  @computed
  get active(): boolean {
    return super.active && this.isToolOpen;
  }

  openTool(props: any = {}) {
    try {
      this.viewState.openTool({
        toolName: this.options.tool.name,
        getToolComponent: this.options.tool.component,
        params: {
          ...this.options.tool.props,
          ...props,
          closeTool: () => this.closeTool()
        },
        showCloseButton: true
      });
    } catch (err) {
      this.viewState.terria.raiseErrorToUser(TerriaError.from(err));
    }
    super.activate();
  }

  activate() {
    this.openTool();
  }

  deactivate() {
    this.closeTool();
  }

  @action
  closeTool() {
    if (this.isToolOpen) this.viewState.closeTool();
    super.deactivate();
  }
}
