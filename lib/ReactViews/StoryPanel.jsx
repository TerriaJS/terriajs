import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { buildShareLink, getShareData } from './Map/Panels/SharePanel/BuildShareLink';
import ObserveModelMixin from './ObserveModelMixin';

import  FileSaver  from 'file-saver';
import URI from 'urijs';

import Styles from './story-panel.scss';

let idCounter = 100;

const StoryPanel = createReactClass({
    displayName: 'StoryPanel',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            newTitle: "",
            newText: ""
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
            </div>
        );
    }
});

export default StoryPanel;
