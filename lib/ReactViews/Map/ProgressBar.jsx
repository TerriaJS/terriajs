"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTheme } from "styled-components";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import { withViewState } from "../StandardUserInterface/ViewStateContext";
import Styles from "./progress-bar.scss";

// The map navigation region
const ProgressBar = observer(
  createReactClass({
    displayName: "ProgressBar",
    propTypes: {
      viewState: PropTypes.object.isRequired,
      theme: PropTypes.object.isRequired
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
        this.props.viewState.terria.tileLoadProgressEvent,
        this.setProgress
      );

      // Also listen for indeterminate data source loading events
      this.eventHelper.add(
        this.props.viewState.terria.indeterminateTileLoadProgressEvent,
        this.setMode
      );

      // TODO - is this actually needed now? load events always get called when
      // changing viewer. if still reuqired,
      // clear progress when new viewer observed, rather than mounting to a 'current viewer'

      // // Clear progress when the viewer changes so we're not left with an invalid progress bar hanging on the screen.
      // this.eventHelper.add(
      //   this.props.viewState.terria.currentViewer.beforeViewerChanged,
      //   this.setProgress.bind(this, 0, 0)
      // );
    },

    setProgress(remaining, max) {
      const rawPercentage = (1 - remaining / max) * 100;
      const sanitisedPercentage = Math.floor(
        remaining > 0 ? rawPercentage : 100
      );

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
     * Progress bar is influced by two loading states:
     * The base globe where the progress bar shows actual progress,
     * Sources where load progress is indeterminate including 3DTilesets where the progress bar is animated.
     */
    render() {
      const determinateProgress = this.state.percentage + "%";
      const indeterminateStillLoading = this.state.loading;
      const allComplete = this.state.percentage === 100 && !this.state.loading;

      // use the baseMapContrastColor to ensure progress bar is visible on light backgrounds. If contrast color is white, use it. If its black, use the primary color of the current theme.
      const backgroundColor =
        this.props.viewState.terria.baseMapContrastColor === "#ffffff"
          ? "#ffffff"
          : this.props.theme.colorPrimary;

      return (
        <div
          className={classNames(Styles.progressBar, {
            [Styles.complete]: allComplete,
            [Styles.indeterminateBarAnimated]: indeterminateStillLoading
          })}
          style={{
            width: indeterminateStillLoading ? "100%" : determinateProgress,
            backgroundColor
          }}
        />
      );
    }
  })
);

export default withViewState(withTheme(ProgressBar));
