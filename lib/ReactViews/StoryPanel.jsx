import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ObserveModelMixin from './ObserveModelMixin';
import parseCustomHtmlToReact from './Custom/parseCustomHtmlToReact';
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
        return {
           currentScene: 0
        };
    },

    UNSAFE_componentWillMount() {
        this.activateStory();
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
    activateStory(_story) {
        const story = _story? _story : this.props.terria.stories[0];
        this.props.terria.nowViewing.removeAll();
         if (story.shareData) {
              this.props.terria.updateFromStartData(story.shareData);
          }
    },

    onCenterScene(story) {
      if(story.shareData) {
        this.props.terria.updateFromStartData(story.shareData);
      }
    },

    exitStory() {
        this.props.viewState.storyShown = !this.props.viewState.storyShown; 
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
      const story= this.props.terria.stories[this.state.currentScene];
        return (
                <div className={classNames(Styles.fullPanel, {[Styles.isHidden]: !this.props.viewState.storyShown})}>
                        <div className={Styles.storyContainer} key={story.id}>
                           <div className={Styles.left}>
                               <button className ={Styles.locationBtn} title='center scene' onClick = {this.onCenterScene.bind(this, story)}><Icon glyph ={Icon.GLYPHS.location}/></button>
                               <button className={Styles.previousBtn} disabled={this.props.terria.stories.length <= 1} title="go to previous story" onClick={()=> this.navigateStory(this.state.currentScene - 1)}><Icon glyph={Icon.GLYPHS.left}/></button>
                            </div>
                            <div className={Styles.story}>
                                <div className={Styles.storyHeader}>
                                  {story.title && story.title.length > 0 ? <h3>{story.title}</h3> : <h3> untitled scene </h3>}
                                 <div className={Styles.navBtn}> {this.props.terria.stories.map((story, i)=><button title="`go to story ${i}`" type='button' key={story.id} onClick={()=>this.navigateStory(i)}> <Icon glyph={ i === this.state.currentScene ? Icon.GLYPHS.circleFull : Icon.GLYPHS.circleEmpty }/></button>)}</div> 
                               </div>
                                {story.text && <div className={Styles.body}>{parseCustomHtmlToReact(story.text)}</div>}
                            </div>
                             <div className={Styles.right}>
                             <button className={Styles.exitBtn} title="exit story" onClick={this.exitStory}><Icon glyph={Icon.GLYPHS.close}/></button>
 
                             <button disabled={this.props.terria.stories.length <= 1 } className={Styles.nextBtn} title="go to next story" onClick={()=> this.navigateStory(this.state.currentScene + 1)}><Icon glyph={Icon.GLYPHS.right}/></button>
                             </div>
                        </div>
                </div>
        );
    }
});

export default StoryPanel;
