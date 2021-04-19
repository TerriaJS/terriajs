"use strict";
import PropTypes from "prop-types";
import React from "react";
import { observer } from "mobx-react";

import Icon from "../../../Styled/Icon";
import Styles from "./toggle_splitter_tool.scss";
import { withTranslation } from "react-i18next";
import { runInAction } from "mobx";
import MapIconButton from "../../MapIconButton/MapIconButton";
import withControlledVisibility from "../../../ReactViews/HOCs/withControlledVisibility";

import { useRefForTerria } from "../../Hooks/useRefForTerria";

export const SPLITTER_ICON_NAME = "MapNavigationSplitterIcon";
const ToggleSplitterTool = observer(function(props) {
  const { t, terria, viewState } = props;
  const splitterIconRef = useRefForTerria(SPLITTER_ICON_NAME, viewState);
  const toolIsDifference = viewState.currentTool?.toolName === "Difference";
  const isDiffMode = viewState.isToolOpen && toolIsDifference;

  return (
    <div className={Styles.toggle_splitter_tool}>
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
          runInAction(() => (terria.showSplitter = !terria.showSplitter));
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
    </div>
  );
});
ToggleSplitterTool.displayName = "ToggleSplitterTool";
ToggleSplitterTool.propTypes = {
  terria: PropTypes.object,
  refFromHOC: PropTypes.object,
  t: PropTypes.func.isRequired
};

const ToggleSplitterToolWrapper = observer(function(props) {
  if (!props.terria.currentViewer.canShowSplitter) {
    return null;
  } else {
    return <ToggleSplitterTool {...props} />;
  }
});

export default withTranslation()(
  withControlledVisibility(ToggleSplitterToolWrapper)
);
