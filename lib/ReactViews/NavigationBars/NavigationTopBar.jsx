import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { Link, withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import { setSelectedStory, activateStory } from "../../Models/Receipt";
import { Medium } from "../Generic/Responsive";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./NavigationBars.scss";
import Branding from "../StandardUserInterface/Branding";
import Loader from "../Loader"

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
    // Navigate to the story page coming from the url params
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

    const prevURL = `/sector/${routedSectorName}/story/${routedStoryID}/page/${routedPageIndex == 0 ? 0 : routedPageIndex-1}`;
    const nextURL = `/sector/${routedSectorName}/story/${routedStoryID}/page/${routedPageIndex == terriaStories.length-1 ? terriaStories.length-1 : routedPageIndex+1}`;

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
        <Swipeable
          onSwipedLeft={() => history.push(nextURL)}
          onSwipedRight={() => history.push(prevURL)}
        >

          {selectedPage? (<div className={Styles.titleGroup}>
            <div className={Styles.logoOuter}>
              <div className={Styles.logo}>
                <div className={Styles.logoInner}>
                  <Branding viewState={this.props.viewState} />
                </div>
              </div>
            </div>

            <div className={Styles.tabsContainer}>
              <div className={`flex ${Styles.iconTitle}`}>
                {selectedPage.sector && (<Icon
                    width={20}
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
                  <button className="buttonClose" title={t("story.exitBtn")}>
                    <Icon width={20} glyph={Icon.GLYPHS.close} />
                  </button>
                </Link>

              </div>

              {/* Section/page buttons for story panel*/}
              <div className="flex flex-wrap mb-1">

              {terriaStories.map((storyPage, pageIndex) => (
                <div key={pageIndex}> {/* This outer div is needed for the <Link> block to work within the terriaStories.map() */}
                  <Link to={`/sector/${routedSectorName}/story/${routedStoryID}/page/${pageIndex}`}>
                  <div className={`btn btn-xs ${Styles.sectionBtnBorder}`}>
                    <div className={`btn btn-xs ${Styles.sectionBtn}
                                     ${Styles[storyPage.section]}${storyPage == selectedPage ? "-selected" : ""}
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
                  </div>
                  </Link>
                </div>
              ))}
              </div>
            </div>
          </div>) : (<Loader/>)}
        </Swipeable>
      </React.Fragment>
    );
  }
});

export default withTranslation()(withRouter(NavigationTopBar));
