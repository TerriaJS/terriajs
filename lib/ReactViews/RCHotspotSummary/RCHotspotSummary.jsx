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

  openStory() {
    launchStory(
      this.props.viewState.selectedHotspot?.["_story-id"]?._value,
      this.props.terria
    ).then(() => {
      this.props.viewState.storyBuilderShown = false;
      this.props.viewState.storyShown = true;
      setTimeout(function() {
        triggerResize();
      }, 1);
      this.props.terria.currentViewer.notifyRepaintRequired();
      this.props.viewState.hotspotSummaryEnabled = false;
    });
  },

  close() {
    this.props.viewState.hotspotSummaryEnabled = false;
  },

  render() {
    const hotspot = this.props.viewState.selectedHotspot;
    const type = hotspot["_rc-type"]?._value;
    const sector = hotspot["_rc-sector"]?._value;
    const title = hotspot["_rc-title"]?._value;
    const description = hotspot["_rc-description"]?._value;

    return (
      <div>
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
      </div>
    );
  }
});

module.exports = HotspotSummary;
