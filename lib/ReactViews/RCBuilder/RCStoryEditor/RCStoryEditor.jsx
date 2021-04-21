import React from "react";
import Styles from "./RCStoryEditor.scss";
import sectors from "../../../Data/Sectors.js";
import RCSectorSelection from "./RCSectorSelection/RCSectorSelection";

class RCStoryEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    sectors: sectors,
    selectedSectors: []
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
  render() {
    const { sectors, selectedSectors } = this.state;
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
        </form>
      </div>
    );
  }
}
export default RCStoryEditor;
