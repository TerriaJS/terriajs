import SplitPoint from "./SplitPoint.jsx";
import PropTypes from "prop-types";
import React from "react";
import Styles from "./tool-panel.scss";
import Loader from "./Loader.jsx";
import i18next from "i18next";

function ToolPanel({ viewState }) {
  function closePanel() {
    viewState.currentTool = undefined;
  }

  const toolType = viewState.currentTool && viewState.currentTool.type;
  const terria = viewState.terria;
  let toolComponent;
  if (toolType === "delta") {
    toolComponent = (
      <SplitPoint
        loadComponent={loadDeltaTool({
          onError: () => {
            terria.error.raiseEvent({
              title: i18next.t("deltaTool.loadingError.title"),
              message: i18next.t("deltaTool.loadingError.message")
            });
            closePanel();
          }
        })}
        viewState={viewState}
        terria={viewState.terria}
        tool={viewState.currentTool}
        onCloseTool={closePanel}
        loadingProgress={<Loader className={Styles.loading} />}
      >
        Loading...
      </SplitPoint>
    );
  } else {
    return null;
  }
  return <div className={Styles.toolPanel}>{toolComponent}</div>;
}

ToolPanel.propTypes = {
  viewState: PropTypes.object.isRequired
};

function loadDeltaTool({ onError }) {
  return function(onLoad) {
    import("./Tools/DeltaTool/DeltaTool.jsx")
      .then(module => onLoad(module.default))
      .catch(onError);
  };
}

export default ToolPanel;
