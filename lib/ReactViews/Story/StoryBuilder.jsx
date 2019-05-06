import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import combine from 'terriajs-cesium/Source/Core/combine';
import {getShareData } from '../Map/Panels/SharePanel/BuildShareLink';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import Icon from "../Icon.jsx";
import Story from './Story.jsx';
import StoryEditor from './StoryEditor.jsx';
import Sortable from 'react-anything-sortable';
import createGuid from 'terriajs-cesium/Source/Core/createGuid';
import classNames from 'classnames';
import BadgeBar from '../BadgeBar.jsx';
import Styles from './story-builder.scss';

const StoryBuilder = createReactClass({
    displayName: 'StoryBuilder',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired,
        isVisible: PropTypes.bool,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            editingMode: false,
            currentStory: undefined
        };
    },

    removeStory(index, story) {
      this.props.terria.stories = this.props.terria.stories.filter(st => st.id !== story.id);
      if(index < this.props.viewState.currentStoryId) {
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
        id: _story.id ? _story.id : createGuid(),
      };

      const storyIndex = (this.props.terria.stories || []).map(story => story.id).indexOf(_story.id);
    
      if(storyIndex >= 0) {
        const oldStory = this.props.terria.stories[storyIndex];
        // replace the old story, we need to replace the stories array so that
        // it is observable
        this.props.terria.stories = [...this.props.terria.stories.slice(0, storyIndex), combine(story, oldStory), ...this.props.terria.stories.slice(storyIndex + 1)];
      } else {
        this.captureStory(story);
      }

      this.setState({
          editingMode: false
      });
  },

    captureStory(story) {
        story.shareData = JSON.parse(JSON.stringify(getShareData(this.props.terria, false)));
         if (this.props.terria.stories === undefined) {
          this.props.terria.stories = [story];
        } else {
            this.props.terria.stories.push(story);
          }
      },

    reCaptureScene(story) {
        const storyIndex = (this.props.terria.stories || []).map(story => story.id).indexOf(story.id);
        if(storyIndex >= 0) {
          story.shareData = JSON.parse(JSON.stringify(getShareData(this.props.terria, false)));
          this.props.terria.stories = [...this.props.terria.stories.slice(0, storyIndex), story, ...this.props.terria.stories.slice(storyIndex + 1)];
        } else {
          throw new Error('Story does not exsit');
        } 
    },

    runStories() {
        this.props.viewState.storyBuilderShown = false;
        this.props.viewState.storyShown = true;
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
    
     renderIntro() {
      return (<div className={Styles.intro}><Icon glyph={Icon.GLYPHS.story}/> <strong>This is your story editor</strong><div className={Styles.instructions}>
       <p>1. Capture scenes from your map</p><p>2. Add text and images</p><p>3. Share with others</p></div></div>);
    },

  openMenu(story) {
    this.setState({
      storyWithOpenMenu: story
    });
  },

  renderStories(editingMode) {
    const stories = this.props.terria.stories || [];
    const className = classNames({
          [Styles.stories]: true,
          [Styles.isActive]: editingMode
      });
    return (<div className={className}>
                <BadgeBar label="Scenes" badge={this.props.terria.stories.length}>
                    <button type='button' onClick={this.removeAllStories} className={Styles.removeButton}>
                        Remove All <Icon glyph={Icon.GLYPHS.remove}/>
                    </button>
                </BadgeBar>

    <Sortable onSort={this.onSort} direction="vertical" dynamic={true}>
      <For each='story' index="index" of={stories}>
        <Story key={story.id} 
               story={story} 
               sortData={story} 
               deleteStory={this.removeStory.bind(this, index)} 
               recaptureStory={this.reCaptureScene} 
               viewStory={this.viewStory.bind(this, index)} 
               menuOpen ={this.state.storyWithOpenMenu === story}
               openMenu = {this.openMenu}
               editStory={this.editStory}/>
      </For>
      </Sortable>
    </div>); 
  },

    onClickCapture() {
      this.setState({
        editingMode: true,
        currentStory: undefined
      });
    },

    render() {
        const hasStories = defined(this.props.terria.stories) && this.props.terria.stories.length > 0;
        const className = classNames({
            [Styles.storyPanel]: true,
            [Styles.isVisible]: this.props.isVisible,
            [Styles.isHidden]: !this.props.isVisible
        });
        return (
            <div className={className}>
                <div className={Styles.header}>
                  {!hasStories && this.renderIntro()}
                  <div className={Styles.actions}>
                   {hasStories && <button disabled ={this.state.editingMode || !hasStories} className={Styles.previewBtn} onClick={this.runStories} title="preview stories"><Icon glyph={Icon.GLYPHS.play}/>Play Story</button>}
                   <button disabled={this.state.editingMode} className={Styles.captureBtn} title='capture current scene' onClick={this.onClickCapture}> <Icon glyph={Icon.GLYPHS.story}/> Capture Scene </button>
                  </div>
                </div>
               {hasStories &&  this.renderStories(this.state.editingMode)}
               {this.state.editingMode && <StoryEditor removeStory={this.removeStory} exitEditingMode={()=>this.setState({editingMode: false})} story={this.state.currentStory} saveStory ={this.onSave}/>}
            </div>
        );
    }
});

export default StoryBuilder;
