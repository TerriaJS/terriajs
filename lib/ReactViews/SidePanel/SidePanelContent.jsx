import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import { Small, Medium } from "../Generic/Responsive";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
class SidePanelContent extends React.Component {
  state = {
    sector: null
  };
  showSectorInfo = sector => {
    this.setState({
      sector
    });
    const { terria } = this.props;
    terria.selectedSector = sector.title.toLowerCase();
    console.log(sector);
    knockout.getObservable(terria, "selectedSector").subscribe(() => {
      const selectedSector = terria.selectedSector;
      console.log(selectedSector);
      terria.selectedSector = "agriculture";
    });
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
