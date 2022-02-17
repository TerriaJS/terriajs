import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import {
  useTranslation,
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
// import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
// import { Medium, Small } from "../Generic/Responsive";
import Styles from "./story-panel.scss";
import Box from "../../Styled/Box";
import styled from "styled-components";

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

interface BtnProp {
  onClick: () => void;
}

const ExitBtn = ({ onClick }: BtnProp) => {
  const { t } = useTranslation();
  return (
    <button
      className={Styles.exitBtn}
      title={t("story.exitBtn")}
      onClick={onClick}
    >
      <Icon glyph={Icon.GLYPHS.close} />
    </button>
  );
};

const LocationBtn = ({ onClick }: BtnProp) => {
  const { t } = useTranslation();

  return (
    <button
      className={Styles.locationBtn}
      title={t("story.locationBtn")}
      onClick={onClick}
    >
      <Icon glyph={Icon.GLYPHS.location} />
    </button>
  );
};

const TitleContainer = styled.div`
  flex: 1;
`;

const ClampedTitle = styled.h3`
  /* clamp fallback */
  white-space: nowrap;
  text-overflow: ellipsis;

  overflow: hidden;
  padding: 0;
  margin: 10px;

  @supports (-webkit-line-clamp: 2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: unset;
  }
`;

const TitleBar = ({
  title,
  closeHandler
}: {
  title?: string;
  closeHandler: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box fullWidth>
      <TitleContainer>
        <ClampedTitle>{title ? title : t("story.untitled")}</ClampedTitle>
      </TitleContainer>
      <Box>
        <ExitBtn onClick={closeHandler} />
      </Box>
    </Box>
  );
};

interface Props extends WithTranslation {
  terria: Terria;
  viewState: ViewState;
}

interface State {
  inView: boolean;
}
@observer
class StoryPanel extends React.Component<Props, State> {
  escKeyListener: EventListener | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      inView: false
    };
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
    runInAction(() => {
      this.props.viewState.storyShown = false;
    });
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  render() {
    const { t } = this.props;
    const stories = this.props.terria.stories || [];
    const story = stories[this.props.viewState.currentStoryId];

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
            <TitleBar
              title={story.title}
              closeHandler={() => this.exitStory()}
            />
            {/*<Medium>
              <div className={Styles.left}>
                <LocationBtn onClick={this.onCenterScene.bind(this, story)} />
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
                <Small><LocationBtn onClick={this.onCenterScene.bind(this, story)} /></Small>
                {story.title && story.title.length > 0 ? (
                  <h3>{story.title}</h3>
                ) : (
                  <h3> {t("story.untitled")} </h3>
                )}
                <Small><ExitBtn onClick={() => this.slideOut()} /></Small>
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
                <ExitBtn onClick={() => this.slideOut()} />
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
            </Small> */}
          </div>
        </div>
      </Swipeable>
    );
  }
}

export default withTranslation()(StoryPanel);
