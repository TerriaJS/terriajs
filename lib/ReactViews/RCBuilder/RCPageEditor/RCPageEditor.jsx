import { API, graphqlOperation } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React, useEffect, useRef, useState } from "react";
import { getPage } from "../../../../api/graphql/queries";
import { updatePage } from "../../../../api/graphql/mutations";
import Styles from "../RCStoryEditor/RCStoryEditor.scss";
import { useParams, withRouter, useHistory } from "react-router-dom";
import { captureCurrentView, moveToSavedView } from "./ViewCapture";
import RCPageContent from "./RCPageContent/RCPageContent";
import SettingPanel from "./../../Map/Panels/SettingPanel.jsx";

function RCPageEditor(props) {
  const [page, setPage] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [message, setMessage] = useState({ success: 0, message: "" });
  const history = useHistory();
  const viewState = props.viewState;
  const contentRef = useRef(null);

  // get the page id from url
  const { story_id: storyID, page_id: pageID } = useParams();

  // Fetch page details with id
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getPage, { id: pageID })).then(story => {
        const data = story.data.getPage;
        setPage(data);
        // TODO : set scenarios when there is default page content
        setScenarios(data.scenarios);
        setTitle(data.title);
        setSection(data.section);

        // Map view settings
        const mapView = {
          initialCamera: JSON.parse(data.camera),
          baseMapName: data.baseMapName,
          currentTime: data.currentTime,
          viewerMode: data.viewer_mode_3d ? "3d" : "2d"
        };
        if (Array.isArray(mapView.initialCamera)) {
          delete mapView.initialCamera;
        }
        moveToSavedView(props.viewState, mapView);
      });
    } catch (error) {
      setMessage({ success: 0, message: error.message });
    }
  }, []);
  const isScenarioValid = () => {
    return !scenarios.find(sc => sc.ssp === "Choose SSP");
  };
  const captureEnabledCatalogItems = () => {
    if (contentRef.current !== null) {
      contentRef.current.saveEnabledCatalogItems();
    }
  };
  const savePage = () => {
    if (isScenarioValid()) {
      const mapView = captureCurrentView(viewState);
      captureEnabledCatalogItems();
      const pageDetails = {
        id: page.id,
        title: title,
        section: section,
        camera: JSON.stringify(mapView.initialCamera),
        baseMapName: mapView.baseMapName,
        currentTime: {
          dayNumber: mapView.currentTime.dayNumber,
          secondsOfDay: Math.floor(mapView.currentTime.secondsOfDay)
        },
        viewer_mode_3d: mapView.viewerMode === "3d",
        scenarios: scenarios
      };
      API.graphql({
        query: updatePage,
        variables: { input: pageDetails }
      }).then(response => {
        if (response.data.updatePage) {
          setMessage({
            success: 1,
            message: "Page details saved successfully!"
          });
        } else {
          setMessage({
            success: 0,
            message: `Error ${response.errors[0].message}`
          });
        }
      });
    } else {
      setMessage({ success: 0, message: "*Please choose valid scenario" });
    }
  };
  const updateScenarios = scenarios => {
    setScenarios(scenarios);
  };
  return (
    <div className={Styles.RCStoryEditor}>
      <div className={Styles.container}>
        <h3>Edit the page</h3>
        <button
          className={Styles.RCButton}
          onClick={() => history.push(`/builder/story/${storyID}/edit`)}
        >
          Back
        </button>
      </div>
      <form className={Styles.RCStoryCard}>
        <div className={Styles.group}>
          <input
            type="text"
            required
            defaultValue={title}
            onChange={e => setTitle(e.target.value)}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={title && Styles.topLabel}>Page Title</label>
        </div>

        <div className={Styles.group}>
          <select
            required
            className={Styles.RCSelect}
            value={section}
            onChange={e => setSection(e.target.value)}
          >
            <option value="SCOPE">Scope</option>
            <option value="HOTSPOTS">Remote climate</option>
            <option value="CONNECTION">Relevance to EU</option>
            <option value="EU_IMPACT">EU impact</option>
            <option value="CLIMATE_SCENARIOS">Climate change</option>
            <option value="SOC_ECON_SCENARIOS">Socio-economic change</option>
            <option value="COMPARISON">Comparison</option>
            <option value="CONCLUSION">Conclusions</option>
          </select>
          <label className={title && Styles.topLabel}>Section</label>
        </div>

        <div className={Styles.group}>
          <label className={Styles.topLabel}>Map view</label>
        </div>
        <SettingPanel
          terria={viewState.terria}
          allBaseMaps={viewState.terria.allBaseMaps}
          viewState={viewState}
        />
        <div>
          <RCPageContent
            ref={contentRef}
            storyId={storyID}
            scenarios={scenarios}
            updateScenarios={updateScenarios}
            viewState={viewState}
          />
        </div>
        <div className={Styles.container}>
          <button className={Styles.RCButton} onClick={savePage}>
            Save
          </button>
          <label className={message.success ? Styles.success : Styles.failed}>
            {message.message}
          </label>
        </div>
      </form>
    </div>
  );
}

RCPageEditor.propTypes = {
  viewState: PropTypes.object,
  storyID: PropTypes.object
};
export default withRouter(RCPageEditor);
