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
import Styles from "./NavigationTopBar";

const NavigationTopBar = createReactClass({
  displayName: "NavigationTopBar",
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

    // const scenario = this.props.viewState.selectedScenario || 0;

    // this.props.viewState.selectedStoryID = routedStoryID;
    // this.props.viewState.selectedPageIndex = routedPageIndex;
    // this.props.viewState.selectedScenario = scenario;

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

    return (
      <React.Fragment>

          {selectedPage? (<div className={Styles.RCHotspotSummary}>
            <div className={Styles.titleGroup}>
              {/* Icon disabled because it's SUPER big and I can't reduce it */}
              <div>
              {/* {selectedPage.sector && (<Icon
                  width={20}
                  glyph={Icon.GLYPHS[selectedPage.sector + "Simple"]}
                  className={Styles.icon}
                />
              )} */}
              </div>

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
              <div className="flex flex-wrap mb-3">

                {terriaStories.map((storyPage, pageIndex) => (
                  <div key={pageIndex}> {/* This empty tag is needed for the <If> and <Link> blocks to work within the terriaStories.map() */}
                  <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/page/${pageIndex}`}>
                  <div className="flex">
                    <If condition={pageIndex != 0}>
                    <div>
                      <svg height="24" width="100%" viewBox="0 0 20 80">
                        <polyline points="20,0 0,0 20,40 0,80 20,80" stroke="black" strokeWidth="3" fill="transparent"/>
                        <polygon points="0,0 20,0 20,80 0,80 20,40"
                                className={`fill-${selectColorForSection(storyPage.section)}-${storyPage == selectedPage ? "400" : "100"}
                                            hover:fill-${selectColorForSection(storyPage.section)}-400
                        `}/>
                      </svg>
                    </div>
                    </If>
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
                    <If condition={pageIndex != terriaStories.length-1}>
                    <div>
                      <svg height="24" width="100%" viewBox="0 0 20 80">
                        <polyline points="0,0 20,40 0,80" stroke="black" strokeWidth="3" fill="transparent"/>
                        <polygon points="0,0 20,40 0,80"
                                className={`fill-${selectColorForSection(storyPage.section)}-${storyPage == selectedPage ? "400" : "100"}
                                            hover:fill-${selectColorForSection(storyPage.section)}-400
                        `}/>
                      </svg>
                    </div>
                    </If>
                  </div>
                  </Link>
                  </div>
                ))}
              </div>

              {/* <Link to="/">
                <button className="buttonClose" title={t("story.exitBtn")}>
                <Icon width={20} glyph={Icon.GLYPHS.close} />
                </button>
              </Link> */}

            </div>


          </div>) : (<div>{routedPageIndex}</div>)}
      </React.Fragment>
    );
  }
});

export default withTranslation()(withRouter(NavigationTopBar));
