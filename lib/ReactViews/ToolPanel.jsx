import DeltaTool from "./Tools/DeltaTool/DeltaTool.jsx";
import PropTypes from "prop-types";
import React from "react";
import Styles from "./tool-panel.scss";

function ToolPanel({ viewState }) {
  function closePanel() {
    viewState.currentTool = undefined;
  }

  const toolType = viewState.currentTool && viewState.currentTool.type;
  let toolComponent;
  if (toolType === "delta") {
    toolComponent = (
      <DeltaTool
        terria={viewState.terria}
        tool={viewState.currentTool}
        onCloseTool={closePanel}
      />
    );
  } else {
    return null;
  }

  return <div className={Styles.toolPanel}>{toolComponent}</div>;
}

ToolPanel.propTypes = {
  viewState: PropTypes.object.isRequired
};

module.exports = ToolPanel;
