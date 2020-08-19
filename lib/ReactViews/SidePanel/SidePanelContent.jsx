import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import { Small, Medium } from "../Generic/Responsive";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import NowViewing from "../../Models/NowViewing";
const cloneDeep = require("lodash/clonedeep");

class SidePanelContent extends React.Component {
  state = {
    sector: null
  };
  showSectorInfo = sector => {
    this.setState({
      sector
    });

    this._nowViewingChangedSubscription = knockout
      .getObservable(this.props.terria.nowViewing, "items")
      .subscribe(function() {
        alert("minimumLevel changed!");
      });

    // terria.selectedSector = sector.title.toLowerCase();
    this.filterHotspots(sector.title.toLowerCase());
  };

  filterHotspots = sector => {
    const { terria } = this.props;
    const nowViewing_Item = cloneDeep(terria.nowViewing.items[0]);
    const val = nowViewing_Item._readyData.features.filter(feature => {
      return Object.values(feature.properties).includes(sector);
    });
    nowViewing_Item._readyData.features.splice(
      0,
      nowViewing_Item._readyData.features.length,
      val
    );
    terria.nowViewing.items.shift();
    terria.nowViewing.add(nowViewing_Item);
    terria.nowViewing.items[0].isEnabled = true;

    console.log(terria.nowViewing);
  };
  closeSectorInfo = () => {
    this.setState({ sector: null });
  };
  render() {
    const { sector } = this.state;

    return (
      <>
        <Medium>
          <SectorTabs showSectorInfo={this.showSectorInfo} />
          <SectorInfo sector={sector} close={this.closeSectorInfo} />
        </Medium>
        <Small>
          <SectorInfo sector={sector} close={this.closeSectorInfo} />
          <SectorTabs showSectorInfo={this.showSectorInfo} />
        </Small>
      </>
    );
  }
}

SidePanelContent.propTypes = {
  /**
   * Terria instance
   */
  terria: PropTypes.object.isRequired
};
export default SidePanelContent;
