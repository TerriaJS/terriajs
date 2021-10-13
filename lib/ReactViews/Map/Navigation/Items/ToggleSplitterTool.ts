import { action, computed, makeObservable, override } from "mobx";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";

export class ToggleSplitterController extends MapNavigationItemController {
  static id = "split-tool";

  constructor(private viewState: ViewState) {
    super();
    makeObservable(this);
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

  @override
  get visible() {
    return super.visible || this.viewState.terria.currentViewer.canShowSplitter;
  }

  @override
  get disabled() {
    const toolIsDifference =
      this.viewState.currentTool?.toolName === "Difference";
    return this.viewState.isToolOpen && toolIsDifference;
  }

  @override
  get active(): boolean {
    return this.viewState.terria.showSplitter;
  }

  @override
  activate() {
    this.viewState.terria.showSplitter = true;
    super.activate();
  }

  @override
  deactivate() {
    this.viewState.terria.showSplitter = false;
    super.deactivate();
  }
}
