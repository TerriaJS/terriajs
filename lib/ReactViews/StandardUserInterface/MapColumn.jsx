import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import "mutationobserver-shim";

import TerriaViewerWrapper from "../Map/TerriaViewerWrapper.jsx";
import LocationBar from "../Map/Legend/LocationBar.jsx";
import DistanceLegend from "../Map/Legend/DistanceLegend.jsx";
import FeedbackButton from "../Feedback/FeedbackButton.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import BottomDock from "../BottomDock/BottomDock.jsx";
import defined from "terriajs-cesium/Source/Core/defined";
import FeatureDetection from "terriajs-cesium/Source/Core/FeatureDetection";
import classNames from "classnames";
import { withTranslation } from "react-i18next";

import Styles from "./map-column.scss";

const isIE = FeatureDetection.isInternetExplorer();
const chromeVersion = FeatureDetection.chromeVersion();

/**
 * Right-hand column that contains the map, controls that sit over the map and sometimes the bottom dock containing
 * the timeline and charts.
 *
 * Note that because IE9-11 is terrible the pure-CSS layout that is used in nice browsers doesn't work, so for IE only
 * we use a (usually polyfilled) MutationObserver to watch the bottom dock and resize when it changes.
 */
const MapColumn = createReactClass({
  displayName: "MapColumn",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    customFeedbacks: PropTypes.array.isRequired,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {};
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    if (isIE) {
      this.observer = new MutationObserver(this.resizeMapCell);
      window.addEventListener("resize", this.resizeMapCell, false);
    }
  },

  addBottomDock(bottomDock) {
    if (isIE) {
      this.observer.observe(bottomDock, {
        childList: true,
        subtree: true
      });
    }
  },

  newMapCell(mapCell) {
    if (isIE) {
      this.mapCell = mapCell;

      this.resizeMapCell();
    }
  },

  resizeMapCell() {
    if (this.mapCell) {
      this.setState({
        height: this.mapCell.offsetHeight
      });
    }
  },

  componentWillUnmount() {
    if (isIE) {
      window.removeEventListener("resize", this.resizeMapCell, false);
      this.observer.disconnect();
    }
  },

  render() {
    const { t } = this.props;
    // TODO: remove? see: https://bugs.chromium.org/p/chromium/issues/detail?id=1001663
    const isAboveChrome75 =
      chromeVersion && chromeVersion[0] && Number(chromeVersion[0]) > 75;
    const mapCellClass = classNames(Styles.mapCell, {
      [Styles.mapCellChrome]: isAboveChrome75
    });
    return (
      <div
        className={classNames(Styles.mapInner, {
          [Styles.mapInnerChrome]: isAboveChrome75
        })}
      >
        <div className={Styles.mapRow}>
          <div
            className={classNames(mapCellClass, Styles.mapCellMap)}
            ref={this.newMapCell}
          >
            <div
              className={Styles.mapWrapper}
              style={{ height: this.state.height || (isIE ? "100vh" : "100%") }}
            >
              <TerriaViewerWrapper
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
            <If condition={!this.props.viewState.hideMapUi()}>
              <div className={Styles.locationDistance}>
                <LocationBar
                  terria={this.props.terria}
                  mouseCoords={this.props.viewState.mouseCoords}
                />
                <DistanceLegend terria={this.props.terria} />
              </div>
            </If>
            <If
              condition={
                !this.props.customFeedbacks.length &&
                this.props.terria.configParameters.feedbackUrl &&
                !this.props.viewState.hideMapUi()
              }
            >
              <div
                className={classNames(Styles.feedbackButtonWrapper, {
                  [Styles.withTimeSeriesControls]: defined(
                    this.props.terria.timeSeriesStack.topLayer
                  )
                })}
              >
                <FeedbackButton
                  viewState={this.props.viewState}
                  btnText={t("feedback.feedbackBtnText")}
                />
              </div>
            </If>

            <If
              condition={
                this.props.customFeedbacks.length &&
                this.props.terria.configParameters.feedbackUrl &&
                !this.props.viewState.hideMapUi()
              }
            >
              <For
                each="feedbackItem"
                of={this.props.customFeedbacks}
                index="i"
              >
                <div key={i}>{feedbackItem}</div>
              </For>
            </If>
          </div>
          <If condition={this.props.terria.configParameters.printDisclaimer}>
            <div className={classNames(mapCellClass, "print")}>
              <a
                className={Styles.printDisclaimer}
                href={this.props.terria.configParameters.printDisclaimer.url}
              >
                {this.props.terria.configParameters.printDisclaimer.text}
              </a>
            </div>
          </If>
        </div>
        <If condition={!this.props.viewState.hideMapUi()}>
          <div className={Styles.mapRow}>
            <div className={mapCellClass}>
              <BottomDock
                terria={this.props.terria}
                viewState={this.props.viewState}
                domElementRef={this.addBottomDock}
              />
            </div>
          </div>
        </If>
      </div>
    );
  }
});

export default withTranslation()(MapColumn);
