import { action } from "mobx";
import overridableComputed from "../../../../Core/overridableComputed";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";

export class ToggleSplitterController extends MapNavigationItemController {
  static id = "split-tool";

  constructor(private viewState: ViewState) {
    super();
  }

  get glyph(): any {
    if (this.active) {
      return Icon.GLYPHS.splitterOn;
    }
    return Icon.GLYPHS.compare;
  }

  get viewerMode(): ViewerMode | undefined {
    return undefined;
  }

  @overridableComputed
  get visible() {
    return super.visible && this.viewState.terria.currentViewer.canShowSplitter;
  }

  @overridableComputed
  get disabled() {
    const toolIsDifference =
      this.viewState.currentTool?.toolName === "Difference";
    return this.viewState.isToolOpen && toolIsDifference;
  }

  @overridableComputed
  get active(): boolean {
    return this.viewState.terria.showSplitter;
  }

  @action
  activate() {
    this.viewState.terria.showSplitter = true;
    super.activate();
  }

  @action
  deactivate() {
    this.viewState.terria.showSplitter = false;
    super.deactivate();
  }
}
