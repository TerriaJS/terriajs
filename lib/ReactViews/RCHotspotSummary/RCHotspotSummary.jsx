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
    const hotspot = this.props.viewState.selectedHotspot;
    const sector = hotspot["_rc-sector"]?._value;
    const title = hotspot["_rc-title"]?._value;
    const description = hotspot["_rc-description"]?._value;
    const storyImage =
      hotspot["_rc-story-img"]?._value || "/images/receipt/placeholder.jpg";
    const microstories = hotspot["_rc-microstories"]?._value;

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
                  story: hotspot["rc-story-id"],
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
        { sector: this.props.viewState.selectedHotspot["rc-sector"]?._value },
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
                  story: hotspot["rc-story-id"],
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
