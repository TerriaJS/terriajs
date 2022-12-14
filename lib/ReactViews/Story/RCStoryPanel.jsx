import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { Link, withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import { setSelectedStory, activateStory } from "../../Models/Receipt";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { Medium } from "../Generic/Responsive";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Tooltip from "../RCTooltip/RCTooltip";
import Styles from "./story-panel.scss";

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
  componentDidMount() {
    //
    // Navigate to the story page coming from the url params
    //
    this.slideIn();

    this.changeScenarioListener = e => {
      this.props.viewState.selectedScenario = e.detail.scenarioID;
      this.setState({ state: this.state });
    };

    window.document.addEventListener(
      "changeScenario",
      this.changeScenarioListener,
      false
    );

    // Activate the story (page)
    const promise = setSelectedStory(this.props.match.params, this.props.viewState);
    promise.then(() => 
      activateStory(this.props.viewState, true, true)
    )
  },

  componentDidUpdate() {    
    activateStory(this.props.viewState, true, true);

    // console.log(`RCStoryPanel didupdate`);
    // setSelectedStory(this.props.match.params, this.props.viewState);
  },

  slideIn() {
    this.slideInTimer = setTimeout(() => {
      this.setState({
        inView: true
      });
    }, 300);
  },

  slideOut() {
    this.slideOutTimer = setTimeout(() => {
      this.setState({
        inView: false
      });    
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

  onCenterScene(selectedPage) {
    if (selectedPage.mapScenarios) {
      this.props.terria.updateFromStartData(selectedPage.mapScenarios);
    }
  },

  render() {
    const { t, history } = this.props;

    const routedSectorName = this.props.match.params.sectorName;
    const routedStoryID = this.props.match.params.storyID;
    const routedPageIndex = Number(this.props.match.params.pageIndex);

    const terriaStories = this.props.terria.stories || [];    
    const selectedPage = terriaStories[routedPageIndex];
    
    const scenario = this.props.viewState.selectedScenario || 0;

    this.props.viewState.selectedStoryID = routedStoryID;
    this.props.viewState.selectedPageIndex = routedPageIndex;
    this.props.viewState.selectedScenario = scenario;

    // find the first page with the section
    function findFirstPageURLOfSection(section = "") {
      const pageIndex = terriaStories.findIndex(page => page.section === section);
      return `/sector/${routedSectorName}/story/${routedStoryID}/page/${pageIndex}`;
    }

    function isPageFirstOfSection(pageIndex) {
      if (pageIndex == 0) {
        return true;
      }
      if (terriaStories[pageIndex].section === terriaStories[pageIndex-1].section) {
        return false;
      }
      return true;
    }

    function selectColorForSection(section = "") {
      if (section === "SCOPE") {
        return "red"
      } else if (section === "HOTSPOTS") {
        return "blue"
      } else if (section === "CONNECTION") {
        return "purple"
      } else if (section === "EU_IMPACT") {
        return "green"
      } else if (section === "CLIMATE_SCENARIOS") {
        return "orange"
      } else if (section === "SOC_ECON_SCENARIOS") {
        return "amber"
      } else if (section === "COMPARISON") {
        return "lime"
      }
    }


    const prevURL = `/sector/${routedSectorName}/story/${routedStoryID}/page/${routedPageIndex == 0 ? 0 : routedPageIndex-1}`; 
    const nextURL = `/sector/${routedSectorName}/story/${routedStoryID}/page/${routedPageIndex == terriaStories.length-1 ? terriaStories.length-1 : routedPageIndex+1}`;

    return (
      <React.Fragment>
        <Swipeable
          onSwipedLeft={() => history.push(nextURL)}
          onSwipedRight={() => history.push(prevURL)}
        >
          
          {selectedPage? (<div className={Styles.RCHotspotSummary}>
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

                {terriaStories.map((storyPage, pageIndex) => (
                  <> {/* This empty tag is needed for the <If> and <Link> blocks to work within the terriaStories.map() */}
                  <If condition={pageIndex > 0}>
                  <div>
                    <svg height="25" width="100%" viewBox="0 0 50 80">
                    <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/page/${pageIndex-1}`}>
                        <polygon points="0,0 20,40 0,80"
                                 className={`btn btn-xs rounded-none border-0
                                             fill-${selectColorForSection(terriaStories[pageIndex-1].section)}-${terriaStories[pageIndex-1] == selectedPage ? "400" : "100"}
                                             hover:fill-${selectColorForSection(terriaStories[pageIndex-1].section)}-400
                        `}/>
                      </Link>
                      <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/page/${pageIndex}`}>
                        <polygon points="10,0 50,0 50,80 10,80 30,40"
                                 className={`btn btn-xs rounded-none border-0
                                             fill-${selectColorForSection(storyPage.section)}-${storyPage == selectedPage ? "400" : "100"}
                                             hover:fill-${selectColorForSection(storyPage.section)}-400
                        `}/>
                      </Link>
                    </svg>
                  </div>
                  </If>

                  <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/page/${pageIndex}`}>
                    <div className={`btn btn-xs rounded-none border-0 text-black
                                     bg-${selectColorForSection(storyPage.section)}-${storyPage == selectedPage ? "400" : "100"}
                                     hover:bg-${selectColorForSection(storyPage.section)}-400
                    `}>
                      {
                        !isPageFirstOfSection(pageIndex)
                          ? " "
                          : storyPage.section === "SCOPE"
                          ? "Scope"
                          : storyPage.section === "HOTSPOTS"
                          ? "Hotspots"
                          : storyPage.section === "CONNECTION"
                          ? "Connection"
                          : storyPage.section === "EU_IMPACT"
                          ? "EU impact"
                          : storyPage.section === "CLIMATE_SCENARIOS"
                          ? "Climate scenarios"
                          : storyPage.section === "SOC_ECON_SCENARIOS"
                          ? "Socio-economic scenarios"
                          : storyPage.section === "COMPARISON" &&
                            "Comparison"
                      }
                    </div>
                  </Link>
                  </>
                ))}
              </div>
            </div>

            {/* DO NOT DELETE THIS DIV - It's making sure the story is rendered at the correct height (for some reason, god I hate CSS) */}
            <div />
            
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
                  <Link to={prevURL}>
                    <div className={Styles.left}>
                      <button
                        className={Styles.previousBtn}
                        disabled={terriaStories.length <= 1}
                        title={t("story.previousBtn")}
                      >
                        <Icon glyph={Icon.GLYPHS.left} />
                      </button>
                    </div>
                  </Link>
                </Medium>
                <Medium>                
                  <Link to={nextURL}>
                    <div className={Styles.right}>                    
                      <button
                        disabled={terriaStories.length <= 1}
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
          </div>) : (<div>Loading story page failed.</div>)}
        </Swipeable>
      </React.Fragment>
    );
  }
});

export default withTranslation()(withRouter(RCStoryPanel));
