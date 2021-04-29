import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Styles from "./RCStoryEditor.scss";
import sectors from "../../../Data/Sectors.js";
import RCSectorSelection from "./RCSectorSelection/RCSectorSelection";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import defined from "terriajs-cesium/Source/Core/defined";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import { API, graphqlOperation } from "aws-amplify";
import { getStory } from "../../../../api/graphql/queries";
import { updateStory } from "../../../../api/graphql/mutations";
function RCStoryEditor(props) {
  const [story, setStory] = useState(null);
  const [title, setTitle] = useState("");
  const [listenForHotspot, setListenForHotspot] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [hotspotPoint, setHotspotPoint] = useState(null);
  const [selectHotspotSubscription, setSelectHotspotSubscription] = useState(
    null
  );

  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getStory, { id: "10" })).then(story => {
        console.log(story.data.getStory);
        setStory(story.data.getStory);
        setTitle(story.data.getStory.title);
      });
    } catch (error) {
      console.log(error);
    }

    const viewState = props.viewState;
    setSelectHotspotSubscription(
      knockout.getObservable(viewState, "selectedPosition").subscribe(() => {
        // hack alert; getting the current state
        let isListening;
        setListenForHotspot(currentValue => {
          isListening = currentValue;
          return currentValue;
        });

        if (isListening) {
          // Convert position to cartographic
          const point = Cartographic.fromCartesian(viewState.selectedPosition);
          console.log(point);
          // setHotspotPoint({
          //     lat: (point.latitude / Math.PI) * 180,
          //     lon: (point.longitude / Math.PI) * 180
          // });
          // setListenForHotspot(false);
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
  const onSectorChanged = event => {
    // check if the check box is checked or unchecked
    if (event.target.checked) {
      // add the  value of the checkbox to selectedSectors array
      const addedSector = event.target.value;
      setSelectedSectors([...selectedSectors, addedSector]);
    } else {
      // or remove the value from the unchecked checkbox from the array
      const removedSector = event.target.value;
      setSelectedSectors(
        selectedSectors.filter(sector => sector !== removedSector)
      );
    }
  };

  const onSave = () => {
    console.log(selectedSectors);
    const storyDetails = {
      id: story.id,
      title: title
    };
    console.log(storyDetails);
    API.graphql({
      query: updateStory,
      variables: { input: storyDetails }
    });
  };

  const hotspotText = hotspotPoint
    ? `${Number(hotspotPoint.lat).toFixed(4)}, ${Number(
        hotspotPoint.lon
      ).toFixed(4)}`
    : "none set";

  return (
    <div className={Styles.RCStoryEditor}>
      <h3>Edit your story</h3>
      <button onClick={onSave}>Save</button>
      <form className={Styles.RCStoryCard}>
        <div className={Styles.group}>
          <input type="text" required value={title} onChange={onTitleChanged} />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label>Story Title</label>
        </div>
        <div className={Styles.group}>
          <textarea />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label>Short Description</label>
        </div>
        <RCSectorSelection
          sectors={sectors}
          selectedSectors={selectedSectors}
          onSectorSelected={onSectorChanged}
        />
        <div>
          <label>Hotspot</label>
          {!listenForHotspot && (
            <div>
              <label>Set at: {hotspotText}</label>&nbsp;
              <button
                type="button"
                className={Styles.button}
                onClick={() => setListenForHotspot(true)}
              >
                Select hotspot
              </button>
            </div>
          )}
          {listenForHotspot && (
            <div>
              <label>Click on map to set the hotspot position</label>&nbsp;
              <button onClick={() => setListenForHotspot(false)}>Cancel</button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

RCStoryEditor.propTypes = {
  viewState: PropTypes.object
};
export default RCStoryEditor;
