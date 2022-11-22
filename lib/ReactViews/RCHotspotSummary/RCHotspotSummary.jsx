"use strict";
import React from "react";
import { Link, withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import Styles from "./RCHotspotSummary.scss";
import { setSelectedHotspot  } from "../../Models/Receipt";
import Icon from "../Icon";

class RCHotspotSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const selectedSector = this.props.match.params.sectorName;
    const selectedStory = this.props.match.params.storyID;
    
    setSelectedHotspot(this.props.match.params, this.props.viewState);    
    const hotspot = this.props.viewState.selectedHotspot;
    
    const sector = hotspot["rc-sector"]?.getValue();
    const title = hotspot["rc-title"]?.getValue();
    const description = hotspot["rc-description"]?.getValue();
    const storyImage =
      hotspot["rc-story-img"]?.getValue() || "/images/receipt/placeholder.jpg";
    const microstories = hotspot["rc-microstories"]?.getValue();

    const listMicrostories =
      Array.isArray(microstories) &&
      microstories.map(microstory => {
        // Text protection image for the microstories selector
        const imgStyle = {
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.1),rgba(0, 0, 0, 0.6)), url(" +
            microstory["micro-story-img"] +
            ")"
        };
        return (          
          <div
            key={microstory["micro-story-title"]}
            className={Styles["microstory-card"]}
            style={imgStyle}
          >
            <Link to={`/sector/${sector.id}/story/${selectedStory}/microstory/${microstory["micro-story-id"]}`}>
              <div>
                <div className={Styles["microstory-title"]}>
                  {microstory["micro-story-title"]}
                </div>
                <div className={Styles["microstory-desc"]}>
                  {microstory["micro-story-desc"]}{" "}
                </div>
              </div>
            </Link>
          </div>
        );
      });

    return (
      <div className={Styles.RCHotspotSummary}>
        <div className={Styles.RCSummaryCard}>
          <div className={Styles.titleGroup}>            
            <Icon
              glyph={Icon.GLYPHS[sector + "Simple"]}
              className={Styles.icon}
            />
            <h3>{title || "No title provided"}</h3>
            <Link to="/">
              <button
                type="button"
                className={Styles.btnCloseFeature}
                title="Close"
              >
                <Icon glyph={Icon.GLYPHS.close} className={Styles.iconCLose} />
              </button>
            </Link>
          </div>
          <img src={storyImage} className={Styles.imgStory} />
          <p>{description || "No description provided"}</p>
          <br />
          <Link to={`/sector/${selectedSector}/story/${selectedStory}/page/0`}>
            <button type="button" className={Styles.receiptButton}>            
            <Icon className={Styles.iconPlay} glyph={Icon.GLYPHS.roundedPlay} />
            Play story
          </button>
          </Link>

          {listMicrostories.length > 0 ? (
            <div className={Styles.microstoriesWrapper}>
              <h3>Microstories</h3>
              <div className={Styles.microstories}>{listMicrostories}</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

RCHotspotSummary.propTypes = {
  viewState: PropTypes.object.isRequired,
  onClick: PropTypes.func
};

export default withRouter(RCHotspotSummary);
