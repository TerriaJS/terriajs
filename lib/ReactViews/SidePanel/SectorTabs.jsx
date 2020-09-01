import React from "react";
import Icon from "../Icon";
import Styles from "./sector_tabs.scss";
import PropTypes from "prop-types";
import Agriculture from "../../../wwwroot/images/receipt/sectors/agriculture.png";
import CoastalInfra from "../../../wwwroot/images/receipt/sectors/coastal-Infra.png";
import Finance from "../../../wwwroot/images/receipt/sectors/finance.png";
import Manufacturing from "../../../wwwroot/images/receipt/sectors/manufacturing.png";
import InternationalCooperation from "../../../wwwroot/images/receipt/sectors/international-cooperation.png";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
class SectorTabs extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    selectedId: -1
  };
  componentDidMount() {
    this._viewStateChangeHandler = knockout
      .getObservable(viewState, "isHotspotsFiltered")
      .subscribe(isHotspotsFiltered => {
        if (!isHotspotsFiltered) {
          this.setState({
            selectedId: -1
          });
        }
      });
  }
  componentWillUnmount() {
    this._viewStateChangeHandler.dispose();
  }
  render() {
    const sectors = [
      {
        title: "Agriculture",
        icon: Icon.GLYPHS.agriculture,
        info: `European food security and agri-food based economy are vulnerable to anomalous weather features, for example concerning water scarcity and drought affecting soybean, rice, cocoa and coffee production outside Europe. 
               This may impact raw material supply chains, food security or price volatility. `,
        image: Agriculture
      },
      {
        title: "Manufacturing",
        icon: Icon.GLYPHS.manufacturing,
        info: `Supply of raw or processed input materials for European industries can be disrupted temporarily in case of heatwaves, 
               floods or storms in source areas `,
        image: Manufacturing
      },
      {
        title: "International Cooperation And Development",
        icon: Icon.GLYPHS.internationalCooperationAndDevelopment,
        info: `Europe’s foreign and development policy involving concerns for migration, food security, political crises, 
               development aid and disaster risk reduction is highly affected by climatic risks and extremes,
               and the forced displacement and migration patterns in response to these.`,
        image: InternationalCooperation
      },
      {
        title: "Coastal Infrastructure",
        icon: Icon.GLYPHS.coastalInfrastructure,
        info: `Civil protection and industrial production are heavily affected when storms or floods, 
               aggravated by remote ice-sheet melting and sea level rise, 
               lead to large damage to cities, ports or industrial plants in connected areas.`,
        image: CoastalInfra
      },
      {
        title: "Finance",
        icon: Icon.GLYPHS.finance,
        info: `Strong or multiple tropical cyclones may affect the solvency of (re)insurance companies, investors and EU public finance.  
              The finance sector and business are exposed via their portfolio and foreign direct investments`,
        image: Finance
      }
    ];
    const { selectedId } = this.state;
    return (
      <div className={Styles.tabsContainer}>
        {sectors.map((sector, id) => {
          return (
            <div
              key={id}
              onClick={() => {
                this.setState({ selectedId: id });
                this.props.showSectorInfo(sector);
              }}
            >
              <Icon
                glyph={sector.icon}
                className={selectedId === id ? Styles.selectedTab : ""}
              />
            </div>
          );
        })}
      </div>
    );
  }
}
SectorTabs.propTypes = {
  showSectorInfo: PropTypes.func.isRequired
};
export default SectorTabs;
