import { API, graphqlOperation } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React, useEffect, useState } from "react";
import { getPage } from "../../../../api/graphql/queries";
import { updatePage } from "../../../../api/graphql/mutations";
import Styles from "../RCStoryEditor/RCStoryEditor.scss";
import { useParams, withRouter, useHistory } from "react-router-dom";
import { captureCurrentView, moveToSavedView } from "./ViewCapture";

function RCPageEditor(props) {
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState("");
  const [mapView, setMapView] = useState(null);
  const [message, setMessage] = useState("");
  const history = useHistory();

  // get the page id from url
  const { story_id: storyID, page_id: pageID } = useParams();

  // Fetch page details with id
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getPage, { id: pageID })).then(story => {
        const data = story.data.getPage;
        setPage(data);
        setTitle(data.title);

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
        setMapView(mapView);
        moveToSavedView(props.viewState, mapView);
      });
    } catch (error) {
      setMessage("Error", error.message);
    }
  }, []);

  const savePage = () => {
    const pageDetails = {
      id: page.id,
      title: title,
      camera: JSON.stringify(mapView.initialCamera),
      baseMapName: mapView.baseMapName,
      currentTime: {
        dayNumber: mapView.currentTime.dayNumber,
        secondsOfDay: Math.floor(mapView.currentTime.secondsOfDay)
      },
      viewer_mode_3d: mapView.viewerMode === "3d"
    };
    API.graphql({
      query: updatePage,
      variables: { input: pageDetails }
    }).then(response => {
      if (response.data.updatePage) {
        setMessage("Page details saved successfully!");
      } else {
        setMessage("Error", response.errors[0].message);
      }
    });
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
          <label className={title && Styles.topLabel}>Story Title</label>
        </div>

        <div className={Styles.group}>
          <label className={Styles.topLabel}>Map view</label>
          <button
            className={Styles.RCButton}
            onClick={() => setMapView(captureCurrentView(props.viewState))}
          >
            Capture current view
          </button>
          &nbsp;
          <button
            className={Styles.RCButton}
            onClick={() => moveToSavedView(props.viewState, mapView)}
          >
            Move to captured view
          </button>
        </div>

        <div className={Styles.container}>
          <button className={Styles.RCButton} onClick={savePage}>
            Save
          </button>
          <label>{message}</label>
        </div>
      </form>
    </div>
  );
}

RCPageEditor.propTypes = {
  viewState: PropTypes.object
};
export default withRouter(RCPageEditor);
