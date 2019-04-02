import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {getShareData } from './Map/Panels/SharePanel/BuildShareLink';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from './ObserveModelMixin';
import Icon from "./Icon.jsx";
import Story from './Story.jsx';
import StoryEditor from './StoryEditor.jsx';
import uniqid from 'uniqid';
import { activateStory } from './StoryPanel.jsx';

import Styles from './story-builder.scss';

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};

const StoryBuilder = createReactClass({
    displayName: 'StoryBuilder',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired,
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
    onSave(_story) {
      const story = {
        title: _story.title,
        text: _story.text,
        id: _story.id ? _story.id : uniqid(),
      };

      !defined(_story.id) && this.captureStory(story);

      const storyIndex = (this.props.terria.stories || []).map(story => story.id).indexOf(_story.id);
    
      if(storyIndex >= 0) {
        // replace the old story
        this.props.terria.stories = [...this.props.terria.stories.slice(0, storyIndex), story, ...this.props.terria.stories.slice(storyIndex + 1)];
      } else {
        this.props.terria.stories = [...(this.props.terria.stories || []), story];
      }

      this.setState({
          editingMode: false
      });
  },

    captureStory(story) {
        story.shareData = JSON.parse(JSON.stringify(getShareData(this.props.terria, false)));
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
   
  moveUp(index, story) {
    const stories = this.props.terria.stories || [];
    this.props.terria.stories = array_move(stories, index, index-1);
  },

  moveDown(index, story) {
    const stories = this.props.terria.stories || [];
    this.props.terria.stories = array_move(stories, index, index+1);
  },
    
     renderIntro() {
      return (<div className={Styles.intro}><Icon glyph={Icon.GLYPHS.story}/> <strong>This is your story editor</strong><div className={Styles.instructions}>
       <p>1. Capture scenes from your map</p><p>2. Add text and images</p><p>3. Share with others</p></div></div>);
    },

    renderStories() {
      const stories = this.props.terria.stories || [];
      return <div className={Styles.stories}>{stories.map((story, i)=><Story key={story.id} story={story} moveDown={i < stories.length-1 ? this.moveDown.bind(this, i) : undefined} moveUp = {i > 0? this.moveUp.bind(this, i) : undefined} deleteStory={this.removeStory.bind(this, i)} recaptureStory={this.captureStory} viewStory={this.viewStory.bind(this, i)} editStory={this.editStory}/>)}</div>; 
      },

    onClickCapture() {
      this.setState({
        editingMode: true,
        currentStory: undefined
      });
    },

    render() {
        const hasStories = defined(this.props.terria.stories) && this.props.terria.stories.length > 0;
        return (
            <div className={Styles.storyPanel}>
                <div className={Styles.header}>
                  {!hasStories && this.renderIntro()}
                  <div className={Styles.actions}>
                   {hasStories && <button disabled ={this.state.editingMode || !hasStories} className={Styles.previewBtn} onClick={this.runStories} title="preview stories"><Icon glyph={Icon.GLYPHS.play}/>Play Story</button>}
                   <button disabled={this.state.editingMode} className={Styles.captureBtn} title='capture current scene' onClick={this.onClickCapture}> <Icon glyph={Icon.GLYPHS.story}/> Capture Scene </button>
                  </div>
                </div>
               {!this.state.editingMode && hasStories &&  this.renderStories()}
               {this.state.editingMode && <StoryEditor removeStory={this.removeStory} exitEditingMode={()=>this.setState({editingMode: false})} story={this.state.currentStory} saveStory ={this.onSave}/>}
            </div>
        );
    }
});

export default StoryBuilder;
