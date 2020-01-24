import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import combine from "terriajs-cesium/Source/Core/combine";
import { getShareData } from "../Map/Panels/SharePanel/BuildShareLink";
import defined from "terriajs-cesium/Source/Core/defined";
import ObserveModelMixin from "../ObserveModelMixin";
import Icon from "../Icon.jsx";
import Story from "./Story.jsx";
import StoryEditor from "./StoryEditor.jsx";
import Sortable from "react-anything-sortable";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import classNames from "classnames";
import BadgeBar from "../BadgeBar.jsx";
import triggerResize from "../../Core/triggerResize";
import Loader from "../Loader";
import Styles from "./story-builder.scss";
import { withTranslation, Trans } from "react-i18next";

const StoryBuilder = createReactClass({
  displayName: "StoryBuilder",
  mixins: [ObserveModelMixin],
  propTypes: {
    terria: PropTypes.object.isRequired,
    isVisible: PropTypes.bool,
    viewState: PropTypes.object.isRequired,
    animationDuration: PropTypes.number,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      editingMode: false,
      currentStory: undefined,
      recaptureSuccessful: undefined,
      showVideoGuide: false, // for whether to actually render `renderVideoGuide()`
      videoGuideVisible: false // for animating
    };
  },

  removeStory(index, story) {
    this.props.terria.stories = this.props.terria.stories.filter(
      st => st.id !== story.id
    );
    if (index < this.props.viewState.currentStoryId) {
      this.props.viewState.currentStoryId -= 1;
    }
  },

  removeAllStories() {
    this.props.terria.stories = [];
  },
  onSave(_story) {
    const story = {
      title: _story.title,
      text: _story.text,
      id: _story.id ? _story.id : createGuid()
    };

    const storyIndex = (this.props.terria.stories || [])
      .map(story => story.id)
      .indexOf(_story.id);

    if (storyIndex >= 0) {
      const oldStory = this.props.terria.stories[storyIndex];
      // replace the old story, we need to replace the stories array so that
      // it is observable
      this.props.terria.stories = [
        ...this.props.terria.stories.slice(0, storyIndex),
        combine(story, oldStory),
        ...this.props.terria.stories.slice(storyIndex + 1)
      ];
    } else {
      this.captureStory(story);
    }

    this.setState({
      editingMode: false
    });
  },

  captureStory(story) {
    story.shareData = JSON.parse(
      JSON.stringify(
        getShareData(this.props.terria, this.props.viewState, {
          includeStories: false
        })
      )
    );
    if (this.props.terria.stories === undefined) {
      this.props.terria.stories = [story];
    } else {
      this.props.terria.stories.push(story);
    }
  },

  toggleVideoGuide() {
    const showVideoGuide = this.state.showVideoGuide;
    // If not enabled
    if (!showVideoGuide) {
      this.setState({
        showVideoGuide: !showVideoGuide,
        videoGuideVisible: true
      });
    }
    // Otherwise we immediately trigger exit animations, then close it 300ms later
    if (showVideoGuide) {
      this.slideOutTimer = this.setState({
        videoGuideVisible: false
      });
      setTimeout(() => {
        this.setState({
          showVideoGuide: !showVideoGuide
        });
      }, 300);
    }
  },

  recaptureScene(story) {
    const { t } = this.props;
    clearTimeout(this.resetReCaptureStatus);
    const storyIndex = (this.props.terria.stories || [])
      .map(story => story.id)
      .indexOf(story.id);
    if (storyIndex >= 0) {
      story.shareData = JSON.parse(
        JSON.stringify(
          getShareData(this.props.terria, this.props.viewState, {
            includeStories: false
          })
        )
      );
      this.props.terria.stories = [
        ...this.props.terria.stories.slice(0, storyIndex),
        story,
        ...this.props.terria.stories.slice(storyIndex + 1)
      ];
      this.setState({
        recaptureSuccessful: story.id
      });

      setTimeout(this.resetReCaptureStatus, 2000);
    } else {
      throw new Error(t("story.doesNotExist"));
    }
  },

  resetReCaptureStatus() {
    this.setState({
      recaptureSuccessful: undefined
    });
  },

  runStories() {
    this.props.viewState.storyBuilderShown = false;
    this.props.viewState.storyShown = true;
    setTimeout(function() {
      triggerResize();
    }, this.props.animationDuration || 1);
    this.props.terria.currentViewer.notifyRepaintRequired();
  },

  editStory(story) {
    this.props.viewState.storyBuilderShow = true;
    this.props.viewState.storyShown = false;
    this.setState({
      editingMode: true,
      currentStory: story
    });
  },

  viewStory(index, story) {
    this.props.viewState.currentStoryId = index;
    this.runStories();
  },

  onSort(sortedArray, currentDraggingSortData, currentDraggingIndex) {
    this.props.terria.stories = sortedArray;
  },

  componentWillUnmount() {
    clearTimeout(this.resetReCaptureStatus);
  },

  renderIntro() {
    return (
      <div className={Styles.intro}>
        <Icon glyph={Icon.GLYPHS.story} />{" "}
        <Trans i18nKey="story.message">
          <strong>This is your story editor</strong>
          <div className={Styles.instructions}>
            Create and share interactive stories directly from your map
            <div>
              <button onClick={this.toggleVideoGuide} className={Styles.tutBtn}>
                <Icon glyph={Icon.GLYPHS.play} />
                Getting Started{" "}
              </button>
            </div>
          </div>
        </Trans>
      </div>
    );
  },

  renderVideoGuide() {
    return (
      <div
        className={classNames({
          [Styles.videoGuideWrapper]: true,
          [Styles.videoGuideWrapperClosing]: !this.state.videoGuideVisible
        })}
        onClick={this.toggleVideoGuide}
      >
        <div
          className={Styles.videoGuide}
          onClick={e => e.stopPropagation()}
          style={{
            backgroundImage: `url(${require("../../../wwwroot/images/data-stories-getting-started.jpg")})`
          }}
        >
          <div className={Styles.videoGuideRatio}>
            <div className={Styles.videoGuideLoading}>
              <Loader message={` `} />
            </div>
            <iframe
              className={Styles.videoGuideIframe}
              src="https://www.youtube.com/embed/fbiQawV8IYY"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      </div>
    );
  },

  openMenu(story) {
    this.setState({
      storyWithOpenMenu: story
    });
  },

  renderStories(editingMode) {
    const { t } = this.props;
    const stories = this.props.terria.stories || [];
    const className = classNames({
      [Styles.stories]: true,
      [Styles.isActive]: editingMode
    });
    return (
      <div className={className}>
        <BadgeBar label="Scenes" badge={this.props.terria.stories.length}>
          <button
            type="button"
            onClick={this.removeAllStories}
            className={Styles.removeButton}
          >
            {t("story.removeAllStories")} <Icon glyph={Icon.GLYPHS.remove} />
          </button>
        </BadgeBar>

        <Sortable onSort={this.onSort} direction="vertical" dynamic={true}>
          <For each="story" index="index" of={stories}>
            <Story
              key={story.id}
              story={story}
              sortData={story}
              deleteStory={this.removeStory.bind(this, index)}
              recaptureStory={this.recaptureScene}
              recaptureStorySuccessful={Boolean(
                story.id === this.state.recaptureSuccessful
              )}
              viewStory={this.viewStory.bind(this, index)}
              menuOpen={this.state.storyWithOpenMenu === story}
              openMenu={this.openMenu}
              editStory={this.editStory}
            />
          </For>
        </Sortable>
      </div>
    );
  },

  onClickCapture() {
    this.setState({
      editingMode: true,
      currentStory: undefined
    });
  },

  render() {
    const { t } = this.props;
    const hasStories =
      defined(this.props.terria.stories) &&
      this.props.terria.stories.length > 0;
    const className = classNames({
      [Styles.storyPanel]: true,
      [Styles.isVisible]: this.props.isVisible,
      [Styles.isHidden]: !this.props.isVisible
    });
    return (
      <div className={className}>
        {this.state.showVideoGuide && this.renderVideoGuide()}
        <div className={Styles.header}>
          {!hasStories && this.renderIntro()}
          <div className={Styles.actions}>
            {hasStories && (
              <button
                disabled={this.state.editingMode || !hasStories}
                className={Styles.previewBtn}
                onClick={this.runStories}
                title={t("story.preview")}
              >
                <Icon glyph={Icon.GLYPHS.play} />
                {t("story.play")}
              </button>
            )}
            <button
              disabled={this.state.editingMode}
              className={Styles.captureBtn}
              title={t("story.captureSceneTitle")}
              onClick={this.onClickCapture}
            >
              {" "}
              <Icon glyph={Icon.GLYPHS.story} /> {t("story.captureScene")}{" "}
            </button>
          </div>
        </div>
        {hasStories && this.renderStories(this.state.editingMode)}
        {this.state.editingMode && (
          <StoryEditor
            removeStory={this.removeStory}
            exitEditingMode={() => this.setState({ editingMode: false })}
            story={this.state.currentStory}
            saveStory={this.onSave}
          />
        )}
      </div>
    );
  }
});

export default withTranslation()(StoryBuilder);
