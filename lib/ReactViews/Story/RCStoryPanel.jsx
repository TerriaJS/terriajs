import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { Link, withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import { setSelectedStory } from "../../Models/Receipt";
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
      this.props.viewState.currentScenario = e.detail.scenarioID;
      this.setState({ state: this.state });
    };

    window.document.addEventListener(
      "changeScenario",
      this.changeScenarioListener,
      false
    );
  },

  componentDidUpdate() {
    const stories = this.props.terria.stories;
    const selectedPage = stories[Number(this.props.match.params.pageIndex)];
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
    this.slideOutTimer = setTimeout(() => {
      this.setState({
        inView: false
      });    
    }, 300);
  },

  onClickContainer() {
    this.props.viewState.topElement = "StoryPanel";
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    setSelectedStory(this.props.match.params, this.props.viewState);
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
    const selectedSector = this.props.match.params.sectorName;
    const selectedStory = this.props.match.params.storyID;
    const selectedPageIndex = Number(this.props.match.params.pageIndex);

    const { t, history } = this.props;
    const stories = this.props.terria.stories || [];
    
    const selectedPage = stories[selectedPageIndex];
    console.log("RCStoryPanel story: ", stories, selectedPageIndex, selectedPage);

    const scenario = this.props.viewState.currentScenario || 0;

    // find the first page with the section
    function findFirstPageURLOfSection(section = "") {
      const pageIndex = stories.findIndex(page => page.section === section);
      return `/sector/${selectedSector}/story/${selectedStory}/page/${pageIndex}`;
    }

    const prevURL = `/sector/${selectedSector}/story/${selectedStory}/page/${selectedPageIndex == 0 ? 0 : selectedPageIndex-1}`; 
    const nextURL = `/sector/${selectedSector}/story/${selectedStory}/page/${selectedPageIndex == this.props.terria.stories.length-1 ? this.props.terria.stories.length-1 : selectedPageIndex+1}`;

    return (
      <React.Fragment>
        <Swipeable
          onSwipedLeft={() => history.push(nextURL)}
          onSwipedRight={() => history.push(prevURL)}
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
                <Link to={findFirstPageURLOfSection("SCOPE")}>
                  <div className={`btn btn-xs rounded-none border-0 text-black bg-red-100    ${selectedPage.section ===
                      "SCOPE" && "bg-red-400"}          hover:bg-red-400`}
                  >
                    Scope
                  </div>
                </Link>
                <Link to={findFirstPageURLOfSection("HOTSPOTS")}>
                  <div className={`btn btn-xs rounded-none border-0 text-black bg-blue-100   ${selectedPage.section ===
                      "HOTSPOTS" && "bg-blue-400"}           hover:bg-blue-400`}
                  >
                    Hotspots
                  </div>
                </Link>
                <Link to={findFirstPageURLOfSection("CONNECTION")}>
                  <div className={`btn btn-xs rounded-none border-0 text-black bg-purple-100 ${selectedPage.section ===
                      "CONNECTION" && "bg-purple-400"}      hover:bg-purple-400`}
                  >
                    Connection
                  </div>
                </Link>
                <Link to={findFirstPageURLOfSection("EU_IMPACT")}>
                  <div className={`btn btn-xs rounded-none border-0 text-black bg-green-100  ${selectedPage.section ===
                      "EU_IMPACT" && "bg-green-400"}        hover:bg-green-400`}
                  >
                    EU impact
                  </div>
                </Link>
                <Link to={findFirstPageURLOfSection("CLIMATE_SCENARIOS")}>
                  <div className={`btn btn-xs rounded-none border-0 text-black bg-orange-100 ${selectedPage.section ===
                      "CLIMATE_SCENARIOS" &&
                      "bg-orange-400"}  hover:bg-orange-400`}
                  >
                    Climate scenarios
                  </div>
                </Link>
                <Link to={findFirstPageURLOfSection("SOC_ECON_SCENARIOS")}>
                <div className={`btn btn-xs rounded-none border-0 text-black bg-amber-100  ${selectedPage.section ===
                    "SOC_ECON_SCENARIOS" &&
                    "bg-amber-400"}           hover:bg-amber-400`}
                >
                  Socio-economic scenarios
                </div>
                </Link>
                <Link to={findFirstPageURLOfSection("COMPARISON")}>
                <div className={`btn btn-xs rounded-none border-0 text-black bg-lime-100   ${selectedPage.section ===
                    "COMPARISON" && "bg-lime-400"}        hover:bg-lime-400`}
                >
                  Comparison
                </div>
                </Link>
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
                        <Link to={`/sector/${selectedSector}/story/${selectedStory}/page/${pageIndex}`}>
                          <button
                            title={t("story.navBtn", { title: selectedPage.pageTitle })}
                            type="button"
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
                        </Link>
                      </Tooltip>
                    ))}
                  </div>
                </If>
                <Medium>                
                  <Link to={nextURL}>
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
