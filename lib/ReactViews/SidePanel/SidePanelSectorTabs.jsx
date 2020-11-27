import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import Styles from "./SidePanelSectorTabs.scss";

class SidePanelSectorTabs extends React.Component {
  state = {
    sector: null
  };
  showSectorInfo = sector => {
    this.setState({ sector });
    this.filterHotspots(sector.title);
  };

  componentDidMount() {
    this._viewStateChangeHandler = knockout
      // eslint-disable-next-line jsx-control-statements/jsx-jcs-no-undef
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
    if (viewState) {
      viewState.isHotspotsFiltered = true;
    }
  };
  closeSectorInfo = () => {
    this.setState({ sector: null });
    this.props.viewState.isHotspotsFiltered = false;
  };

  render() {
    const { sector } = this.state;

    return (
      <div className={Styles.sidePanelSectorTabs}>
        <SectorTabs showSectorInfo={this.showSectorInfo} />
        <SectorInfo sector={sector} close={this.closeSectorInfo} />
      </div>
    );
  }
}

SidePanelSectorTabs.propTypes = {
  /**
   * Terria instance
   */
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object
};
export default SidePanelSectorTabs;
