import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import {
  TranslationProps,
  WithTranslation,
  withTranslation
} from "react-i18next";
import { Swipeable } from "react-swipeable";
import {
  Category,
  StoryAction
} from "../../Core/AnalyticEvents/analyticEvents";
import getPath from "../../Core/getPath";
import TerriaError from "../../Core/TerriaError";
import Terria from "../../Models/Terria";
import { Story } from "./Story";
import ViewState from "../../ReactViewModels/ViewState";
import Icon from "../../Styled/Icon";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { Medium, Small } from "../Generic/Responsive";
import Styles from "./story-panel.scss";

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
}

interface State {
  inView: boolean;
}
@observer
class StoryPanel extends React.Component<Props, State> {
  slideInTimer: ReturnType<typeof setTimeout> | undefined;
  slideOutTimer: ReturnType<typeof setTimeout> | undefined;
  escKeyListener: EventListener | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      inView: false
    };
  }

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
  }
  componentDidMount() {
    this.slideIn();

    this.escKeyListener = (e: Event) => {
      if ((e as KeyboardEvent).keyCode === 27) {
        this.exitStory();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
  }

  slideIn() {
    this.slideInTimer = setTimeout(() => {
      this.setState({
        inView: true
      });
    }, 300);
  }

  slideOut() {
    this.setState({
      inView: false
    });
    setTimeout(() => {
      this.exitStory();
    }, 300);
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
    if (this.slideOutTimer) {
      clearTimeout(this.slideOutTimer);
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
    runInAction(() => {
      this.props.viewState.storyShown = false;
    });
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

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
        onClick={() => this.slideOut()}
      >
        <Icon glyph={Icon.GLYPHS.close} />
      </button>
    );
    return (
      <Swipeable
        onSwipedLeft={() => this.goToNextStory()}
        onSwipedRight={() => this.goToPrevStory()}
      >
        <div
          className={classNames(
            Styles.fullPanel,
            {
              [Styles.isHidden]: !this.props.viewState.storyShown,
              [Styles.isCentered]: this.props.viewState.isMapFullScreen
            },
            this.props.viewState.topElement === "StoryPanel"
              ? "top-element"
              : ""
          )}
          onClick={() => this.onClickContainer()}
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
                  onClick={() => this.goToPrevStory()}
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
                {this.props.terria.stories.length >= 2 && (
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
                )}
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
                  onClick={() => this.goToNextStory()}
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
}

export default withTranslation()(StoryPanel);
