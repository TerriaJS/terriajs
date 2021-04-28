import React from "react";
import PropTypes from "prop-types";
import Styles from "./RCStoryEditor.scss";
import sectors from "../../../Data/Sectors.js";
import RCSectorSelection from "./RCSectorSelection/RCSectorSelection";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import defined from "terriajs-cesium/Source/Core/defined";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import { API, graphqlOperation } from "aws-amplify";
import { getStory } from "../../../../api/graphql/queries";
class RCStoryEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    sectors: sectors,
    selectedSectors: [],
    isSettingHotspot: false,
    hotspotPoint: null
  };
  onSectorChanged = event => {
    // current array of sectors
    const selectedSectors = this.state.selectedSectors;
    let index;
    // check if the check box is checked or unchecked
    if (event.target.checked) {
      // add the  value of the checkbox to selectedSectors array
      selectedSectors.push(event.target.value);
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = selectedSectors.indexOf(event.target.value);
      selectedSectors.splice(index, 1);
    }

    // update the state with the new array of options
    this.setState({ selectedSectors: selectedSectors });
    console.log("Sectors", this.state.selectedSectors);
  };
  componentDidMount() {
    try {
      API.graphql(graphqlOperation(getStory, { id: "1" })).then(story => {
        console.log(story);
      });
    } catch (error) {
      console.log(error);
    }

    const viewState = this.props.viewState;
    this._selectHotspotSubscription = knockout
      .getObservable(viewState, "selectedPosition")
      .subscribe(() => {
        if (this.state.isSettingHotspot) {
          // Convert position to cartographic
          const point = Cartographic.fromCartesian(viewState.selectedPosition);
          this.setState({
            hotspotPoint: {
              lat: (point.latitude / Math.PI) * 180,
              lon: (point.longitude / Math.PI) * 180
            },
            isSettingHotspot: false
          });
        }
      });
  }
  componentWillUnmount() {
    if (defined(this._pickedFeaturesSubscription)) {
      this._pickedFeaturesSubscription.dispose();
      this._pickedFeaturesSubscription = undefined;
    }
  }
  listenForHotspot = () => {
    this.setState({ isSettingHotspot: true });
  };
  cancelListenForHotspot = () => {
    this.setState({ isSettingHotspot: false });
  };
  render() {
    const {
      sectors,
      selectedSectors,
      hotspotPoint,
      isSettingHotspot
    } = this.state;
    const hotspotText = hotspotPoint
      ? `${Number(hotspotPoint.lat).toFixed(4)}, ${Number(
          hotspotPoint.lon
        ).toFixed(4)}`
      : "none set";
    return (
      <div className={Styles.RCStoryEditor}>
        <h3>Edit your story</h3>
        <form className={Styles.RCStoryCard}>
          <div className={Styles.group}>
            <input type="text" required />
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
            onSectorSelected={this.onSectorChanged}
          />
          <div>
            <label>Hotspot</label>
            {!isSettingHotspot && (
              <div>
                <label>Set at: {hotspotText}</label>&nbsp;
                <button
                  type="button"
                  className={Styles.button}
                  onClick={this.listenForHotspot}
                >
                  Select hotspot
                </button>
              </div>
            )}
            {isSettingHotspot && (
              <div>
                <label>Click on map to set the hotspot position</label>&nbsp;
                <button onClick={this.cancelListenForHotspot}>Cancel</button>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }
}
RCStoryEditor.propTypes = {
  viewState: PropTypes.object
};
export default RCStoryEditor;
