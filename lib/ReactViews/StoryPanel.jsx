import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ObserveModelMixin from './ObserveModelMixin';
import { Small, Medium } from './Generic/Responsive';
import Icon from "./Icon.jsx";
import Styles from './story-panel.scss';

const StoryPanel = createReactClass({
    displayName: 'StoryPanel',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },
    getInitialState() {
        // Uggh. Side effects in getInitialState. But this is equivalent to the constructor in ES6 code
        this.panel =  React.createRef();
        return {
            newTitle: "",
            newText: "",
            uri: "",
            currentScene: null
        };
    },

    componentDidMount() {
        this.selectStoryFromScrollPosition(this.panel.current.scrollTop);
        this.panel.current.addEventListener("scroll", this.handleScroll, false);
    },

    componentWillUnmount() {
        this.panel.current.removeEventListener("scroll", this.handleScroll);
    },

    selectStoryFromScrollPosition(scrollTop) {

        const clientHeight = this.panel.current.clientHeight;
        const sceneIndex = Math.floor((scrollTop+0.5*clientHeight)/(1.5*clientHeight));
        if (sceneIndex !== this.state.currentScene) {
            this.setState({currentScene: sceneIndex});
            if (sceneIndex < (this.props.terria.stories || []).length) {
                this.activateStory(this.props.terria.stories[sceneIndex]);
            }
        }
    },

    handleScroll(event) {
        const scrollTop = event.srcElement.scrollTop;
        this.selectStoryFromScrollPosition(scrollTop);
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

    exitStory() {
        this.props.viewState.storyShown = !this.props.viewState.storyShown; 
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        return (
            <div>
                <div className={classNames(Styles.fullPanel, {[Styles.isHidden]: !this.props.viewState.storyShown})} ref={this.panel}>
                    {(this.props.terria.stories || []).map(scene => (
                        <div className={Styles.storyContainer} key={scene.id}>
                            <div className={Styles.story}>
                              <button className={Styles.pauseButton} onClick={this.exitStory}>Exit Story</button>
                                {scene.title && <h1>{scene.title}</h1>}
                                {scene.text && <p>{scene.text}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
});

export default StoryPanel;
