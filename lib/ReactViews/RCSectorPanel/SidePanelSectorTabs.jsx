import React from "react";
import SectorInfo from "./SectorInfo";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import { RCChangeUrlParams } from "../../Models/Receipt";
import Tooltip from "../RCTooltip/RCTooltip";
import Icon from "../Icon";
import Styles from "./SidePanelSectorTabs.scss";

// Sector images
import Agriculture from "../../../wwwroot/images/receipt/sectors/agriculture.jpg";
import Manufacturing from "../../../wwwroot/images/receipt/sectors/manufacturing.png";
import InternationalCooperation from "../../../wwwroot/images/receipt/sectors/international-cooperation.png";
import CoastalInfra from "../../../wwwroot/images/receipt/sectors/coastal-Infra.png";
import Finance from "../../../wwwroot/images/receipt/sectors/finance.png";

class SidePanelSectorTabs extends React.Component {
  state = {
    sector: null,
    selectedHotspotsList: null,
    selectedId: -1
  };
  sectors = [
    {
      id: "agriculture",
      title: "Agriculture",
      icon: Icon.GLYPHS.agriculture,
      iconHover: Icon.GLYPHS.agricultureHover,
      info: `European food security and agri-food based economy are vulnerable to anomalous weather features, for example concerning water scarcity and drought affecting soybean, rice, cocoa and coffee production outside Europe.
               This may impact raw material supply chains, food security or price volatility. `,
      image: Agriculture
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      icon: Icon.GLYPHS.manufacturing,
      iconHover: Icon.GLYPHS.manufacturingHover,
      info: `Supply of raw or processed input materials for European industries can be disrupted temporarily in case of heatwaves,
               floods or storms in source areas `,
      image: Manufacturing
    },
    {
      id: "cooperation",
      title: "International Cooperation And Development",
      icon: Icon.GLYPHS.internationalCooperationAndDevelopment,
      iconHover: Icon.GLYPHS.internationalCooperationAndDevelopmentHover,
      info: `Europe’s foreign and development policy involving concerns for migration, food security, political crises,
               development aid and disaster risk reduction is highly affected by climatic risks and extremes,
               and the forced displacement and migration patterns in response to these.`,
      image: InternationalCooperation
    },
    {
      id: "coastalInfrastructure",
      title: "Coastal Infrastructure",
      icon: Icon.GLYPHS.coastalInfrastructure,
      iconHover: Icon.GLYPHS.coastalInfrastructureHover,
      info: `Civil protection and industrial production are heavily affected when storms or floods,
               aggravated by remote ice-sheet melting and sea level rise,
               lead to large damage to cities, ports or industrial plants in connected areas.`,
      image: CoastalInfra
    },
    {
      id: "finance",
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
        if (RCSelectedSector) {
          const selectedSector = this.sectors.find(
            sector => sector.id === RCSelectedSector
          );
          const sectorIndex = this.sectors.findIndex(
            sector => sector.id === RCSelectedSector
          );

          this.setState({ selectedId: sectorIndex });

          // Open panel sector panel
          this.showSectorInfo(selectedSector);
        } else {
          // unselect the id
          this.setState({ selectedId: null });
          // Close the panel
          this.setState({ sector: null });
        }
      });

    this._viewStateChangeHandler = knockout
      .getObservable(viewState, "isHotspotsFiltered")
      .subscribe(isHotspotsFiltered => {
        if (!isHotspotsFiltered) {
          this.setState({
            selectedId: -1,
            sector: null
          });
        }
      });
  }

  componentWillUnmount() {
    this._viewStateChangeHandler.dispose();
    this._viewStateSelectedSector.dispose();
    this._viewStateChangeHandler.dispose();
  }
  showSectorInfo = selectedSector => {
    this.setState({ sector: selectedSector });
    // Show list sotries in a sector and activate panel
    this.setState({
      selectedHotspotsList:
        this.props.terria.nowViewing.items.find(
          item => item.name === selectedSector.id
        )?._dataSource.entities.values || []
    });
  };

  render() {
    const { viewState } = this.props;
    const { sector, selectedId, selectedHotspotsList } = this.state;
    return (
      <div className={Styles.sidePanelSectorTabs}>
        <div className={Styles.tabsContainer}>
          {this.sectors.map((sector, id) => {
            return (
              <div
                key={id}
                onClick={() => {
                  RCChangeUrlParams({ sector: sector.id }, viewState);
                }}
              >
                <Tooltip content={sector.title} direction="bottom" delay="100">
                  <Icon
                    glyph={selectedId === id ? sector.iconHover : sector.icon}
                    className={selectedId === id ? Styles.selectedTab : ""}
                  />
                </Tooltip>
              </div>
            );
          })}
        </div>

        <SectorInfo
          viewState={viewState}
          sector={sector}
          hotspots={selectedHotspotsList}
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
