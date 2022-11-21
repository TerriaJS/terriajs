import React from "react";
import { Link, Route, Switch, withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import { RCChangeUrlParams } from "../../Models/Receipt";
import Icon from "../Icon";
import Tooltip from "../RCTooltip/RCTooltip";
import Styles from "./SidePanelSectorTabs.scss";
import sectors from "../../Data/Sectors.js";

class SidePanelSectorTabs extends React.Component {
  state = {
    sector: null,
    sectors: sectors,
    selectedHotspotsList: null,
    selectedId: -1
  };

  componentDidMount() {
  }
  componentWillUnmount() {
  }

  render() {
    const { viewState } = this.props;
    const { sectors } = this.state;
    
    const path = this.props.match.path;    
    const selectedSector = this.props.match.params.sectorName;

    const selectedId = sectors.findIndex(
      sector => sector.id === selectedSector
    );
    const sector = sectors.find(
      sector => sector.id === selectedSector
    );
    const selectedHotspotsList =
      this.props.terria.nowViewing.items.find(item => item.name === sector?.id)
        ?._dataSource.entities.values || [];

    return (
      <div className={Styles.sidePanelSectorTabs}>
        {
          //
          //  Sector Selector
          //
        }
        <div className={Styles.tabsContainer}>
          {sectors.map((sector, id) => {
            return (
              <div key={`sidePanelSectorTabs/sector/${sector.id}`}>
                <Tooltip content={sector.title} direction="bottom" delay="100">
                  <Link to={`/sector/${sector.id}`}>
                    <Icon
                      glyph={selectedId === id ? sector.iconHover : sector.icon}
                      className={selectedId === id ? Styles.selectedTab : ""}
                    />
                  </Link>
                </Tooltip>
              </div>
            );
          })}
        </div>
        {
          //
          // Sector info tab
          //
        }
        {!!sector && (
          <div className={Styles.panel}>
            <div className={Styles.panelBarTitle}>
              <h3 style={{ marginTop: 0 }}>{sector.title}</h3>
              <Link to={`/`}>
                <button
                  className={Styles.exitBtn}                
                >
                  <Icon glyph={Icon.GLYPHS.close} />
                </button>
              </Link>
            </div>

            <div className="rc-card">
              <img src={sector.image} alt="" />
              <div className="rc-card-text">{sector.info}</div>
            </div>

            {/* Story list in sector*/}
            {selectedHotspotsList && selectedHotspotsList.length > 0 && (
              <div>
                <h4>Stories</h4>
                <div className="rc-list">
                  {selectedHotspotsList.map((hotspot, i) => (
                    <div key={i} className="rc-list-row">
                      <img
                        src={
                          hotspot.properties["rc-story-img"]?._value ||
                          sector.image
                        }
                        alt={hotspot.properties["rc-title"]?._value}
                      />
                      <div className="rc-list-text">
                        {hotspot.properties["rc-title"]?._value}
                      </div>
                      <Link to={`/sector/${sector.id}/story/${hotspot.properties["rc-story-id"]?._value}`}>
                        <button className="rc-button">View</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {
          //
          // Welcome tab
          //
        }
        {!sector && (
          <div className={Styles.panel}>
            <h2 style={{ marginTop: 0 }}>Welcome</h2>
            <div className="rc-card">
              <div className="rc-card-text">
                <p className="bold">
                  The RECEIPT climate story explorer allows you to explore
                  storylines that show indirect impact of climate change on the
                  European Union.
                </p>
                <p>
                  As much of the wealth and many of the products that are eaten
                  or used in the EU are produced or sourced in the rest of the
                  world, climate change impacts the EU not only directly, but
                  also through impact on remote regions. With this application,
                  we can build and show stories to highlight several of these
                  climate impact hotspots.
                </p>
                <p>
                  More information on the RECEIPT Horizon 2020 project can be
                  found at
                  <a href="https://climatestorylines.eu/">
                    {" "}
                    climatestorylines.eu
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
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
export default withRouter(SidePanelSectorTabs);
