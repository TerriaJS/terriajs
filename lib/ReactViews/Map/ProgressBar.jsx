"use strict";

import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import classNames from "classnames";

import Styles from "./progress-bar.scss";

// The map navigation region
const ProgressBar = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      visible: "hidden"
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.eventHelper = new EventHelper();

    this.eventHelper.add(
      this.props.terria.tileLoadProgressEvent,
      this.setProgress
    );

    // Also listen for indeterminate data source loading events
    this.eventHelper.add(
      this.props.terria.indeterminateTileLoadProgressEvent,
      this.setMode
    );

    // TODO - is this actually needed now? load events always get called when
    // changing viewer. if still reuqired,
    // clear progress when new viewer observed, rather than mounting to a 'current viewer'

    // // Clear progress when the viewer changes so we're not left with an invalid progress bar hanging on the screen.
    // this.eventHelper.add(
    //   this.props.terria.currentViewer.beforeViewerChanged,
    //   this.setProgress.bind(this, 0, 0)
    // );
  },

  setProgress(remaining, max) {
    const rawPercentage = (1 - remaining / max) * 100;
    const sanitisedPercentage = Math.floor(remaining > 0 ? rawPercentage : 100);

    this.setState({
      percentage: sanitisedPercentage
    });
  },

  setMode(loading) {
    this.setState({ loading: loading });
  },

  componentWillUnmount() {
    this.eventHelper.removeAll();
  },

  /**
   * Conditionally render two different progress bars superimposed,
   * one for the base globe where the progress bar shows actual progress,
   * and one for sources where load progress is indeterminate including 3DTilesets where the progress bar is animated.
   */
  render() {
    const width = this.state.percentage + "%";
    const visibility = this.state.percentage < 100 ? "visible" : "hidden";
    const complete = this.state.percentage === 100;
    const visIndeterminate = this.state.loading ? "visible" : "hidden";

    return (
      <>
        <div
          className={classNames(Styles.progressBarDeterminate, {
            [Styles.complete]: complete
          })}
          style={{ visibility, width }}
        />

        <div
          className={Styles.progressBarIndeterminate}
          style={{ visibility: visIndeterminate }}
        >
          <div className={Styles.progressBarValue}></div>
        </div>
      </>
    );
  }
});
module.exports = ProgressBar;
