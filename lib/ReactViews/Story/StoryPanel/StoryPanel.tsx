import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { Swipeable } from "react-swipeable";
import {
  Category,
  StoryAction
} from "../../../Core/AnalyticEvents/analyticEvents";
import getPath from "../../../Core/getPath";
import TerriaError from "../../../Core/TerriaError";
import Terria from "../../../Models/Terria";
import { Story } from "../Story";
import ViewState from "../../../ReactViewModels/ViewState";
import Styles from "../story-panel.scss";
import { animateEnd } from "../../../Core/animation";
import TitleBar from "./TitleBar";
import FooterBar from "./StoryFooterBar";
import StoryBody from "./StoryBody";
import Box from "../../../Styled/Box";
import Hr from "../../../Styled/Hr";
import { DefaultTheme, withTheme } from "styled-components";
import { onStoryButtonClick } from "../../Map/StoryButton/StoryButton";
import { exit } from "../../Transitions/FadeIn/fade-in.scss";

/**
 *
 * @param {any} story
 * @param {Terria} terria
 */

export async function activateStory(scene: Story, terria: Terria) {
  terria.analytics?.logEvent(
    Category.story,
    StoryAction.viewScene,
    JSON.stringify(scene)
  );

  if (scene.shareData) {
    const errors: TerriaError[] = [];
    await Promise.all(
      scene.shareData.initSources.map(async (initSource: any) => {
        try {
          await terria.applyInitData({
            initData: initSource,
            replaceStratum: true,
            canUnsetFeaturePickingState: true
          });
        } catch (e) {
          errors.push(TerriaError.from(e));
        }
      })
    );
    if (errors.length > 0) {
      terria.raiseErrorToUser(
        TerriaError.combine(errors, {
          title: { key: "story.loadSceneErrorTitle" },
          message: {
            key: "story.loadSceneErrorMessage",
            parameters: { title: scene.title ?? scene.id }
          }
        })
      );
    }
  }

  terria.workbench.items.forEach(item => {
    terria.analytics?.logEvent(
      Category.story,
      StoryAction.datasetView,
      getPath(item)
    );
  });
}

interface Props extends WithTranslation {
  terria: Terria;
  viewState: ViewState;
  theme: DefaultTheme;
}

interface State {
  inView: boolean;
  isCollapsed: boolean;
}

@observer
class StoryPanel extends React.Component<Props, State> {
  escKeyListener: EventListener | undefined;
  slideRef: React.RefObject<HTMLElement>;

  constructor(props: Props) {
    super(props);
    this.state = {
      isCollapsed: false,
      inView: false
    };
    this.slideRef = React.createRef();
  }

  componentDidMount() {
    const stories = this.props.terria.stories || [];
    if (
      this.props.viewState.currentStoryId > stories.length - 1 ||
      this.props.viewState.currentStoryId < 0
    ) {
      this.props.viewState.currentStoryId = 0;
    }
    this.activateStory(stories[this.props.viewState.currentStoryId]);

    this.slideIn();

    this.escKeyListener = (e: Event) => {
      if ((e as KeyboardEvent).key === "Escape") {
        this.exitStory();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
  }

  slideIn() {
    this.setState({
      inView: true
    });
  }

  slideOut() {
    this.setState({
      inView: false
    });
  }

  toggleCollapse() {
    this.setState({
      isCollapsed: !this.state.isCollapsed
    });
  }

  onClickContainer() {
    runInAction(() => {
      this.props.viewState.topElement = "StoryPanel";
    });
  }

  componentWillUnmount() {
    if (this.escKeyListener) {
      window.removeEventListener("keydown", this.escKeyListener, false);
    }
  }

  navigateStory(index: number) {
    if (index < 0) {
      index = this.props.terria.stories.length - 1;
    } else if (index >= this.props.terria.stories.length) {
      index = 0;
    }
    if (index !== this.props.viewState.currentStoryId) {
      runInAction(() => {
        this.props.viewState.currentStoryId = index;
      });
      if (index < (this.props.terria.stories || []).length) {
        this.activateStory(this.props.terria.stories[index]);
      }
    }
  }

  // This is in StoryPanel and StoryBuilder
  activateStory(_story: Story | any) {
    const story = _story ? _story : this.props.terria.stories[0];
    activateStory(story, this.props.terria);
  }

  onCenterScene(story: Story) {
    activateStory(story, this.props.terria);
  }

  goToPrevStory() {
    this.navigateStory(this.props.viewState.currentStoryId - 1);
  }

  goToNextStory() {
    this.navigateStory(this.props.viewState.currentStoryId + 1);
  }

  exitStory() {
    animateEnd(this.slideRef.current).finally(() => {
      runInAction(() => {
        this.props.viewState.storyShown = false;
      });
      this.props.terria.currentViewer.notifyRepaintRequired();
    });
    this.slideOut();
  }

  render() {
    const stories = this.props.terria.stories || [];
    const story = stories[this.props.viewState.currentStoryId];

    return (
      <Swipeable
        onSwipedLeft={() => this.goToNextStory()}
        onSwipedRight={() => this.goToPrevStory()}
      >
        <Box
          className={classNames(
            this.props.viewState.topElement === "StoryPanel"
              ? "top-element"
              : ""
          )}
          centered
          fullWidth
          paddedHorizontally={4}
          position="absolute"
          onClick={() => this.onClickContainer()}
          css={`
            transition: padding, 0.2s;
            bottom: 80px;
            pointer-events: none;
            ${!this.props.viewState.storyShown && "display: none;"}
            @media (min-width: 992px) {
              ${this.props.viewState.isMapFullScreen &&
                `
                transition-delay: 0.5s;
              `}
              ${!this.props.viewState.isMapFullScreen &&
                `
                padding-left: calc(30px + ${this.props.theme.workbenchWidth}px);
                padding-right: 50px;
              `}
              bottom: 90px;
            }
          `}
        >
          <Box
            column
            rounded
            className={classNames(Styles.storyContainer, {
              [Styles.isMounted]: this.state.inView
            })}
            key={story.id}
            ref={this.slideRef as React.RefObject<HTMLDivElement>}
            css={`
              @media (min-width: 992px) {
                max-width: 60vw;
              }
            `}
          >
            <Box paddedHorizontally={3} paddedVertically={2.4} column>
              <TitleBar
                title={story.title}
                isCollapsed={this.state.isCollapsed}
                collapseHandler={() => this.toggleCollapse()}
                closeHandler={() => this.exitStory()}
              />
              <StoryBody isCollapsed={this.state.isCollapsed} story={story} />
            </Box>
            <Hr
              fullWidth
              size={1}
              borderBottomColor={this.props.theme.greyLighter}
            ></Hr>
            <Box paddedHorizontally={3} fullWidth>
              <FooterBar
                goPrev={() => this.goToPrevStory()}
                goNext={() => this.goToNextStory()}
                jumpToStory={(index: number) => this.navigateStory(index)}
                zoomTo={() => this.onCenterScene(story)}
                currentHumanIndex={this.props.viewState.currentStoryId + 1}
                totalStories={stories.length}
                listStories={() => {
                  runInAction(() => {
                    this.props.viewState.storyShown = false;
                  });
                  onStoryButtonClick({
                    terria: this.props.terria,
                    theme: this.props.theme,
                    viewState: this.props.viewState,
                    animationDuration: 250
                  })();
                }}
              />
            </Box>
          </Box>
        </Box>
      </Swipeable>
    );
  }
}

export default withTranslation()(withTheme(StoryPanel));
