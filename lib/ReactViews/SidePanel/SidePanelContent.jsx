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
    const { terria } = this.props;
    knockout.getObservable(terria, "selectedSector").subscribe(() => {
      const selectedSector = terria.selectedSector;
      terria.selectedSector = "agriculture";
    });

    this.setState({
      sector: {
        title: sector.title,
        info: sector.info
      }
    });
  };
  // componentDidMount() {
  //   const { terria } = this.props;
  //   this.selectedSectorSubscription = knockout
  //     .getObservable(terria, "selectedSector")
  //     .subscribe(() => {
  //       const selectedSector = terria.selectedSector;
  //       console.log('CDM', selectedSector);
  //     });
  // }
  // componentWillUnmount() {
  //   if (defined(this.selectedSectorSubscription)) {
  //     this.selectedSectorSubscription.dispose();
  //     this.selectedSectorSubscription = undefined;
  //   }
  // }

  render() {
    const { sector } = this.state;

    return (
      <>
        <Medium>
          <SectorTabs showSectorInfo={this.showSectorInfo} />
          <SectorInfo sector={sector} />
        </Medium>
        <Small>
          <SectorInfo sector={sector} />
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
