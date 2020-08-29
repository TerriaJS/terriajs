import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import { Small, Medium } from "../Generic/Responsive";
import PropTypes from "prop-types";

class SidePanelContent extends React.Component {
  state = {
    sector: null,
    item: null
  };
  showSectorInfo = sector => {
    this.setState({
      sector
    });
    this.filterHotspots(sector.title);
  };

  filterHotspots = sector => {
    const { terria, viewState } = this.props;
    terria.nowViewing.items.map(item => {
      if (item.type === "geojson") {
        item.isShown = item.name === sector;
      }
    });
    // set isHotspots filtered to true to make back to all hotspots button visible
    viewState.isHotspotsFiltered = true;
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
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired
};
export default SidePanelContent;
