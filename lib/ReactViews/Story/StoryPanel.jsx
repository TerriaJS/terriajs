import classNames from "classnames";
import createReactClass from "create-react-class";
import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import getPath from "../../Core/getPath";
import { isJsonObject } from "../../Core/Json";
// eslint-disable-next-line no-unused-vars
import Terria from "../../Models/Terria";
import Icon from "../../Styled/Icon";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { Medium, Small } from "../Generic/Responsive";
import Styles from "./story-panel.scss";
import CameraView from "../../Models/CameraView";
import Cesium from "../../Models/Cesium";
import Leaflet from "../../Models/Leaflet";
import rectangleToLatLngBounds from "../../Map/rectangleToLatLngBounds";
import EasingFunction from "terriajs-cesium/Source/Core/EasingFunction";
import TerriaError from "../../Core/TerriaError";

/**
 *
 * @param {any} story
 * @param {any|undefined} previousStory
 * @param {Terria} terria
 */
export async function activateStory(story, previousStory, terria) {
  // Send a GA event on scene change with URL hash
  const analyticsLabel =
    window.location.hash.length > 0
      ? window.location.hash
      : "No hash detected (story not shared yet?)";
  terria.analytics?.logEvent("story", "scene", analyticsLabel);
  if (story.shareData) {
    const sceneTransitionType = getSceneTransitionType(previousStory, story);
    const errors = [];
    await Promise.all(
      story.shareData.initSources.map(async initSource => {
        try {
          // We pluck the parameters required for sceneTransition
          // and pass on the rest to applyInitData
          // toJS is required here because applyInitData currently cannot handle a mobx object.
          const { initialCamera, ...initData } = toJS(initSource);
          await terria.applyInitData({
            initData: initData,
            replaceStratum: false,
            canUnsetFeaturePickingState: true
          });
          sceneTransition(sceneTransitionType, initialCamera, terria);
        } catch (e) {
          errors.push(
            TerriaError.from(e, {
              message: {
                key: "models.terria.loadingInitSourceError2Message",
                parameters: {
                  loadSource: initSource.name ?? "Unknown source"
                }
              }
            })
          );
        }
      })
    );
    if (errors.length > 0) {
      terria.raiseErrorToUser(
        TerriaError.combine(errors, {
          title: { key: "story.loadSceneErrorTitle" },
          message: {
            key: "story.loadSceneErrorMessage",
            parameters: { title: story.title ?? story.id }
          }
        })
      );
    }
  }

  terria.workbench.items.forEach(item => {
    terria.analytics?.logEvent("story", "datasetView", getPath(item));
  });
}

/**
 * Returns a scene transition type
 *
 * @param {any} previousStory
 * @param {any} newStory
 * @returns {"normal" | "walk"} Returns "walk" if pedestrian walk mode is ON in both
            previous & new story scenes. Otherwise returns "normal".
 */
function getSceneTransitionType(previousStory, newStory) {
  const isPedestrianWalkingInPreviousScene =
    previousStory?.shareData.initSources.some(
      initSource => initSource.isPedestrianWalkModeOn
    ) === true;
  const isPedestrianWalkingInCurrentScene =
    newStory?.shareData.initSources.some(
      initSource => initSource.isPedestrianWalkModeOn
    ) === true;
  const shouldWalkBetweenScenes =
    isPedestrianWalkingInPreviousScene === true &&
    isPedestrianWalkingInCurrentScene === true;
  const transitionType = shouldWalkBetweenScenes ? "walk" : "normal";
  return transitionType;
}

/**
 * Fly to a scene with the given initialCamera
 *
 * @param {CameraView} initialCamera The camera view for the scene
 * @param {Terria} terria The terria instance
 */
function sceneTransition(transitionType, cameraViewJson, terria) {
  const flightDurationSeconds = 2.0;

  const cesiumFlyTo = (cesium, transitionType, cameraView) => {
    const camera = cesium.scene.camera;
    const commonFlyToOptions = {
      duration: flightDurationSeconds,
      destination: cameraView.position,
      orientation: {
        direction: cameraView.direction,
        up: cameraView.up
      }
    };
    let flyToOptions;
    if (transitionType === "walk") {
      flyToOptions = {
        ...commonFlyToOptions,
        easingFunction: EasingFunction.LINEAR_NONE,
        // Setting maximumHeight to a low enough value ensures that
        // the flight path height change will be a linear interpolation
        // of the height between the start and end points. Thus if 2 points
        // are on street level, the camera remains steady when zooming between
        // them. This effect is useful for story scenes captured in pedestrian mode
        // where the scenes could be at street level and replaying the story should not
        // change the camera height unnecessarily.
        // Relevant Cesium code: https://github.com/CesiumGS/cesium/blob/ab07bcb130d99baaae08ce5e4346ae79899136e0/Source/Scene/CameraFlightPath.js#L110-L126
        maximumHeight: -1000
      };
    } else {
      flyToOptions = { ...commonFlyToOptions };
    }
    camera.flyTo(flyToOptions);
  };

  const leafletFlyTo = (leaflet, transitionType, cameraView) => {
    const bounds = rectangleToLatLngBounds(cameraView.rectangle);
    leaflet.map.flyToBounds(bounds, {
      animate: flightDurationSeconds > 0,
      duration: flightDurationSeconds
    });
  };

  if (isJsonObject(cameraViewJson)) {
    const cameraView = CameraView.fromJson(cameraViewJson);
    if (terria.currentViewer instanceof Cesium)
      cesiumFlyTo(terria.currentViewer, transitionType, cameraView);
    else if (terria.currentViewer instanceof Leaflet)
      leafletFlyTo(terria.currentViewer, transitionType, cameraView);
    else terria.currentViewer.zoomTo(cameraView, flightDurationSeconds);
  }
}

const StoryPanel = observer(
  createReactClass({
    displayName: "StoryPanel",
    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },
    slideInTimer: null,
    slideOutTimer: null,
    escKeyListener: null,

    getInitialState() {
      return {
        inView: false
      };
    },
    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
      const stories = this.props.terria.stories || [];
      if (
        this.props.viewState.currentStoryId > stories.length - 1 ||
        this.props.viewState.currentStoryId < 0
      ) {
        this.props.viewState.currentStoryId = 0;
      }
      this.activateStory(stories[this.props.viewState.currentStoryId]);
    },
    componentDidMount() {
      this.slideIn();
      this.escKeyListener = e => {
        if (e.keyCode === 27) {
          this.exitStory();
        }
      };
      window.addEventListener("keydown", this.escKeyListener, true);
    },

    slideIn() {
      this.slideInTimer = setTimeout(() => {
        this.setState({
          inView: true
        });
      }, 300);
    },

    slideOut() {
      this.slideOutTimer = this.setState({
        inView: false
      });
      setTimeout(() => {
        this.exitStory();
      }, 300);
    },

    onClickContainer() {
      runInAction(() => {
        this.props.viewState.topElement = "StoryPanel";
      });
    },

    componentWillUnmount() {
      window.removeEventListener("keydown", this.escKeyListener, false);
      clearTimeout(this.slideInTimer);
      if (this.slideOutTimer) {
        clearTimeout(this.slideOutTimer);
      }
    },

    navigateStory(index) {
      if (index < 0) {
        index = this.props.terria.stories.length - 1;
      } else if (index >= this.props.terria.stories.length) {
        index = 0;
      }
      if (index !== this.props.viewState.currentStoryId) {
        const previousStory = this.props.terria.stories[
          this.props.viewState.currentStoryId
        ];
        runInAction(() => {
          this.props.viewState.currentStoryId = index;
        });
        if (index < (this.props.terria.stories || []).length) {
          this.activateStory(this.props.terria.stories[index], previousStory);
        }
      }
    },

    // This is in StoryPanel and StoryBuilder
    activateStory(_story, previousStory) {
      const story = _story ? _story : this.props.terria.stories[0];
      activateStory(story, previousStory, this.props.terria);
    },

    onCenterScene(story) {
      if (story.shareData) {
        runInAction(() => {
          this.props.terria
            .updateFromStartData(
              story.shareData,
              `Story data: \`${story.title ?? story.id}\``
            )
            .catch(function(e) {
              this.props.terria.raiseErrorToUser(e);
            });
        });
      }
    },

    goToPrevStory() {
      this.navigateStory(this.props.viewState.currentStoryId - 1);
    },

    goToNextStory() {
      this.navigateStory(this.props.viewState.currentStoryId + 1);
    },

    exitStory() {
      runInAction(() => {
        this.props.viewState.storyShown = false;
      });
      this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
      const { t } = this.props;
      const stories = this.props.terria.stories || [];
      const story = stories[this.props.viewState.currentStoryId];
      const locationBtn = (
        <button
          className={Styles.locationBtn}
          title={t("story.locationBtn")}
          onClick={this.onCenterScene.bind(this, story)}
        >
          <Icon glyph={Icon.GLYPHS.location} />
        </button>
      );
      const exitBtn = (
        <button
          className={Styles.exitBtn}
          title={t("story.exitBtn")}
          onClick={this.slideOut}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
      );
      return (
        <Swipeable
          onSwipedLeft={this.goToNextStory}
          onSwipedRight={this.goToPrevStory}
        >
          <div
            className={classNames(
              Styles.fullPanel,
              {
                [Styles.isHidden]: !this.props.viewState.storyShown,
                [Styles.isPushedUp]: this.props.viewState.chartIsOpen,
                [Styles.isCentered]: this.props.viewState.isMapFullScreen
              },
              this.props.viewState.topElement === "StoryPanel"
                ? "top-element"
                : ""
            )}
            onClick={this.onClickContainer}
          >
            <div
              className={classNames(Styles.storyContainer, {
                [Styles.isMounted]: this.state.inView
              })}
              key={story.id}
            >
              <Medium>
                <div className={Styles.left}>
                  {locationBtn}
                  <button
                    className={Styles.previousBtn}
                    disabled={this.props.terria.stories.length <= 1}
                    title={t("story.previousBtn")}
                    onClick={this.goToPrevStory}
                  >
                    <Icon glyph={Icon.GLYPHS.left} />
                  </button>
                </div>
              </Medium>
              <div className={Styles.story}>
                <div className={Styles.storyHeader}>
                  <Small>{locationBtn}</Small>
                  {story.title && story.title.length > 0 ? (
                    <h3>{story.title}</h3>
                  ) : (
                    <h3> {t("story.untitled")} </h3>
                  )}
                  <Small>{exitBtn}</Small>
                  <If condition={this.props.terria.stories.length >= 2}>
                    <Medium>
                      <div className={Styles.navBtn}>
                        {" "}
                        {stories.map((story, i) => (
                          <button
                            title={t("story.navBtn", { title: story.title })}
                            type="button"
                            key={story.id}
                            onClick={() => this.navigateStory(i)}
                          >
                            {" "}
                            <Icon
                              glyph={
                                i === this.props.viewState.currentStoryId
                                  ? Icon.GLYPHS.circleFull
                                  : Icon.GLYPHS.circleEmpty
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </Medium>
                  </If>
                </div>
                {story.text && (
                  <div className={Styles.body}>
                    {parseCustomHtmlToReact(story.text)}
                  </div>
                )}
              </div>
              <Medium>
                <div className={Styles.right}>
                  {exitBtn}
                  <button
                    disabled={this.props.terria.stories.length <= 1}
                    className={Styles.nextBtn}
                    title={t("story.nextBtn")}
                    onClick={this.goToNextStory}
                  >
                    <Icon glyph={Icon.GLYPHS.right} />
                  </button>
                </div>
              </Medium>
              <Small>
                <div className={Styles.navBtnMobile}>
                  {" "}
                  {stories.map((story, i) => (
                    <button
                      title={t("story.navBtnMobile", { title: story.title })}
                      type="button"
                      key={story.id}
                      className={classNames(Styles.mobileNavBtn, {
                        [Styles.isActive]:
                          i === this.props.viewState.currentStoryId
                      })}
                      onClick={() => this.navigateStory(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </Small>
            </div>
          </div>
        </Swipeable>
      );
    }
  })
);

export default withTranslation()(StoryPanel);
