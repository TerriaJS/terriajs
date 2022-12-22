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
import Loader from "../Loader"

const NavigationBottomBar = createReactClass({
  displayName: "NavigationBottomBar",
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

    return (
      <React.Fragment>
        <Swipeable
          onSwipedLeft={() => history.push(nextURL)}
          onSwipedRight={() => history.push(prevURL)}
        >

          {/* {selectedPage? (<div className={Styles.RCHotspotSummary}> */}
            {/* Footer */}
            {selectedPage? <div className={Styles.storyBottomNavigationItems}>
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
                <h3>{routedPageIndex+1} / {terriaStories.length}</h3>
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
            </div> : (<Loader/>)}
        </Swipeable>
      </React.Fragment>
    );
  }
});

export default withTranslation()(withRouter(NavigationBottomBar));
