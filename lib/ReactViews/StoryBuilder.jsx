import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { buildShareLink, getShareData } from './Map/Panels/SharePanel/BuildShareLink';
import ObserveModelMixin from './ObserveModelMixin';

import  FileSaver  from 'file-saver';
import URI from 'urijs';

import Styles from './story-panel.scss';

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

const StoryBuilder = createReactClass({
    displayName: 'StoryBuilder',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            newTitle: "",
            newText: "",
            uri: ""
        };
    },

    activateStory(story) {
        this.props.terria.nowViewing.removeAll();
        window.location = story.shareUrl;
    },
    removeStory(story) {
        this.props.terria.stories = this.props.terria.stories.filter(st => st !== story);
    },

    onSubmit(evt) {
        const shareUrl = new URI(buildShareLink(this.props.terria, false)).hash();

        this.props.terria.stories = [...(this.props.terria.stories || []), {
            id: idCounter++,
            title: this.state.newTitle,
            text: this.state.newText,
            shareUrl
        }];
        this.setState({
            newTitle: "",
            newText: ""
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
        this.props.viewState.storyProgress = 0;
        this.props.viewState.showStory = true;
        window.open(`#stories=${encodeURIComponent(this.state.uri)}`);
    },

    render() {
        return (
            <div className={Styles.storyPanel}>
                {(this.props.terria.stories || []).map(story => <div className={Styles.story} key={story.id} onClick={() => this.activateStory(story)}>
                     <h3>{story.title}</h3>
                     <p>{story.text}</p>
                     <button onClick={(evt) => {this.removeStory(story); evt.stopPropagation();}}>Remove</button>
                </div>)}
                <div className={Styles.story}>
                    <form onSubmit={this.onSubmit}>
                        <label htmlFor="title">Title:</label>
                        <input type="text" id="title" value={this.state.newTitle} onChange={this.updateTitle}/>
                        <br/>
                        <label htmlFor="text">Text:</label>
                        <input type="text" id="text" value={this.state.newText} onChange={this.updateText}/>
                        <br/>
                        <input type="submit" value="Capture scene"/>
                    </form>
                </div>
                <button onClick={this.downloadShareFile}>Download share file</button>
                <button onClick={this.saveToMyJson}>Save to myjson.com</button>
                <div>{this.state.uri}</div>
                {this.state.uri && <button onClick={this.runStory}>Run saved story</button>}
            </div>
        );
    }
});

export default StoryBuilder;
