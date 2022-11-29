"use strict";
import React from "react";
import { Link, withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import Styles from "./RCHotspotSummary.scss";
import Icon from "../Icon";
import { getStoryHotspot } from "../../Models/Receipt";
import { filterHotspots } from "../../Models/Receipt";
class RCHotspotSummary extends React.Component {
  constructor(props) {
    super(props);    
  }

  doFilter() {
    const routedSectorName = this.props.match.params.sectorName;
    const routedStoryID = this.props.match.params.storyID;

    if (this.props.location.pathname.includes(`sector`) && this.props.location.pathname.includes(`story`)) {
      filterHotspots(this.props.viewState, routedSectorName, routedStoryID);
    }
  }
  
  componentDidMount() {
    this.doFilter();
  }

  componentDidUpdate() {
    this.doFilter();
  }

  render() {
    const routedSectorName = this.props.match.params.sectorName;
    const routedStoryID = this.props.match.params.storyID;

    const selectedHotspot = getStoryHotspot(this.props.terria.catalog, routedSectorName, routedStoryID);
    const hotspotProperties = selectedHotspot.properties;

    const title = hotspotProperties["rc-title"]?.getValue();
    const description = hotspotProperties["rc-description"]?.getValue();
    const storyImage = hotspotProperties["rc-story-img"]?.getValue() || "/images/receipt/placeholder.jpg";
    const microstories = hotspotProperties["rc-microstories"]?.getValue();

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
            <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/microstory/${microstory["micro-story-id"]}`}>
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
              glyph={Icon.GLYPHS[routedSectorName + "Simple"]}
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
          <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/page/0`}>
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
