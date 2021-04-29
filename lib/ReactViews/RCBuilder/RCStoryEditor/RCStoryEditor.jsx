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
  const [shortDescription, setShortDescription] = useState("");
  const [listenForHotspot, setListenForHotspot] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [hotspotPoint, setHotspotPoint] = useState(null);
  //const [selectHotspotSubscription, setSelectHotspotSubscription] = useState(null);

  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getStory, { id: "4" })).then(story => {
        const data = story.data.getStory;
        console.log("Data", data);
        setStory(data);
        setTitle(data.title);
        setShortDescription(data.shortDescription);
        setSelectedSectors(data.sectors);
      });
    } catch (error) {
      console.log(error);
    }

    // const viewState = props.viewState;
    // setSelectHotspotSubscription(knockout
    //   .getObservable(viewState, "selectedPosition")
    //   .subscribe(() => {
    //     if (this.state.isSettingHotspot) {
    //       // Convert position to cartographic
    //       const point = Cartographic.fromCartesian(viewState.selectedPosition);
    //       this.setState({
    //         hotspotPoint: {
    //           lat: (point.latitude / Math.PI) * 180,
    //           lon: (point.longitude / Math.PI) * 180
    //         },
    //         isSettingHotspot: false
    //       });
    //     }
    //   }));

    // return () => {
    //   if (defined(this._pickedFeaturesSubscription)) {
    //     this._pickedFeaturesSubscription.dispose();
    //     this._pickedFeaturesSubscription = undefined;
    //   }
    // };
  }, []);

  const onTitleChanged = event => {
    setTitle(event.target.value);
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
    console.log(selectedSectors);
    const storyDetails = {
      id: story.id,
      title: title,
      shortDescription: shortDescription,
      sectors: selectedSectors
    };
    console.log(storyDetails);
    // API.graphql({
    //   query: updateStory,
    //   variables: { input: storyDetails }
    // });
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
          <textarea defaultValue={shortDescription} />
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
