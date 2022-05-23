import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import defined from "terriajs-cesium/Source/Core/defined";
import when from "terriajs-cesium/Source/ThirdParty/when";
import { objectParamsToURL, RCChangeUrlParams } from "../../Models/Receipt";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { Medium } from "../Generic/Responsive";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Tooltip from "../RCTooltip/RCTooltip";
import RCScenarioTabs from "../Story/RCScenarioTabs";
import Styles from "./story-panel.scss";

export function activateStory(story, terria, scenarioIndex = 0) {
  if (story.mapScenarios && story.mapScenarios[scenarioIndex]) {
    const initSources = story.mapScenarios[scenarioIndex].initSources;

    const promises = initSources.map(initSource =>
      terria.addInitSource(initSource, true)
    );
    when.all(promises).then(() => {
      const nowViewingPaths = story.mapScenarios[
        scenarioIndex
      ].initSources.reduce((p, c) => {
        if (c.sharedCatalogMembers) {
          return p.concat(Object.keys(c.sharedCatalogMembers));
        }
        return p;
      }, []);
      const nowViewing = terria.nowViewing.items;
      nowViewing.slice().forEach(item => {
        const itemToCheck = defined(item.creatorCatalogItem)
          ? item.creatorCatalogItem
          : item;
        const path = itemToCheck.uniqueId;
        if (nowViewingPaths.indexOf(path) < 0) {
          itemToCheck.isEnabled = false;
        }
      });
    });
  }
}

const RCStoryPanel = createReactClass({
  displayName: "RCStoryPanel",
  mixins: [ObserveModelMixin],
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
    //
    // Navigate to the story page coming from the url params
    //
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get("page"));
    if (page && this.props.viewState.currentStoryId !== page) {
      this.navigateStory(this.props.viewState.currentStoryId + page - 1);
    }

    this.slideIn();
    this.escKeyListener = e => {
      if (e.keyCode === 27) {
        this.exitStory();
      }
    };

    this.changeScenarioListener = e => {
      this.props.viewState.currentScenario = e.detail.scenarioID;

      const story = this.props.viewState.currentStoryId
        ? this.props.terria.stories[this.props.viewState.currentStoryId]
        : this.props.terria.stories[0];
      activateStory(
        story,
        this.props.terria,
        this.props.viewState.currentScenario
      );

      this.setState({ state: this.state });
    };

    window.addEventListener("keydown", this.escKeyListener, true);
    window.document.addEventListener(
      "changeScenario",
      this.changeScenarioListener,
      false
    );
  },

  componentDidUpdate() {
    // Make hotspots visible when zoomed in
    const stories = this.props.terria.stories || [];
    const story = stories[this.props.viewState.currentStoryId];
    this.props.terria.updateFromStartData(story.mapScenarios);
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
    this.props.viewState.topElement = "StoryPanel";
  },

  componentWillUnmount() {
    window.removeEventListener("keydown", this.escKeyListener, false);
    clearTimeout(this.slideInTimer);
    if (this.slideOutTimer) {
      clearTimeout(this.slideOutTimer);
    }
  },

  navigateStory(index) {
    this.currentScenario = undefined;
    if (index < 0) {
      index = this.props.terria.stories.length - 1;
    } else if (index >= this.props.terria.stories.length) {
      index = 0;
    }
    if (index !== this.props.viewState.currentStoryId) {
      this.props.viewState.currentStoryId = index;
      if (index < (this.props.terria.stories || []).length) {
        this.activateStory(this.props.terria.stories[index]);
      }
    }
    this.changeUrlPageParameter(index);
  },

  // This is in StoryPanel and StoryBuilder
  activateStory(_story) {
    const story = _story ? _story : this.props.terria.stories[0];
    activateStory(
      story,
      this.props.terria,
      this.props.viewState.currentScenario
    );
  },

  onCenterScene(story) {
    if (story.mapScenarios) {
      this.props.terria.updateFromStartData(story.mapScenarios);
    }
  },

  changeUrlPageParameter(page) {
    const urlParams = new URLSearchParams(window.location.search);
    window.history.pushState(
      null,
      null,
      objectParamsToURL({
        sector: urlParams.get("sector"),
        story: urlParams.get("story"),
        page: page + 1 // +1 because the page number starts with 0
      })
    );
  },
  goToPrevStory() {
    this.navigateStory(this.props.viewState.currentStoryId - 1);
    this.changeUrlPageParameter(this.props.viewState.currentStoryId);
  },

  goToNextStory() {
    this.navigateStory(this.props.viewState.currentStoryId + 1);
    this.changeUrlPageParameter(this.props.viewState.currentStoryId);
  },

  exitStory() {
    const urlParams = new URLSearchParams(window.location.search);
    // Open story summary page
    RCChangeUrlParams(
      {
        sector: urlParams.get("sector"),
        story: urlParams.get("story")
      },
      this.props.viewState
    );
  },

  scenarioChanged(scenarioId) {
    //TODO: use some kind of identifier for scenario
    this.props.viewState.currentScenario = scenarioId.toString();
    this.activateStory(this.props.viewState.currentStoryId);
    this.setState({ state: this.state });
  },

  render() {
    const { t } = this.props;
    const stories = this.props.terria.stories || [];
    const story = stories[this.props.viewState.currentStoryId];
    const scenario = this.props.viewState.currentScenario || 0;

    // find the first page with the section
    function findFirstPageOfSection(section = "") {
      return stories.findIndex(story => story.section === section);
    }

    return (
      <React.Fragment>
        <Swipeable
          onSwipedLeft={this.goToNextStory}
          onSwipedRight={this.goToPrevStory}
        >
          <div className={Styles.RCHotspotSummary}>
            <div className={Styles.titleGroup}>
              {story.sector ? (
                <Icon
                  glyph={Icon.GLYPHS[story.sector + "Simple"]}
                  className={Styles.icon}
                />
              ) : (
                <div />
              )}

              <h3>
                {story.storyTitle && story.storyTitle.length > 0
                  ? story.storyTitle
                  : t("story.untitled")}
              </h3>

              <button
                className="buttonClose"
                title={t("story.exitBtn")}
                onClick={this.slideOut}
              >
                <Icon width={20} glyph={Icon.GLYPHS.close} />
              </button>
              <br />
              {/* Sections buttons for story panel*/}
              <div className="flex flex-wrap gap-2 mb-3">
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageOfSection("INTRODUCTION"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-red-100    ${story.section ===
                    "INTRODUCTION" && "bg-red-400"}          hover:bg-red-400`}
                >
                  Scope
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageOfSection("CONNECTION"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-blue-100   ${story.section ===
                    "CONNECTION" && "bg-blue-400"}           hover:bg-blue-400`}
                >
                  Connections
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageOfSection("CLIMATE_EVENT"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-purple-100 ${story.section ===
                    "CLIMATE_EVENT" &&
                    "bg-purple-400"}      hover:bg-purple-400`}
                >
                  Climate scenarios
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageOfSection("LOCAL_IMPACT"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-green-100  ${story.section ===
                    "LOCAL_IMPACT" &&
                    "bg-green-400"}        hover:bg-green-400`}
                >
                  Local Impact
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(
                      findFirstPageOfSection("CONNECTION_IMPACT")
                    )
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-orange-100 ${story.section ===
                    "CONNECTION_IMPACT" &&
                    "bg-orange-400"}  hover:bg-orange-400`}
                >
                  Conenctions Impact
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageOfSection("EU_IMPACT"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-amber-100  ${story.section ===
                    "EU_IMPACT" &&
                    "bg-amber-400"}           hover:bg-amber-400`}
                >
                  EU impacts
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageOfSection("GLOBAL_IMPACT"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-lime-100   ${story.section ===
                    "GLOBAL_IMPACT" && "bg-lime-400"}        hover:bg-lime-400`}
                >
                  Global Impact
                </div>
              </div>
            </div>

            <div>
              {typeof story.text === "object" && (
                <RCScenarioTabs
                  story={story}
                  onScenarioChange={this.scenarioChanged}
                />
              )}
            </div>
            <div className={Styles.RCSummaryCard}>
              <div
                className={classNames(Styles.storyContainer, {
                  [Styles.isMounted]: this.state.inView
                })}
              >
                {story.text && (
                  <div className={Styles.body}>
                    {typeof story?.text === "string" &&
                      parseCustomHtmlToReact(story.text)}
                    {typeof story?.text === "object" &&
                      parseCustomHtmlToReact(story.text[scenario])}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={Styles.storyBottomNavigationItems}>
              <div className={Styles.navs}>
                <Medium>
                  <div className={Styles.left}>
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
                <If condition={this.props.terria.stories.length >= 2}>
                  <div className={Styles.navBtn}>
                    {stories.map((story, i) => (
                      <Tooltip
                        content={story.pageTitle}
                        direction="top"
                        delay="100"
                        key={story.id}
                      >
                        <button
                          title={t("story.navBtn", { title: story.pageTitle })}
                          type="button"
                          onClick={() => this.navigateStory(i)}
                        >
                          <Icon
                            style={{ fill: "currentColor" }}
                            className={`opacity-40 hover:opacity-100 ${i ===
                              this.props.viewState.currentStoryId &&
                              "opacity-100"}
                            ${
                              story.section === "INTRODUCTION"
                                ? "text-red-600"
                                : story.section === "CONNECTION"
                                ? "text-blue-600"
                                : story.section === "CLIMATE_EVENT"
                                ? "text-purple-600"
                                : story.section === "LOCAL_IMPACT"
                                ? "text-green-600"
                                : story.section === "CONNECTION_IMPACT"
                                ? "text-orange-600"
                                : story.section === "EU_IMPACT"
                                ? "text-amber-600"
                                : story.section === "GLOBAL_IMPACT" &&
                                  "text-lime-600"
                            }
                            `}
                            glyph={
                              i === this.props.viewState.currentStoryId
                                ? Icon.GLYPHS.circleFull
                                : Icon.GLYPHS.circleFull
                            }
                          />
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </If>
                <Medium>
                  <div className={Styles.right}>
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
              </div>
            </div>
          </div>
        </Swipeable>
      </React.Fragment>
    );
  }
});

export default withTranslation()(RCStoryPanel);
