import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { buildShareLink, getShareData } from './Map/Panels/SharePanel/BuildShareLink';
import ObserveModelMixin from './ObserveModelMixin';
import Clipboard from './Clipboard.jsx';
import Icon from "./Icon.jsx";
import  FileSaver  from 'file-saver';
import URI from 'urijs';
import Story from './Story.jsx';
import Styles from './story-builder.scss';

// From MDN
function postData(url = '', data = {}) {
    // Default options are marked with *
      return fetch(url, {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, cors, *same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "omit", // include, *same-origin, omit
          headers: {
              "Content-Type": "application/json",
          },
          redirect: "follow", // manual, *follow, error
          referrer: "no-referrer", // no-referrer, *client
          body: JSON.stringify(data), // body data type must match "Content-Type" header
      })
      .then(response => response.json()); // parses response to JSON
  }

let idCounter = 100;

const USE_URL = false;

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
            newTitle: "",
            newText: "",
            uri: ""
        };
    },

    // This is in StoryPanel and StoryBuilder
    activateStory(story) {
        this.props.terria.nowViewing.removeAll();
        if (story.shareData) {
            this.props.terria.updateFromStartData(story.shareData);
        } else {
            window.location = story.shareUrl;
        }
    },
    
    shareStory(){

    },

    removeStory(story) {
        this.props.terria.stories = this.props.terria.stories.filter(st => st !== story);
    },

    onSubmit(evt) {
        const story = {};
        if (USE_URL) {
            story.shareUrl = new URI(buildShareLink(this.props.terria, false)).hash();
        } else {
            story.shareData = JSON.parse(JSON.stringify(getShareData(this.props.terria, false)));
        }
        this.props.terria.stories = [...(this.props.terria.stories || []), Object.assign(story, {
          id: (this.props.terria.stories ? this.props.terria.stories.length : 0) + idCounter++,
            title: this.state.newTitle,
            text: this.state.newText
        })];
        this.setState({
            newTitle: "",
            newText: "",
            editingMode: false
        });
        evt.preventDefault();

    },

    updateTitle(evt) {
        this.setState({newTitle: evt.target.value});
    },
    updateText(evt) {
        this.setState({newText: evt.target.value});
    },

    downloadShareFile() {
        const blob = new Blob([JSON.stringify({ stories: this.props.terria.stories })], { type: "application/json;charset=utf-8" });
        FileSaver.saveAs(blob, 'share.json');
    },

    saveToMyJson() {
        const {uri} = postData("https://api.myjson.com/bins", { stories: this.props.terria.stories });
        this.setState({
            uri
        });
    },

    runStory() {
        // this.props.viewState.storyProgress = 0;
        // this.props.viewState.showStory = true;
        // window.open(`#stories=${encodeURIComponent(this.state.uri)}`);
        this.props.viewState.storyBuilderShown = false;
        this.props.viewState.storyShown = true;
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    renderEditor() {
       return (<div className={Styles.editor}>
         <div className={Styles.editorHeader}>
         {(this.state.newTitle && this.state.newTitle.length > 0) ? this.state.newTitle : "Untitled Scene"}
         </div>
           <form className={Styles.form} onSubmit={this.onSubmit}>
              <label className={Styles.label} htmlFor="title">Title:</label>
              <input placeholder="Enter a title here" className={Styles.field} type="text" id="title" value={this.state.newTitle} onChange={this.updateTitle}/>
              <label className={Styles.label} htmlFor="text">Text:</label>
              <input placeholder="Click to add text" className={Styles.field} type="text" id="text" value={this.state.newText} onChange={this.updateText}/>
              <div className={Styles.editorFooter}>
                <button className={Styles.trashBtn} type='button' title='delete scene' onClick={()=>{this.setState({editingMode: false})}}><Icon glyph={Icon.GLYPHS.trashcan}/></button>
                <input disabled={this.state.newTitle.length ===0 && this.state.newText.length === 0} className={Styles.doneBtn} type="submit" value="Done"/>
              </div>
           </form>
        </div>);

    },
  
  renderIntro(){
    return (<div className={Styles.intro}><Icon glyph={Icon.GLYPHS.story}/> <strong>This is your story editor</strong><div className={Styles.instructions}>
     <p>1. Capture scenes from your map</p><p>2. Add text and images</p><p>3. Share with others</p></div></div>)
  },
  renderStories() {
    return <div className={Styles.stories}>{this.props.terria.stories.map(story=><Story key={story.id} story={story} removeStory={this.removeStory} runStory={this.runStory}/>)}</div> 
    },

  onClickCapture() {
    this.setState({
      editingMode: true
    });
  },

    render() {
        const hasStories = this.props.terria.stories && this.props.terria.stories.length;
        const shareUrlTextBox = <input type="text" value={ new URI(buildShareLink(this.props.terria, false)).hash()} readOnly id='share-story' />
        return (
            <div className={Styles.storyPanel}>
                <div className={Styles.header}>
                  <h3>{this.state.editingMode ? "Story Editor" : "StoryBook"}</h3>
                  <div className={Styles.actions}>
                    <button disabled ={this.state.editingMode || !hasStories} className={Styles.previewBtn} onClick={this.runStory} title="preview stories"><Icon glyph={Icon.GLYPHS.play}/>Preview</button>
                    <Clipboard disabled ={this.state.editingMode || !hasStories} source={ shareUrlTextBox} btnText='Share' id='share-story'><Icon glyph={Icon.GLYPHS.share}/></Clipboard>
                   </div>
                </div>
               {!hasStories && !this.state.editingMode && this.renderIntro()}
               {!this.state.editingMode && hasStories &&  this.renderStories()}
               {this.state.editingMode && this.renderEditor()}
                <div className={Styles.footer}>
                  <button disabled={this.state.editingMode} className={Styles.captureBtn} title='capture current scene' onClick={this.onClickCapture}> <Icon glyph={Icon.GLYPHS.story}/> Capture current scene </button>
                </div>
                 </div>
        );
    }
});

export default StoryBuilder;
