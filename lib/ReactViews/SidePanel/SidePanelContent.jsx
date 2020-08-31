import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import { Small, Medium } from "../Generic/Responsive";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
class SidePanelContent extends React.Component {
  state = {
    sector: null
  };
  showSectorInfo = sector => {
    this.setState({
      sector
    });
    this.filterHotspots(sector.title);
  };
  componentDidMount() {
    this._viewStateChangeHandler = knockout
      .getObservable(viewState, "isHotspotsFiltered")
      .subscribe(isHotspotsFiltered => {
        if (!isHotspotsFiltered) {
          this.setState({
            sector: null
          });
        }
      });
  }
  componentWillUnmount() {
    this._viewStateChangeHandler.dispose();
  }
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
