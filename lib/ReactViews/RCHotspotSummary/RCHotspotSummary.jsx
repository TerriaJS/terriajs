"use strict";
import React from "react";
import PropTypes from "prop-types";
import Styles from "./RCHotspotSummary.scss";
import { RCChangeUrlParams } from "../../Models/Receipt";
import Icon from "../Icon";

class RCHotspotSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log("HS summary" , this.props.viewState.selectedHotspot);
    const hotspot = this.props.viewState.selectedHotspot;
    const storyId = hotspot["rc-story-id"]?.getValue();
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
            onClick={() =>
              RCChangeUrlParams(
                {
                  sector,
                  story: storyId,
                  microstory: microstory["micro-story-id"],
                  page: 1
                },
                this.props.viewState
              )
            }
          >
            <div>
              <div className={Styles["microstory-title"]}>
                {microstory["micro-story-title"]}
              </div>
              <div className={Styles["microstory-desc"]}>
                {microstory["micro-story-desc"]}{" "}
              </div>
            </div>
          </div>
        );
      });

    const close = () => {
      RCChangeUrlParams(
        { sector: this.props.viewState.RCSelectedSector },
        this.props.viewState
      );
    };

    return (
      <div className={Styles.RCHotspotSummary}>
        <div className={Styles.RCSummaryCard}>
          <div className={Styles.titleGroup}>
            <Icon
              glyph={Icon.GLYPHS[sector + "Simple"]}
              className={Styles.icon}
            />
            <h3>{title || "No title provided"}</h3>
            <button
              type="button"
              onClick={close}
              className={Styles.btnCloseFeature}
              title="Close"
            >
              <Icon glyph={Icon.GLYPHS.close} className={Styles.iconCLose} />
            </button>
          </div>
          <img src={storyImage} className={Styles.imgStory} />
          <p>{description || "No description provided"}</p>
          <br />
          <button
            type="button"
            className={Styles.receiptButton}
            onClick={() =>
              RCChangeUrlParams(
                {
                  sector,
                  story: storyId,
                  page: 1
                },
                this.props.viewState
              )
            }
          >
            <Icon className={Styles.iconPlay} glyph={Icon.GLYPHS.roundedPlay} />
            Play story
          </button>

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

export default RCHotspotSummary;
