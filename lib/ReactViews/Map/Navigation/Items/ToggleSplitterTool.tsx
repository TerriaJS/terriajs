import { TFunction } from "i18next";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { DefaultTheme, withTheme } from "styled-components";
import ViewState from "../../../../ReactViewModels/ViewState";
import { useRefForTerria } from "../../../Hooks/useRefForTerria";
import Icon from "../../../Icon";
import MapIconButton from "../../../MapIconButton/MapIconButton";
import Terria from "./../../../../Models/Terria";

export const SPLITTER_ICON_NAME = "MapNavigationSplitterIcon";

interface PropTypes extends WithTranslation {
  viewState: ViewState;
  terria: Terria;
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

export default withTranslation()(withTheme(ToggleSplitterToolWrapper));
