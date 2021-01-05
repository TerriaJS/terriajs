import React from "react";
import Styles from "./sector_info.scss";
import PropTypes from "prop-types";
import Icon from "../Icon.jsx";

class SectorInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { sector } = this.props;
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
  close: PropTypes.func
};

export default SectorInfo;
