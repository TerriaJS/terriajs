import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import Styles from "./SidePanelSectorTabs.scss";

class SidePanelSectorTabs extends React.Component {
  state = {
    sector: null,
    selectedHotspotsList: null
  };
  showSectorInfo = sector => {
    this.setState({ sector });
    this.setState({
      selectedHotspotsList:
        this.props.terria.nowViewing.items.find(
          item => item.name === sector.title
        )?._dataSource.entities.values || []
    });
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
      item.name === sector && console.log("🎹", item.dataUrl);
      if (item.type === "geojson") {
        // item.name === sector && console.log('🎹', item);
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
    const { terria, viewState } = this.props;
    const { sector, selectedHotspotsList } = this.state;
    return (
      <div className={Styles.sidePanelSectorTabs}>
        <SectorTabs showSectorInfo={this.showSectorInfo} />
        <SectorInfo
          terria={terria}
          viewState={viewState}
          sector={sector}
          hotspots={selectedHotspotsList}
          close={this.closeSectorInfo}
        />
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
