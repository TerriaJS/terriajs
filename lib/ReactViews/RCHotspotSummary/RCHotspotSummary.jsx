"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Styles from "./RCHotspotSummary.scss";
import { launchStory } from "../../Models/Receipt";
import triggerResize from "../../Core/triggerResize";
import Icon from "../Icon";

const HotspotSummary = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    onClick: PropTypes.func
  },

  openStory(paramsUrl) {
    const storyParams =
      (paramsUrl.story && paramsUrl) ||
      this.props.viewState.selectedHotspot?.["_rc-story"]?._value;
    if (storyParams) {
      launchStory(storyParams, this.props.terria).then(() => {
        this.props.viewState.storyBuilderShown = false;
        this.props.viewState.storyShown = true;
        setTimeout(function() {
          triggerResize();
        }, 1);
        this.props.terria.currentViewer.notifyRepaintRequired();
        this.props.viewState.hotspotSummaryEnabled = false;
      });
    } else {
      console.error("Story id not provided");
    }
  },

  close() {
    this.props.viewState.hotspotSummaryEnabled = false;
  },

  render() {
    const hotspot = this.props.viewState.selectedHotspot;
    // const type = hotspot["_rc-type"]?._value;
    const sector = hotspot["_rc-sector"]?._value;
    const title = hotspot["_rc-title"]?._value;
    const description = hotspot["_rc-description"]?._value;
    const microstories = hotspot["_rc-microstories"]?._value;

    const listMicrostories =
      Array.isArray(microstories) &&
      microstories.map(microstory => {
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
            onClick={() => this.openStory(microstory["rc-story"])}
          >
            <div>
              <div className={Styles["microstory-title"]}>
                {microstory["micro-story-title"]}{" "}
              </div>
              <div className={Styles["microstory-desc"]}>
                {microstory["micro-story-desc"]}{" "}
              </div>
            </div>
          </div>
        );
      });

    return (
      <div className={Styles.RCHotspotSummary}>
        <div className={Styles.flex}>
          <div className={Styles.flexGrow}>
            <Icon glyph={Icon.GLYPHS[sector]} className={Styles.icon} />
          </div>
          <button
            type="button"
            onClick={this.close}
            className={Styles.btnCloseFeature}
            title="Close"
          >
            <Icon glyph={Icon.GLYPHS.close} />
          </button>
        </div>
        <h1>{title || "No title provided"}</h1>
        <p>{description || "No description provided"}</p>
        <br />
        <button
          type="button"
          className={Styles.satelliteSuggestionBtn}
          onClick={this.openStory}
        >
          Play story
        </button>

        {listMicrostories.length > 0 ? (
          <div className={Styles.microstoriesWrapper}>
            <h3>Microstories</h3>
            <div className={Styles.microstories}>{listMicrostories}</div>
          </div>
        ) : null}
      </div>
    );
  }
});

module.exports = HotspotSummary;
