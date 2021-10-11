import { computed, makeObservable, override } from "mobx";
import isDefined from "../../Core/isDefined";
import ViewState from "../../ReactViewModels/ViewState";
import { GLYPHS } from "../../Styled/Icon";
import MapNavigationItemController from "../../ViewModels/MapNavigation/MapNavigationItemController";

export const FEEDBACK_TOOL_ID = "feedback";

export class FeedbackButtonController extends MapNavigationItemController {
  constructor(private viewState: ViewState) {
    super();
    makeObservable(this);
  }
  get glyph(): any {
    return GLYPHS.feedback;
  }
  get viewerMode() {
    return undefined;
  }

  @override
  activate() {
    this.viewState.feedbackFormIsVisible = true;
    super.activate();
  }

  @override
  deactivate() {
    this.viewState.feedbackFormIsVisible = false;
    super.deactivate();
  }

  @override
  get visible() {
    return (
      isDefined(this.viewState.terria.configParameters.feedbackUrl) &&
      !this.viewState.hideMapUi
    );
  }

  @override
  get active() {
    return this.viewState.feedbackFormIsVisible;
  }
}
