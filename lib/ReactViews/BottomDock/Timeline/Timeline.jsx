"use strict";

import createReactClass from "create-react-class";
import dateFormat from "dateformat";
import React from "react";
import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import ClockRange from "terriajs-cesium/Source/Core/ClockRange";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

import ObserveModelMixin from "../../ObserveModelMixin";
import TimelineControls from "./TimelineControls";
import CesiumTimeline from "./CesiumTimeline";
import DateTimePicker from "./DateTimePicker";
import { formatDateTime } from "./DateFormats";
import { withTranslation } from "react-i18next";

import Styles from "./timeline.scss";

export const Timeline = createReactClass({
  displayName: "Timeline",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    autoPlay: PropTypes.bool,
    locale: PropTypes.object,
    t: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      autoPlay: true
    };
  },

  getInitialState() {
    return {
      currentTimeString: "<>",
      isPickerOpen: false
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    const updateCurrentTimeString = clock => {
      const time = clock.currentTime;
      let currentTime;
      if (
        defined(this.props.terria.timeSeriesStack.topLayer) &&
        defined(
          this.props.terria.timeSeriesStack.topLayer.dateFormat.currentTime
        )
      ) {
        currentTime = dateFormat(
          time,
          this.props.terria.timeSeriesStack.topLayer.dateFormat.currentTime
        );
      } else {
        currentTime = formatDateTime(
          JulianDate.toDate(time),
          this.props.locale
        );
      }

      this.setState({
        currentTimeString: currentTime
      });
    };

    this.removeTickEvent = this.props.terria.clock.onTick.addEventListener(
      updateCurrentTimeString
    );

    updateCurrentTimeString(this.props.terria.clock);

    this.topLayerSubscription = knockout
      .getObservable(this.props.terria.timeSeriesStack, "topLayer")
      .subscribe(() => this.updateForNewTopLayer());
    this.updateForNewTopLayer();
  },

  componentWillUnmount() {
    this.removeTickEvent();
    this.topLayerSubscription.dispose();
  },

  updateForNewTopLayer() {
    let autoPlay = this.props.terria.autoPlay;
    if (!defined(autoPlay)) {
      autoPlay = this.props.autoPlay;
    }
    const terria = this.props.terria;
    const newTopLayer = terria.timeSeriesStack.topLayer;

    // default to playing and looping when shown unless told otherwise
    if (newTopLayer && autoPlay) {
      terria.clock.tick();
      terria.clock.shouldAnimate = true;
    }

    terria.clock.clockRange = ClockRange.LOOP_STOP;

    this.setState({
      layerName: newTopLayer && newTopLayer.name
    });
  },

  changeDateTime(time) {
    this.props.terria.clock.currentTime = JulianDate.fromDate(new Date(time));
    this.props.terria.currentViewer.notifyRepaintRequired();
  },

  onOpenPicker() {
    this.setState({
      isPickerOpen: true
    });
  },

  onClosePicker() {
    this.setState({
      isPickerOpen: false
    });
  },

  render() {
    const terria = this.props.terria;
    const catalogItem = terria.timeSeriesStack.topLayer;
    if (!defined(catalogItem)) {
      return null;
    }
    const { t } = this.props;
    return (
      <div className={Styles.timeline}>
        <div className={Styles.textRow}>
          <div
            className={Styles.textCell}
            title={t("dateTime.timeline.textCell")}
          >
            {catalogItem.name} {this.state.currentTimeString}
          </div>
        </div>
        <div className={Styles.controlsRow}>
          <TimelineControls
            clock={terria.clock}
            analytics={terria.analytics}
            currentViewer={terria.currentViewer}
          />
          <If
            condition={
              defined(catalogItem.availableDates) &&
              catalogItem.availableDates.length !== 0
            }
          >
            <DateTimePicker
              currentDate={catalogItem.clampedDiscreteTime}
              dates={catalogItem.availableDates}
              onChange={this.changeDateTime}
              openDirection="up"
              isOpen={this.state.isPickerOpen}
              onOpen={this.onOpenPicker}
              onClose={this.onClosePicker}
              dateFormat={catalogItem.dateFormat}
            />
          </If>
          <CesiumTimeline terria={terria} />
        </div>
      </div>
    );
  }
});

export default withTranslation()(Timeline);
