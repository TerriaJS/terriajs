import React from "react";
import SectorTabs from "./SectorTabs";
import SectorInfo from "./SectorInfo";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import Styles from "./SidePanelSectorTabs.scss";
import Icon from "../Icon";
import Agriculture from "../../../wwwroot/images/receipt/sectors/agriculture.jpg";
import Manufacturing from "../../../wwwroot/images/receipt/sectors/manufacturing.png";
import InternationalCooperation from "../../../wwwroot/images/receipt/sectors/international-cooperation.png";
import CoastalInfra from "../../../wwwroot/images/receipt/sectors/coastal-Infra.png";
import Finance from "../../../wwwroot/images/receipt/sectors/finance.png";

class SidePanelSectorTabs extends React.Component {
  state = {
    sector: null,
    selectedHotspotsList: null
  };
  sectors = [
    {
      title: "Agriculture",
      icon: Icon.GLYPHS.agriculture,
      iconHover: Icon.GLYPHS.agricultureHover,
      info: `European food security and agri-food based economy are vulnerable to anomalous weather features, for example concerning water scarcity and drought affecting soybean, rice, cocoa and coffee production outside Europe.
               This may impact raw material supply chains, food security or price volatility. `,
      image: Agriculture
    },
    {
      title: "Manufacturing",
      icon: Icon.GLYPHS.manufacturing,
      iconHover: Icon.GLYPHS.manufacturingHover,
      info: `Supply of raw or processed input materials for European industries can be disrupted temporarily in case of heatwaves,
               floods or storms in source areas `,
      image: Manufacturing
    },
    {
      title: "International Cooperation And Development",
      icon: Icon.GLYPHS.internationalCooperationAndDevelopment,
      iconHover: Icon.GLYPHS.internationalCooperationAndDevelopmentHover,
      info: `Europe’s foreign and development policy involving concerns for migration, food security, political crises,
               development aid and disaster risk reduction is highly affected by climatic risks and extremes,
               and the forced displacement and migration patterns in response to these.`,
      image: InternationalCooperation
    },
    {
      title: "Coastal Infrastructure",
      icon: Icon.GLYPHS.coastalInfrastructure,
      iconHover: Icon.GLYPHS.coastalInfrastructureHover,
      info: `Civil protection and industrial production are heavily affected when storms or floods,
               aggravated by remote ice-sheet melting and sea level rise,
               lead to large damage to cities, ports or industrial plants in connected areas.`,
      image: CoastalInfra
    },
    {
      title: "Finance",
      icon: Icon.GLYPHS.finance,
      iconHover: Icon.GLYPHS.financeHover,
      info: `Strong or multiple tropical cyclones may affect the solvency of (re)insurance companies, investors and EU public finance.
              The finance sector and business are exposed via their portfolio and foreign direct investments`,
      image: Finance
    }
  ];

  componentDidMount() {
    this._viewStateSelectedSector = knockout
      // eslint-disable-next-line jsx-control-statements/jsx-jcs-no-undef
      .getObservable(viewState, "RCSelectedSector")
      .subscribe(RCSelectedSector => {
        const sector = this.sectors.find(
          sector => sector.title === RCSelectedSector
        );
        this.setState({ sector: sector });
        // Show list sotries in a sector and activate panel
        this.setState({
          selectedHotspotsList:
            this.props.terria.nowViewing.items.find(
              item => item.name === sector.title
            )?._dataSource.entities.values || []
        });

        // TODO THE FILTERS ARE NOT WORKING 👧🏽
        // Filter hostpots
        // this.filterHotspots(sector.title);
      });

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
    this._viewStateSelectedSector.dispose();
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
    const { terria, viewState } = this.props;
    const { sector, selectedHotspotsList } = this.state;
    return (
      <div className={Styles.sidePanelSectorTabs}>
        <SectorTabs
          // showSectorInfo={this.showSectorInfo}
          sectors={this.sectors}
        />
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
