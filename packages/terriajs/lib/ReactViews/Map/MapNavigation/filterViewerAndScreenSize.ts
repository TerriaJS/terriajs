import isDefined from "../../../Core/isDefined";
import ViewState from "../../../ReactViewModels/ViewState";
import { ScreenSize } from "../../../ViewModels/CompositeBar/CompositeBarModel";
import { IMapNavigationItem } from "../../../ViewModels/MapNavigation/MapNavigationModel";

export function filterViewerAndScreenSize(
  item: IMapNavigationItem,
  viewState: ViewState
) {
  const currentViewer = viewState.terria.mainViewer.viewerMode;
  const screenSize: ScreenSize = item.screenSize ?? "any";
  if (viewState.useSmallScreenInterface) {
    return (
      (!isDefined(item.controller.viewerMode) ||
        item.controller.viewerMode === currentViewer) &&
      (screenSize === "any" || item.screenSize === "small")
    );
  } else {
    return (
      (!isDefined(item.controller.viewerMode) ||
        item.controller.viewerMode === currentViewer) &&
      (screenSize === "any" || item.screenSize === "medium")
    );
  }
}
