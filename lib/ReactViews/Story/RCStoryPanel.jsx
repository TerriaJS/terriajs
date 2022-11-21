import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { Route, Switch, Link, withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import { RCChangeUrlParams, setSelectedStory } from "../../Models/Receipt";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { Medium } from "../Generic/Responsive";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Tooltip from "../RCTooltip/RCTooltip";
import Styles from "./story-panel.scss";

// export function activateStory(story, terria, scenarioIndex = 0) {
//   if (selectedPage.mapScenarios && selectedPage.mapScenarios[scenarioIndex]) {
//     const initSources = selectedPage.mapScenarios[scenarioIndex].initSources;

//     const promises = initSources.map(initSource =>
//       terria.addInitSource(initSource, true)
//     );
//     when.all(promises).then(() => {
//       const catalogPaths = initSources.reduce((p, c) => {
//         if (c.sharedCatalogMembers) {
//           return p.concat(Object.keys(c.sharedCatalogMembers));
//         }
//         return p;
//       }, []);
//       const catalogItems = terria.catalog.group.items;
//       catalogItems.slice().forEach(item => {
//         const itemToCheck = defined(item.creatorCatalogItem)
//           ? item.creatorCatalogItem
//           : item;
//         const path = itemToCheck.uniqueId;
//         if (catalogPaths.indexOf(path) < 0) {
//           itemToCheck.isEnabled = false;
//         }
//       });
//     });
//   }
// }

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
      inView: true
    };
  },
  componentDidMount() {
    //
    // Navigate to the story page coming from the url params
    //        
    const path = this.props.match.path;
    const selectedSector = this.props.match.params.sectorName;
    const selectedStory = this.props.match.params.storyID;
    const selectedPageIndex = Number(this.props.match.params.pageIndex);

    setSelectedStory(this.props.match.params, this.props.viewState);

    this.slideIn();
    this.escKeyListener = e => {
      if (e.keyCode === 27) {
        this.exitStory();
      }
    };

    this.changeScenarioListener = e => {
      this.props.viewState.currentScenario = e.detail.scenarioID;
      this.changeUrlPageParameter(this.props.viewState.currentStoryId);
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
    const stories = this.props.terria.stories;
    const selectedPage = stories[this.props.viewState.currentStoryId];
    this.props.terria.updateFromStartData(selectedPage.mapScenarios);
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

  navigateStory(pageIndex) {
    this.currentScenario = undefined;

    if (!this.props.terria.stories) {
      return;
    }
    
    // Clamp page number to range
    if (pageIndex < 0) {
      pageIndex = 0;
    } else if (pageIndex >= this.props.terria.stories.length) {
      pageIndex = this.props.terria.stories.length - 1;
    }

    this.changeUrlPageParameter(pageIndex);
  },

  onCenterScene(selectedPage) {
    if (selectedPage.mapScenarios) {
      this.props.terria.updateFromStartData(selectedPage.mapScenarios);
    }
  },

  changeUrlPageParameter(pageIndex) {
    const urlParams = new URLSearchParams(window.location.search);
    RCChangeUrlParams(
      {
        sector: urlParams.get("sector"),
        story: urlParams.get("story"),
        page: `${pageIndex + 1}` // For the user, pages start with 1
      }, this.props.viewState);
  },

  exitStory() {
    const urlParams = new URLSearchParams(window.location.search);
    // Open story summary page
    RCChangeUrlParams("", this.props.viewState);
  },

  render() {
    const path = this.props.match.path;
    const selectedSector = this.props.match.params.sectorName;
    const selectedStory = this.props.match.params.storyID;
    const selectedPageIndex = Number(this.props.match.params.pageIndex);

    const { t } = this.props;
    const stories = this.props.terria.stories || [];
    
    const selectedPage = stories[selectedPageIndex];
    console.log("RCStoryPanel story: ", stories, selectedPageIndex, selectedPage);

    const scenario = this.props.viewState.currentScenario || 0;

    // find the first page with the section
    function findFirstPageIndexOfSection(section = "") {
      return stories.findIndex(story => selectedPage.section === section);
    }

    return (
      <React.Fragment>
        <Swipeable
          onSwipedLeft={() => this.navigateStory(this.props.viewState.currentStoryId - 1)}
          onSwipedRight={() => this.navigateStory(this.props.viewState.currentStoryId + 1)}
        >
          
          {selectedPage && (<div className={Styles.RCHotspotSummary}>
            <div className={Styles.titleGroup}>
              {selectedPage.sector && (<Icon
                  glyph={Icon.GLYPHS[selectedPage.sector + "Simple"]}
                  className={Styles.icon}
                />
              )}

              <h3>
                {selectedPage.storyTitle && selectedPage.storyTitle.length > 0
                  ? selectedPage.storyTitle
                  : t("story.untitled")}
              </h3>

              <Link to="/">
                <button
                  className="buttonClose"
                  title={t("story.exitBtn")}                  
                >
                  <Icon width={20} glyph={Icon.GLYPHS.close} />
                </button>
              </Link>

              <br />
              {/* Sections buttons for story panel*/}
              <div className="flex flex-wrap gap-2 mb-3">
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageIndexOfSection("SCOPE"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-red-100    ${selectedPage.section ===
                    "SCOPE" && "bg-red-400"}          hover:bg-red-400`}
                >
                  Scope
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageIndexOfSection("HOTSPOTS"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-blue-100   ${selectedPage.section ===
                    "HOTSPOTS" && "bg-blue-400"}           hover:bg-blue-400`}
                >
                  Hotspots
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageIndexOfSection("CONNECTION"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-purple-100 ${selectedPage.section ===
                    "CONNECTION" && "bg-purple-400"}      hover:bg-purple-400`}
                >
                  Connection
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageIndexOfSection("EU_IMPACT"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-green-100  ${selectedPage.section ===
                    "EU_IMPACT" && "bg-green-400"}        hover:bg-green-400`}
                >
                  EU impact
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(
                      findFirstPageIndexOfSection("CLIMATE_SCENARIOS")
                    )
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-orange-100 ${selectedPage.section ===
                    "CLIMATE_SCENARIOS" &&
                    "bg-orange-400"}  hover:bg-orange-400`}
                >
                  Climate scenarios
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(
                      findFirstPageIndexOfSection("SOC_ECON_SCENARIOS")
                    )
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-amber-100  ${selectedPage.section ===
                    "SOC_ECON_SCENARIOS" &&
                    "bg-amber-400"}           hover:bg-amber-400`}
                >
                  Socio-economic scenarios
                </div>
                <div
                  onClick={() =>
                    this.navigateStory(findFirstPageIndexOfSection("COMPARISON"))
                  }
                  className={`btn btn-xs rounded-none border-0 text-black bg-lime-100   ${selectedPage.section ===
                    "COMPARISON" && "bg-lime-400"}        hover:bg-lime-400`}
                >
                  Comparison
                </div>
              </div>
            </div>

            <div className={Styles.RCSummaryCard}>
              <div
                className={classNames(Styles.storyContainer, {
                  [Styles.isMounted]: this.state.inView
                })}
              >
                {selectedPage.text && (
                  <div className={Styles.body}>
                    {typeof selectedPage?.text === "string" &&
                      parseCustomHtmlToReact(selectedPage.text)}
                    {typeof selectedPage?.text === "object" &&
                      parseCustomHtmlToReact(selectedPage.text[scenario])}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={Styles.storyBottomNavigationItems}>
              <div className={Styles.navs}>
                <Medium>
                  <Link to={`/sector/${selectedSector}/story/${selectedStory}/page/${selectedPageIndex == 0 ? 0 : selectedPageIndex-1}`}>
                    <div className={Styles.left}>
                      <button
                        className={Styles.previousBtn}
                        disabled={this.props.terria.stories.length <= 1}
                        title={t("story.previousBtn")}
                      >
                        <Icon glyph={Icon.GLYPHS.left} />
                      </button>
                    </div>
                  </Link>
                </Medium>
                <If condition={this.props.terria.stories.length >= 2}>
                  <div className={Styles.navBtn}>
                    {stories.map((selectedPage, pageIndex) => (
                      <Tooltip
                        content={selectedPage.pageTitle}
                        direction="top"
                        delay="100"
                        key={selectedPage.id}
                      >
                        <button
                          title={t("story.navBtn", { title: selectedPage.pageTitle })}
                          type="button"
                          onClick={() => this.navigateStory(pageIndex)}
                        >
                          <Icon
                            style={{ fill: "currentColor" }}
                            className={`opacity-40 hover:opacity-100 ${pageIndex ===
                              this.props.viewState.currentStoryId &&
                              "opacity-100"}
                            ${
                              selectedPage.section === "SCOPE"
                                ? "text-red-600"
                                : selectedPage.section === "HOTSPOTS"
                                ? "text-blue-600"
                                : selectedPage.section === "CONNECTION"
                                ? "text-purple-600"
                                : selectedPage.section === "EU_IMPACT"
                                ? "text-green-600"
                                : selectedPage.section === "CLIMATE_SCENARIOS"
                                ? "text-orange-600"
                                : selectedPage.section === "SOC_ECON_SCENARIOS"
                                ? "text-amber-600"
                                : selectedPage.section === "COMPARISON" &&
                                  "text-lime-600"
                            }
                            `}
                            glyph={
                              pageIndex === this.props.viewState.currentStoryId
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
                  <Link to={`/sector/${selectedSector}/story/${selectedStory}/page/${selectedPageIndex == this.props.terria.stories.length-1 ? this.props.terria.stories.length-1 : selectedPageIndex+1}`}>
                    <div className={Styles.right}>                    
                      <button
                        disabled={this.props.terria.stories.length <= 1}
                        className={Styles.nextBtn}
                        title={t("story.nextBtn")}
                      >
                        <Icon glyph={Icon.GLYPHS.right} />
                      </button>
                    </div>
                  </Link>
                </Medium>
              </div>
            </div>
          </div>)}          
        </Swipeable>
      </React.Fragment>
    );
  }
});

export default withTranslation()(withRouter(RCStoryPanel));
