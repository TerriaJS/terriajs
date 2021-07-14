import { action, computed } from "mobx";
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

  @computed
  get visible() {
    return super.visible || this.viewState.terria.currentViewer.canShowSplitter;
  }

  @computed
  get disabled() {
    const toolIsDifference =
      this.viewState.currentTool?.toolName === "Difference";
    return this.viewState.isToolOpen && toolIsDifference;
  }

  @computed
  get active(): boolean {
    return super.active;
  }

  @action
  handleClick(): void {
    const terria = this.viewState.terria;
    if (terria.showSplitter) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  @action
  activate() {
    const terria = this.viewState.terria;
    terria.showSplitter = true;
    this._active = true;
  }

  @action
  deactivate() {
    const terria = this.viewState.terria;
    terria.showSplitter = false;
    this._active = false;
  }
}
