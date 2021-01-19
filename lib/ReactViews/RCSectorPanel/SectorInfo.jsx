import React from "react";
import Styles from "./SectorInfo.scss";
import PropTypes from "prop-types";
import Icon from "../Icon.jsx";
import { RCChangeUrlParams } from "../../Models/Receipt";

class SectorInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { sector, hotspots, viewState } = this.props;
    if (sector !== null) {
      return (
        <div className={Styles.panel}>
          <div className={Styles.panelBarTitle}>
            <h3 style={{ marginTop: 0 }}>{sector.title}</h3>
            <button
              className={Styles.exitBtn}
              onClick={() => RCChangeUrlParams("", viewState)}
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
          </div>

          <div className="rc-card">
            <img src={sector.image} alt="" />
            <div className="rc-card-text">{sector.info}</div>
          </div>

          {/* Story list in sector*/}

          {hotspots && hotspots.length > 0 && (
            <div>
              <h4>Stories</h4>
              <div className="rc-list">
                {hotspots &&
                  hotspots.map((hotspot, i) => (
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
                      <button
                        onClick={() =>
                          RCChangeUrlParams(
                            {
                              sector: sector.id,
                              story: hotspot.properties["rc-story-id"]._value
                            },
                            viewState
                          )
                        }
                        className="rc-button"
                      >
                        View
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className={Styles.panel}>
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        <div className="rc-card">
          <div className="rc-card-text">
            <p className="bold">
              The RECEIPT climate story explorer allows you to explore
              storylines that show indirect impact of climate change on EU.
            </p>
            <p>
              As much of the wealth and many of the products that are eaten or
              used in the EU are produced or sourced in the rest of the world,
              climate change impacts the EU not only directly, but also through
              impact on remote regions. With this application, we can build and
              show stories to highlight several of these climate impact
              hotspots.
            </p>
            <p>
              More information on the RECEIPT Horizon 2020 project can be found
              on
              <a href="https://climatestorylines.eu/"> climatestorylines.eu</a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

SectorInfo.propTypes = {
  sector: PropTypes.object,
  hotspots: PropTypes.array,
  viewState: PropTypes.object
};

export default SectorInfo;
