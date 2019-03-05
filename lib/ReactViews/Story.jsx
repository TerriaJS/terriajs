import React from 'react';
import PropTypes from 'prop-types';
import Styles from './story.scss';
import Icon from "./Icon.jsx";

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
            <h3>{story.title}</h3>
            <button className={Styles.toggleBtn} onClick={()=>this.setState({isOpen: !this.state.isOpen})}><Icon glyph={Icon.GLYPHS.map}/></button>
          </div>
          {this.state.isOpen && <div className={Styles.body}><p>{story.text}</p>
          <div className={Styles.footer}><button className={Styles.removeBtn} onClick={() => this.props.removeStory(story)}><Icon glyph={Icon.GLYPHS.trashcan}/></button>
          <button className={Styles.viewBtn} onClick={()=> this.props.runStory(story)}>View this scene</button></div>
 </div>}
         </div>
     ); 
  }
}

Story.propTypes ={
  story: PropTypes.object,
  removeStory: PropTypes.func,
  runStory: PropTypes.func
};
