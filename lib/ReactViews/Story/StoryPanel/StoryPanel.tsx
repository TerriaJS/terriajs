import classNames from "classnames";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { Swipeable } from "react-swipeable";
import { useTheme } from "styled-components";
import {
  Category,
  StoryAction
} from "../../../Core/AnalyticEvents/analyticEvents";
import TerriaError from "../../../Core/TerriaError";
import { animateEnd } from "../../../Core/animation";
import getPath from "../../../Core/getPath";
import Terria from "../../../Models/Terria";
import Box from "../../../Styled/Box";
import Hr from "../../../Styled/Hr";
import { useViewState } from "../../Context";
import { onStoryButtonClick } from "../../Map/MenuBar/StoryButton/StoryButton";
import { Story } from "../Story";
import Styles from "../story-panel.scss";
import StoryBody from "./StoryBody";
import FooterBar from "./StoryFooterBar";
import TitleBar from "./TitleBar";

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

  terria.workbench.items.forEach((item) => {
    terria.analytics?.logEvent(
      Category.story,
      StoryAction.datasetView,
      getPath(item)
    );
  });
}

export default observer(function StoryPanel() {
  const viewState = useViewState();
  const theme = useTheme();
  const slideRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inView, setInView] = useState(false);

  const slideIn = setInView.bind(null, true);
  const slideOut = setInView.bind(null, false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    const stories = viewState.terria.stories || [];
    if (
      viewState.currentStoryId > stories.length - 1 ||
      viewState.currentStoryId < 0
    ) {
      viewState.currentStoryId = 0;
    }
    activateStory(stories[viewState.currentStoryId]);

    slideIn();

    const keydownListener = (e: Event) => {
      // Use else if for keydown events so only first one is recognised in case of multiple key presses
      if ((e as KeyboardEvent).key === "Escape") {
        exitStory();
      } else if (
        (e as KeyboardEvent).key === "ArrowRight" ||
        (e as KeyboardEvent).key === "ArrowDown"
      ) {
        viewState.currentStoryId + 1 != stories.length && goToNextStory();
      } else if (
        (e as KeyboardEvent).key === "ArrowLeft" ||
        (e as KeyboardEvent).key === "ArrowUp"
      ) {
        viewState.currentStoryId != 0 && goToPrevStory();
      }
    };
    window.addEventListener("keydown", keydownListener, true);
    return () => window.removeEventListener("keydown", keydownListener, true);
  }, []);

  function onClickContainer() {
    runInAction(() => {
      viewState.topElement = "StoryPanel";
    });
  }

  function navigateStory(index: number) {
    if (index < 0) {
      index = viewState.terria.stories.length - 1;
    } else if (index >= viewState.terria.stories.length) {
      index = 0;
    }
    if (index !== viewState.currentStoryId) {
      runInAction(() => {
        viewState.currentStoryId = index;
      });
      if (index < (viewState.terria.stories || []).length) {
        activateStory(viewState.terria.stories[index]);
      }
    }
  }

  // This is in StoryPanel and StoryBuilder
  function activateStory(_story: Story | any) {
    const story = _story ? _story : viewState.terria.stories[0];
    activateStory(story);
  }

  function onCenterScene(story: Story) {
    activateStory(story);
  }

  function goToPrevStory() {
    navigateStory(viewState.currentStoryId - 1);
  }

  function goToNextStory() {
    navigateStory(viewState.currentStoryId + 1);
  }

  function exitStory() {
    animateEnd(slideRef.current as Element | null).finally(() => {
      runInAction(() => {
        viewState.storyShown = false;
      });
      viewState.terria.currentViewer.notifyRepaintRequired();
    });
    slideOut();
  }

  const stories = viewState.terria.stories || [];
  const story = stories[viewState.currentStoryId];

  return (
    <Swipeable onSwipedLeft={goToNextStory} onSwipedRight={goToPrevStory}>
      <Box
        className={classNames(
          viewState.topElement === "StoryPanel" ? "top-element" : ""
        )}
        centered
        fullWidth
        paddedHorizontally={4}
        position="absolute"
        onClick={onClickContainer}
        css={`
          transition: padding, 0.2s;
          bottom: 80px;
          pointer-events: none;
          ${!viewState.storyShown && "display: none;"}
          @media (min-width: 992px) {
            ${viewState.isMapFullScreen &&
            `
                transition-delay: 0.5s;
              `}
            ${!viewState.isMapFullScreen &&
            `
                padding-left: calc(30px + ${theme.workbenchWidth}px);
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
            [Styles.isMounted]: inView
          })}
          key={story.id}
          ref={slideRef}
          css={`
            @media (min-width: 992px) {
              max-width: 60vw;
            }
          `}
        >
          <Box paddedHorizontally={3} paddedVertically={2.4} column>
            <TitleBar
              title={story.title}
              isCollapsed={isCollapsed}
              collapseHandler={toggleCollapse}
              closeHandler={exitStory}
            />
            <StoryBody isCollapsed={isCollapsed} story={story} />
          </Box>
          <Hr fullWidth size={1} borderBottomColor={theme.greyLighter}></Hr>
          <Box paddedHorizontally={3} fullWidth>
            <FooterBar
              goPrev={goToPrevStory}
              goNext={goToNextStory}
              jumpToStory={navigateStory}
              zoomTo={() => onCenterScene(story)}
              currentHumanIndex={viewState.currentStoryId + 1}
              totalStories={stories.length}
              listStories={action(() => {
                viewState.storyShown = false;
                onStoryButtonClick(viewState, 250)();
              })}
            />
          </Box>
        </Box>
      </Box>
    </Swipeable>
  );
});
