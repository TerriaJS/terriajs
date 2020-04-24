"use strict";
import PropTypes from "prop-types";
import React from "react";
import { observer } from "mobx-react";

import Icon from "../../Icon";
import Styles from "./toggle_splitter_tool.scss";
import { withTranslation } from "react-i18next";
import { runInAction } from "mobx";
import MapIconButton from "../../MapIconButton/MapIconButton";

import { useRefForTerria } from "../../Hooks/useRefForTerria";

export const SPLITTER_ICON_NAME = "MapNavigationSplitterIcon";
const ToggleSplitterTool = observer(function(props) {
  const { t, terria, viewState } = props;
  const splitterIconRef = useRefForTerria(SPLITTER_ICON_NAME, viewState);
  return (
    <div className={Styles.toggle_splitter_tool}>
      <MapIconButton
        buttonRef={splitterIconRef}
        splitter={terria.showSplitter}
        expandInPlace
        title={t("splitterTool.toggleSplitterTool")}
        onClick={() => {
          const terria = terria;
          runInAction(() => (terria.showSplitter = !terria.showSplitter));
        }}
        iconElement={() => (
          <Icon
            glyph={
              terria.showSplitter
                ? Icon.GLYPHS.splitterOn
                : Icon.GLYPHS.splitterOff
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

export default withTranslation()(ToggleSplitterToolWrapper);
