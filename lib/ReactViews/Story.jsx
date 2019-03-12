import React from 'react';
import PropTypes from 'prop-types';
import Styles from './story.scss';
import Icon from "./Icon.jsx";
import parseCustomHtmlToReact from './Custom/parseCustomHtmlToReact';

export default class Story extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }
  render() {
    const story = this.props.story;
     return (<div className={Styles.story} >
          <div className={Styles.storyHeader}> 
            <h3>{story.title && story.title.length > 0 ? story.title : 'untitled scene'}</h3>
            <button className={Styles.toggleBtn} onClick={()=>this.props.editStory(story)}><Icon glyph={Icon.GLYPHS.map}/></button>
          </div>
  </div>
     ); 
  }
}

Story.propTypes ={
  story: PropTypes.object,
  removeStory: PropTypes.func,
  runStory: PropTypes.func,
  editStory: PropTypes.func
};
