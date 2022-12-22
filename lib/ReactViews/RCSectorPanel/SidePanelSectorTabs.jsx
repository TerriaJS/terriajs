import React from "react";
import { Link, withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import Icon from "../Icon";
import Tooltip from "../RCTooltip/RCTooltip";
import Styles from "./SidePanelSectorTabs.scss";
import sectors from "../../Data/Sectors.js";
import { getSectorHotspotsList, filterHotspots } from "../../Models/Receipt";
class SidePanelSectorTabs extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    selectedHotspotsList: null,
    selectedId: -1
  };

  componentDidUpdate() {
    const routedSectorName = this.props.match.params.sectorName;

    if (this.props.location.pathname.includes(`sector`)) {
      filterHotspots(this.props.viewState, routedSectorName, null);
    }
  }

  render() {
    const routedSectorName = this.props.match.params.sectorName;
    const isTopBar = this.props.isTopBar;

    const selectedSectorId = sectors.findIndex(sector => sector.id === routedSectorName);
    const sector = sectors.find(sector => sector.id === routedSectorName);
    const selectedHotspotsList = getSectorHotspotsList(this.props.terria.catalog, routedSectorName);

    return (
      <div className={Styles.sidePanelSectorTabs}>
        {
          //
          //  Sector Selector
          //
        }
        {isTopBar && (
          <div className={Styles.tabsContainer}>
            {sectors.map((sector, id) => {
              return (
                <div key={`sidePanelSectorTabs/sector/${sector.id}`}>
                  <Tooltip content={sector.title} direction="bottom" delay="100">
                    <Link to={`/sector/${sector.id}`}>
                      <Icon
                        glyph={selectedSectorId === id ? sector.iconHover : sector.icon}
                        className={selectedSectorId === id ? Styles.selectedTab : ""}
                      />
                    </Link>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        )}
        {
          //
          // Sector info tab
          //
        }
        {!!sector && !isTopBar && (
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
        {!sector && !isTopBar && (
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
