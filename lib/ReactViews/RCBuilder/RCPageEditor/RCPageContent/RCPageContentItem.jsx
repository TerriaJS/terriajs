import React from "react";
import PropTypes from "prop-types";
import Icon from "../../../Icon";
import Styles from "./RCPageContent.scss";
function RCPageContentItem(props) {
  const { scenario, currentScenario, showContent, deleteContent } = props;
  return (
    <li key={scenario.id} id={scenario.id}>
      <div className={Styles.listItem}>
        <span>
          {/* {currentScenario && currentScenario.id === scenario.id ? currentScenario.ssp : scenario.ssp} */}
          {currentScenario && currentScenario.id === scenario.id
            ? currentScenario.ssp === "NONE"
              ? "Page"
              : currentScenario.ssp
            : scenario.ssp === "NONE"
            ? "Page"
            : scenario.ssp}
        </span>
        <button onClick={showContent}>
          <Icon glyph={Icon.GLYPHS.edit} />
        </button>
        {scenario.ssp !== "NONE" && (
          <button onClick={() => deleteContent(scenario.id)}>
            <Icon glyph={Icon.GLYPHS.trashcan} />
          </button>
        )}
      </div>
    </li>
  );
}
RCPageContentItem.propTypes = {
  currentScenario: PropTypes.object,
  scenario: PropTypes.object,
  showContent: PropTypes.func,
  saveContent: PropTypes.func,
  editContent: PropTypes.func,
  deleteContent: PropTypes.func
};
export default RCPageContentItem;
