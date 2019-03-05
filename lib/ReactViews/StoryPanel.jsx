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
        return {
            newTitle: "",
            newText: "",
            uri: "",
            currentScene: 0
        };
    },

    navigateStory(index) {
        if(index < 0) {
          index = this.props.terria.stories.length - 1;
        } else if(index >= this.props.terria.stories.length) {
          index = 0;
        }
        if (index !== this.state.currentScene) {
          this.setState({ 
            currentScene: index
          });
          if (index< (this.props.terria.stories || []).length) {
              this.activateStory(this.props.terria.stories[index]);
          }
      }
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
                <div className={classNames(Styles.fullPanel, {[Styles.isHidden]: !this.props.viewState.storyShown})}>
                    {(this.props.terria.stories || []).map(scene => (
                        <div className={Styles.storyContainer} key={scene.id}>
                            <div className={Styles.story}>
                                <div className={Styles.storyHeader}>
                                  {scene.title && <h1>{scene.title}</h1>}
                                  {this.props.terria.stories.map((story, i)=><button title="`go to story ${i}`" type='button' className={Styles.navBtn} key={story.id} onClick={()=>this.navigateStory(i)}> <Icon glyph={ i === this.state.currentScene ? Icon.GLYPHS.circleFull : Icon.GLYPHS.circleEmpty }/></button>)} 
                                  {this.props.terria.stories.length > 1 &&  <button className={Styles.previousBtn} title="go to previous story" onClick={()=> this.navigateStory(this.state.currentScene - 1)}><Icon glyph={Icon.GLYPHS.previous}/></button>}
                                  {this.props.terria.stories.length > 1 &&  <button className={Styles.nextBtn} title="go to next story" onClick={()=> this.navigateStory(this.state.currentScene + 1)}><Icon glyph={Icon.GLYPHS.next}/></button>}
                                  
                                  <button className={Styles.pauseBtn} title="exit story" onClick={this.exitStory}><Icon glyph={Icon.GLYPHS.close}/></button>
                                </div>
                                {scene.text && <div className={Styles.body}>{scene.text}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
});

export default StoryPanel;
