import { action, computed } from "mobx";
import MapNavigationItemController from "../../../../Models/MapNavigation/MapNavigationItemController";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../Icon";

export const SPLITTER_ICON_NAME = "MapNavigationSplitterIcon";

export class ToggleSplitterController extends MapNavigationItemController {
  static id = "splitter-tool";
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

  @computed
  get visible() {
    return super.visible || this.viewState.terria.currentViewer.canShowSplitter;
  }

  @computed
  get disabled() {
    const toolIsDifference =
      this.viewState.currentTool?.toolName === "Difference";
    const isDiffMode = this.viewState.isToolOpen && toolIsDifference;
    return isDiffMode;
  }

  @computed
  get active(): boolean {
    return super.active;
  }
}
/* 
interface PropTypes extends WithTranslation {
  viewState: ViewState;
  terria: Terria;
  controller: ToggleSplitterController;
  theme: DefaultTheme;
  t: TFunction;
}

export const splitterNavigationName = "ToggleSplitterTool";

const ToggleSplitterTool: React.FC<PropTypes> = observer((props: PropTypes) => {
  const { t, terria, viewState } = props;
  const splitterIconRef = useRefForTerria(SPLITTER_ICON_NAME, viewState);
  const toolIsDifference = viewState.currentTool?.toolName === "Difference";
  const isDiffMode = viewState.isToolOpen && toolIsDifference;

  return (
    <MapIconButton
      disabled={isDiffMode}
      buttonRef={splitterIconRef}
      splitter={terria.showSplitter}
      expandInPlace
      title={
        isDiffMode
          ? t("splitterTool.toggleSplitterToolDisabled")
          : t("splitterTool.toggleSplitterTool")
      }
      onClick={() => {
        runInAction(() => {
          if (
            terria.mapNavigationModel.activeItem?.id !== splitterNavigationName
          ) {
            terria.mapNavigationModel.activateItem(splitterNavigationName);
          } else if (
            terria.mapNavigationModel.activeItem?.id === splitterNavigationName
          ) {
            terria.mapNavigationModel.deactivateItem();
          }
          terria.showSplitter = !terria.showSplitter;
        });
      }}
      iconElement={() => (
        <Icon
          glyph={
            terria.showSplitter && !isDiffMode
              ? Icon.GLYPHS.splitterOn
              : Icon.GLYPHS.compare
          }
        />
      )}
    >
      {t("splitterTool.toggleSplitterToolTitle")}
    </MapIconButton>
  );
});

ToggleSplitterTool.displayName = "ToggleSplitterTool";

const ToggleSplitterToolWrapper: React.FC<PropTypes> = observer(function(
  props: PropTypes
) {
  if (!props.terria.currentViewer.canShowSplitter) {
    return null;
  } else {
    return <ToggleSplitterTool {...props} />;
  }
});

export default withTranslation()(withTheme(ToggleSplitterTool));
 */
