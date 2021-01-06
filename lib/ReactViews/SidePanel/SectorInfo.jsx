import React from "react";
import Styles from "./sector_info.scss";
import PropTypes from "prop-types";
import Icon from "../Icon.jsx";

class SectorInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  openStorySummary(viewState, terria, close) {
    console.log("🎹", viewState);

    // TODO: SELECT FEATURE HERE

    // close possible opened stories
    // viewState.storyShown = false;
    // terria.currentViewer.notifyRepaintRequired();
    //
    // Close preview summary (important to force rerender)
    // viewState.hotspotSummaryEnabled = false;
    // viewState.selectedHotspot = terria.selectedFeature.properties;
    // viewState.hotspotSummaryEnabled = true;

    // Close current panel
    close();
  }

  render() {
    const { sector, hotspots, viewState, terria, close } = this.props;

    if (sector !== null) {
      return (
        <div className={Styles.panel}>
          <div className={Styles.panelBarTitle}>
            <h3 style={{ marginTop: 0 }}>{sector.title}</h3>
            <button className={Styles.exitBtn} onClick={this.props.close}>
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
                        alt=""
                      />
                      <div className="rc-list-text">
                        {hotspot.properties["rc-title"]?._value}
                      </div>
                      <button
                        onClick={() =>
                          this.openStorySummary(viewState, terria, close)
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
  close: PropTypes.func,
  viewState: PropTypes.object,
  terria: PropTypes.object
};

export default SectorInfo;
