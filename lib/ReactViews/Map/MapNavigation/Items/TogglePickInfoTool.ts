import { action, computed } from "mobx";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";

export class TogglePickInfoController extends MapNavigationItemController {
    static id = "info-tool";

    constructor(private viewState: ViewState) {
        super();
    }

    get glyph(): any {
        return Icon.GLYPHS.info;
    }

    get viewerMode(): ViewerMode | undefined {
        return undefined;
    }

    @computed
    get visible() {
        return super.visible;
    }

    @computed
    get disabled() {
        return false;
    }

    @computed
    get active(): boolean {
        return this.viewState.terria.isPickInfoEnabled;
    }

    @action
    activate() {
        this.viewState.terria.isPickInfoEnabled = true;
        super.activate();
    }

    @action
    deactivate() {
        this.viewState.terria.pickedFeatures = undefined;
        this.viewState.terria.selectedFeature = undefined;
        this.viewState.terria.isPickInfoEnabled = false;
        this.viewState.featureInfoPanelIsVisible = false;

        super.deactivate();
    }
}