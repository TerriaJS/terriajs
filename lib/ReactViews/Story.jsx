import React from 'react';
import PropTypes from 'prop-types';
import Styles from './story.scss';
import Icon from "./Icon.jsx";
import parseCustomHtmlToReact from './Custom/parseCustomHtmlToReact';

export default class Story extends React.Component {
  getTruncatedContent(text) {
    const content = parseCustomHtmlToReact(text);
    if(content) {
     if(content.props && content.props.children) {
       return content.props.children;
     } else if(content.length > 0 && content[0].props && content[0].props.children) {
       return content[0].props.children;
     } else if(content.length > 0 && !content[0].props) {
       return content;
     }
    }
    return "";
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
  editStory: PropTypes.func
};
