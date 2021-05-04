import { API, graphqlOperation } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React, useEffect, useRef, useState } from "react";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import { updateStory } from "../../../../api/graphql/mutations";
import { getStory } from "../../../../api/graphql/queries";
import sectors from "../../../Data/Sectors.js";
import RCSectorSelection from "./RCSectorSelection/RCSectorSelection";
import Styles from "./RCStoryEditor.scss";
import { useParams } from "react-router-dom";
function RCStoryEditor(props) {
  const [story, setStory] = useState(null);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [listenForHotspot, setListenForHotspot] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [hotspotPoint, setHotspotPoint] = useState(null);
  const [selectHotspotSubscription, setSelectHotspotSubscription] = useState(
    null
  );
  const [message, setMessage] = useState("");
  const [sectorRequiredMessage, setSectorRequiredMessage] = useState("*");

  // get the story id from url
  const { id } = useParams();
  // store the reference for state
  const stateRef = useRef();
  stateRef.current = listenForHotspot;

  // Fetch story details with id
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getStory, { id: id })).then(story => {
        const data = story.data.getStory;
        setStory(data);
        setTitle(data.title);
        setShortDescription(data.shortDescription);
        setSelectedSectors(data.sectors);
        setHotspotPoint(data.hotspotlocation);
      });
    } catch (error) {
      console.log(error);
    }
  }, []);
  // Listen for picked features/position
  useEffect(() => {
    const { terria } = props.viewState;
    setSelectHotspotSubscription(
      knockout.getObservable(terria, "pickedFeatures").subscribe(() => {
        let isListening = stateRef.current;
        if (isListening) {
          // Convert position to cartographic
          const point = Cartographic.fromCartesian(
            terria.pickedFeatures.pickPosition
          );
          setHotspotPoint({
            latitude: (point.latitude / Math.PI) * 180,
            longitude: (point.longitude / Math.PI) * 180
          });
          setListenForHotspot(false);
        }
      })
    );
    return () => {
      if (selectHotspotSubscription !== null) {
        selectHotspotSubscription.dispose();
      }
    };
  }, []);

  const onTitleChanged = event => {
    setTitle(event.target.value);
  };
  const onDescriptionChanged = event => {
    setShortDescription(event.target.value);
  };
  const onSectorChanged = event => {
    const sector = event.target.value
      .split(" ")
      .join("_")
      .toUpperCase();
    // check if the check box is checked or unchecked
    if (event.target.checked) {
      // add the  value of the checkbox to selectedSectors array
      setSelectedSectors([...selectedSectors, sector]);
    } else {
      // or remove the value from the unchecked checkbox from the array
      setSelectedSectors(
        selectedSectors.filter(selectedSector => selectedSector !== sector)
      );
    }
  };

  const onSave = () => {
    if (selectedSectors.length <= 0) {
      setSectorRequiredMessage("Select at least 1 sector");
    } else {
      const storyDetails = {
        id: story.id,
        title: title,
        shortDescription: shortDescription,
        sectors: selectedSectors,
        hotspotlocation: hotspotPoint
      };
      API.graphql({
        query: updateStory,
        variables: { input: storyDetails }
      }).then(response => {
        if (response.data.updateStory) {
          setMessage("Story details saved successfully!");
        } else {
          setMessage("Error", response.errors[0].message);
        }
      });
    }
  };

  const hotspotText = hotspotPoint
    ? `${Number(hotspotPoint.latitude).toFixed(4)}, ${Number(
        hotspotPoint.longitude
      ).toFixed(4)}`
    : "none set";

  return (
    <div className={Styles.RCStoryEditor}>
      <h3>Edit your story</h3>
      <form className={Styles.RCStoryCard}>
        <div className={Styles.group}>
          <input
            type="text"
            required
            defaultValue={title}
            onChange={onTitleChanged}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={title && Styles.topLabel}>Story Title</label>
        </div>
        <div className={Styles.group}>
          <textarea
            defaultValue={shortDescription}
            onChange={onDescriptionChanged}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={shortDescription && Styles.topLabel}>
            Short Description
          </label>
        </div>
        <RCSectorSelection
          sectors={sectors}
          selectedSectors={selectedSectors}
          onSectorSelected={onSectorChanged}
          sectorRequiredMessage={sectorRequiredMessage}
        />

        <div className={Styles.RCStoryEditor}>
          <label>Hotspot</label>
          {!listenForHotspot && (
            <div className={Styles.container}>
              <label>Set at: {hotspotText}</label>
              <button
                type="button"
                className={Styles.RCButton}
                onClick={() => setListenForHotspot(true)}
              >
                Select hotspot
              </button>
            </div>
          )}
          {listenForHotspot && (
            <div>
              <label>Click on map to set the hotspot position</label>&nbsp;
              <button
                onClick={() => setListenForHotspot(false)}
                className={Styles.RCButton}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className={Styles.container}>
          <button className={Styles.RCButton} onClick={onSave}>
            Save
          </button>
          <label>{message}</label>
        </div>
      </form>
    </div>
  );
}

RCStoryEditor.propTypes = {
  viewState: PropTypes.object
};
export default RCStoryEditor;
