import {
  default as React,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from "react";
import { API } from "aws-amplify";
import * as mutations from "../../../../../api/graphql/mutations";
import PropTypes from "prop-types";
import classNames from "classnames";
import RCAccordian from "../../RCAccordian/RCAccordian";
import RCEditor from "../RCEditor";
import RCPageContentItem from "./RCPageContentItem";

import Styles from "./RCPageContent.scss";
import RCSSPSelection from "./RCSSPSelction";
const RCPageContent = forwardRef((props, ref) => {
  const { storyId, scenarios, updateScenarios, viewState } = props;
  const [showEditor, setShowEditor] = useState(false);
  const [content, setContent] = useState({});
  const [selectedSSP, setSelectedSSP] = useState("");
  const [currentScenario, setCurrentScenario] = useState({});
  const ssps = ["SSP1", "SSP2", "SSP3", "SSP4"];

  const showContent = scenario => {
    setShowEditor(true);
    setSelectedSSP("");
    captureEnabledCatalogItems(currentScenario);
    restoreEnabledCatalogItems(scenario);
    setCurrentScenario(scenario);
  };
  const contentChanged = content => {
    setContent(content);
    setCurrentScenario({ ...currentScenario, ["content"]: content });
  };
  const saveContent = content => {
    setCurrentScenario({ ...currentScenario, ["content"]: content });
    const index = scenarios.findIndex(sc => sc.id === currentScenario.id);
    const newScenarios = [...scenarios];
    newScenarios[index] = currentScenario;
    updateScenarios(newScenarios);
  };
  const onSSPSelected = event => {
    const ssp = event.target.value;
    // check if the check box is checked or unchecked
    if (event.target.checked) {
      // add the  value of the checkbox to selectedSectors array
      setSelectedSSP(ssp);
      setCurrentScenario({ ...currentScenario, ["ssp"]: ssp });
      const index = scenarios.findIndex(sc => sc.id === currentScenario.id);
      const newScenarios = [...scenarios];
      newScenarios[index].ssp = ssp;
      updateScenarios(newScenarios);
    }
  };
  // Create Content
  const addSSP = () => {
    const originalContent = scenarios[0].content; // This can be changed if page is not always first element in scenarios
    // find max id from scenarios
    const maxId = parseInt(
      scenarios.reduce((max, sc) => (max = max > sc.id ? max : sc.id), 0),
      10
    );
    const content = {
      id: maxId + 1,
      ssp: "Choose SSP",
      content: originalContent,
      split_map: false,
      enabled_catalog_items: defaultCatalogItems
    };
    updateScenarios(scenario => [...scenario, content]);
  };
  const deleteContent = id => {
    // Page content will be deleted from dynamodb on page save.
    updateScenarios(scenarios.filter(sc => sc.id !== id));
  };

  const defaultCatalogItems = ["EU Lines!- Mapbox Style", "hotspots"];

  const captureEnabledCatalogItems = scenario => {
    const enabledItems = viewState.terria.catalog.group.items
      .filter(item => item.isShown)
      .map(item => item.name);
    scenario.enabled_catalog_items = enabledItems;
  };

  const restoreEnabledCatalogItems = scenario => {
    if (!Array.isArray(scenario.enabled_catalog_items)) {
      scenario.enabled_catalog_items = defaultCatalogItems;
    }
    viewState.terria.catalog.group.items.forEach(item => {
      item.isShown = scenario.enabled_catalog_items.includes(item.name);
    });
  };

  // Basically exposes captureEnabledCatalogItems on the component
  // to be called from parent
  useImperativeHandle(ref, () => ({
    saveEnabledCatalogItems() {
      captureEnabledCatalogItems(currentScenario);
    }
  }));

  return (
    <RCAccordian
      title="Content"
      hasAction={scenarios.length <= 4}
      actionTitle="+ Add SSP"
      action={addSSP}
      enableReorder={false}
    >
      {scenarios.map(scenario => {
        return (
          <div key={scenario.id}>
            <RCPageContentItem
              currentScenario={currentScenario}
              scenario={scenario}
              showContent={() => showContent(scenario)}
              deleteContent={deleteContent}
            />
            {currentScenario.id === scenario.id ? (
              <div
                className={classNames(
                  Styles.content,
                  !showEditor && Styles.collapsed
                )}
              >
                {currentScenario.ssp !== "NONE" && (
                  <RCSSPSelection
                    scenarios={scenarios}
                    ssps={ssps}
                    onSSPSelected={onSSPSelected}
                    selectedSSP={selectedSSP}
                  />
                )}

                <RCEditor
                  onSaveContent={saveContent}
                  content={currentScenario.content}
                  onContentChange={contentChanged}
                  storyID={storyId}
                />
                <button
                  className={Styles.RCButton}
                  onClick={() => {
                    viewState.doShowSidePanel = true;
                    viewState.isMapFullScreen = true;
                  }}
                >
                  Configure map data
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </RCAccordian>
  );
});
RCPageContent.propTypes = {
  storyId: PropTypes.string,
  scenarios: PropTypes.array,
  updateScenarios: PropTypes.func,
  viewState: PropTypes.object
};
export default RCPageContent;
