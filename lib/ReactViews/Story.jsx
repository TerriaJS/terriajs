import React from 'react';
import PropTypes from 'prop-types';
import Styles from './story.scss';
import Icon from "./Icon.jsx";

class Story extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }
  render() {
    const story = this.props.story;
     return (<div className={Styles.story} key={story.id} >
          <div className={Styles.storyHeader}> 
            <h3>{story.title}</h3>
            <button className={Styles.toggleBtn} onClick={()=>this.setState({isOpen: !this.state.isOpen})}/>
          </div>
          <p>{story.text}</p>
          <button className={Styles.removeBtn} onClick={(evt) => {this.props.removeStory(story); evt.stopPropagation();}}><Icon glyph={Icon.GLYPHS.trashcan}/></button>
          <button className={Styles.viewBtn} onClick={this.props.runStory(story)}>View</button>
       </div>
     ) 
  }
}

Story.propTypes ={
  story: PropTypes.array,
  removeStory: PropTypes.func,
  runStory: PropTypes.func
}
