import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import FeatureDetection from "terriajs-cesium/Source/Core/FeatureDetection";
import ActionBarPortal from "../ActionBar/ActionBarPortal";
import BottomDock from "../BottomDock/BottomDock";
import { MapCredits } from "../Credits";
import Loader from "../Loader";
import BottomLeftBar from "../Map/BottomLeftBar/BottomLeftBar";
import DistanceLegend from "../Map/Legend/DistanceLegend";
import LocationBar from "../Map/Legend/LocationBar";
import MenuBar from "../Map/MenuBar";
import MapNavigation from "../Map/Navigation/MapNavigation";
import TerriaViewerWrapper from "../Map/TerriaViewerWrapper";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";
import Styles from "./map-column.scss";
import Toast from "./Toast";
import { withViewState } from "./ViewStateContext";

const chromeVersion = FeatureDetection.chromeVersion();

/**
 * Right-hand column that contains the map, controls that sit over the map and sometimes the bottom dock containing
 * the timeline and charts.
 */
const MapColumn = observer(
  createReactClass({
    displayName: "MapColumn",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      customFeedbacks: PropTypes.array.isRequired,
      allBaseMaps: PropTypes.array.isRequired,
      animationDuration: PropTypes.number.isRequired,
      customElements: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {};
    },

    render() {
      const { customElements } = this.props;
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
              <If condition={!this.props.viewState.hideMapUi}>
                <div
                  css={`
                    ${this.props.viewState.explorerPanelIsVisible &&
                    "opacity: 0.3;"}
                  `}
                >
                  <MenuBar
                    allBaseMaps={this.props.allBaseMaps}
                    menuItems={customElements.menu}
                    menuLeftItems={customElements.menuLeft}
                    animationDuration={this.props.animationDuration}
                    elementConfig={this.props.viewState.terria.elements.get(
                      "menu-bar"
                    )}
                  />
                  <MapNavigation
                    terria={this.props.viewState.terria}
                    viewState={this.props.viewState}
                    navItems={customElements.nav}
                    elementConfig={this.props.viewState.terria.elements.get(
                      "map-navigation"
                    )}
                  />
                </div>
              </If>
              <div
                className={Styles.mapWrapper}
                style={{
                  height: this.state.height || "100%"
                }}
              >
                <TerriaViewerWrapper
                  terria={this.props.viewState.terria}
                  viewState={this.props.viewState}
                />
              </div>
              <If condition={!this.props.viewState.hideMapUi}>
                <BottomLeftBar
                  terria={this.props.viewState.terria}
                  viewState={this.props.viewState}
                />
                <ActionBarPortal
                  show={this.props.viewState.isActionBarVisible}
                />
                <SlideUpFadeIn isVisible={this.props.viewState.isMapZooming}>
                  <Toast>
                    <Loader
                      message={t("toast.mapIsZooming")}
                      textProps={{
                        style: {
                          padding: "0 5px"
                        }
                      }}
                    />
                  </Toast>
                </SlideUpFadeIn>
                <MapCredits
                  hideTerriaLogo={
                    !!this.props.viewState.terria.configParameters
                      .hideTerriaLogo
                  }
                  credits={this.props.viewState.terria.configParameters.extraCreditLinks?.slice()}
                  currentViewer={
                    this.props.viewState.terria.mainViewer.currentViewer
                  }
                />
                <div className={Styles.locationDistance}>
                  <LocationBar
                    terria={this.props.viewState.terria}
                    mouseCoords={
                      this.props.viewState.terria.currentViewer.mouseCoords
                    }
                  />
                  <DistanceLegend terria={this.props.viewState.terria} />
                </div>
              </If>
              {/* TODO: re-implement/support custom feedbacks */}
              {/* <If
                condition={
                  !this.props.customFeedbacks.length &&
                  this.props.viewState.terria.configParameters.feedbackUrl &&
                  !this.props.viewState.hideMapUi
                }
              >
                <div
                  className={classNames(Styles.feedbackButtonWrapper, {
                    [Styles.withTimeSeriesControls]: defined(
                      this.props.viewState.terria.timelineStack.top
                    )
                  })}
                >
                  <FeedbackButton
                    viewState={this.props.viewState}
                    btnText={t("feedback.feedbackBtnText")}
                  />
                </div>
              </If> */}

              <If
                condition={
                  this.props.customFeedbacks.length &&
                  this.props.viewState.terria.configParameters.feedbackUrl &&
                  !this.props.viewState.hideMapUi
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
            <If
              condition={
                this.props.viewState.terria.configParameters.printDisclaimer
              }
            >
              <div className={classNames(Styles.mapCell, "print")}>
                <a
                  className={Styles.printDisclaimer}
                  href={
                    this.props.viewState.terria.configParameters.printDisclaimer
                      .url
                  }
                >
                  {
                    this.props.viewState.terria.configParameters.printDisclaimer
                      .text
                  }
                </a>
              </div>
            </If>
          </div>
          <If condition={!this.props.viewState.hideMapUi}>
            <div className={Styles.mapRow}>
              <div className={mapCellClass}>
                <BottomDock
                  terria={this.props.viewState.terria}
                  viewState={this.props.viewState}
                  elementConfig={this.props.viewState.terria.elements.get(
                    "bottom-dock"
                  )}
                />
              </div>
            </div>
          </If>
        </div>
      );
    }
  })
);

export default withTranslation()(withViewState(MapColumn));
