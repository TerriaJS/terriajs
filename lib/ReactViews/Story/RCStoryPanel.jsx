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
import Loader from "../Loader"

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
    const promise = setSelectedStory(
      this.props.match.params,
      this.props.viewState
    );
    promise.then(() => activateStory(this.props.viewState, true, true));
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
      const pageIndex = terriaStories.findIndex(
        page => page.section === section
      );
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


    const prevURL = `/sector/${routedSectorName}/story/${routedStoryID}/page/${
      routedPageIndex == 0 ? 0 : routedPageIndex - 1
    }`;
    const nextURL = `/sector/${routedSectorName}/story/${routedStoryID}/page/${
      routedPageIndex == terriaStories.length - 1
        ? terriaStories.length - 1
        : routedPageIndex + 1
    }`;

    return (
      <React.Fragment>
        <Swipeable style={{height: 100+'%'}}
          onSwipedLeft={() => history.push(nextURL)}
          onSwipedRight={() => history.push(prevURL)}
        >
          {selectedPage? (<div className={Styles.RCHotspotSummary}>
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
            <div className={Styles.pageNavigation}>
              <div className={Styles.prevBtn}>
                <Link to={prevURL}>
                  <button>
                    Previous
                  </button>
                </Link>
              </div>
              <span className={Styles.pageNum}>
                {routedPageIndex+1} / {terriaStories.length}
              </span>
              <div className={Styles.nextBtn}>
                <Link to={nextURL}>
                  <button>
                    Next
                  </button>
                </Link>
              </div>
            </div>


          </div>) : (<Loader/>)}
        </Swipeable>
      </React.Fragment>
    );
  }
});

export default withTranslation()(withRouter(RCStoryPanel));
