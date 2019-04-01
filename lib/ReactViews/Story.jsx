import React from 'react';
import PropTypes from 'prop-types';
import Styles from './story.scss';
import Icon from "./Icon.jsx";
import parseCustomHtmlToReact from './Custom/parseCustomHtmlToReact';

export default class Story extends React.Component {
  constructor(props) {
    super(props);
    this.state ={
      menuOpen: false
    };

    this.toggleMenu = this.toggleMenu.bind(this);
    this.viewStory = this.viewStory.bind(this);
    this.deleteStory = this.deleteStory.bind(this);
    this.editStory = this.editStory.bind(this);
    this.recaptureStory = this.recaptureStory.bind(this);
    this.hideList = this.hideList.bind(this);
  }
    /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
      document.body.addEventListener('click', ()=>this.hideList)
  }

  componentWillUnmount() {
      document.body.removeEventListener('click', ()=>this.hideList)
  }

  hideList(){
    this.setState({
      menuOpen: false
    })
  }

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

  toggleMenu() {
    this.setState({
      menuOpen: !this.state.menuOpen
    }); 
  }

  viewStory(event) {
    event.stopPropagation();
    this.props.viewStory(this.props.story);
    this.setState({
      menuOpen: false
    });
  }

  editStory(event) {
    event.stopPropagation();
    this.props.editStory(this.props.story);
    this.setState({
      menuOpen: false
    });

  }

  recaptureStory(event) {
   event.stopPropagation();
   this.props.recaptureStory(this.props.story);
   this.setState({
      menuOpen: false
    });

  }

  deleteStory(event) {
    event.stopPropagation();
    this.props.deleteStory(this.props.story);
    this.setState({
      menuOpen: false
    });

  }

  renderMenu() {
    return (<div className={Styles.menu}>
               <ul className={Styles.menuInner}>
                  <li><button className={Styles.menuBtn} type='button' title='view' onClick={this.viewStory}>View</button></li>
                  <li><button className={Styles.menuBtn} type='button' title='edit' onClick={this.editStory}>Edit</button></li>
                  <li><button className={Styles.menuBtn} type='button' title='recapture' onClick={this.recaptureStory}>Recapture</button></li>
                  <li><button className={Styles.menuBtn} type='button' title='delete' onClick={this.deleteStory}>Delete</button></li>
               </ul>
      </div>);
  }

  render() {
    const story = this.props.story;
     return (<div className={Styles.story} >
            <div className={Styles.storyHeader}> 
            <h3>{story.title && story.title.length > 0 ? story.title : 'untitled scene'}</h3>
            <button className={Styles.toggleBtn} onClick={this.toggleMenu}><Icon glyph={Icon.GLYPHS.menuDotted}/></button>
            {this.state.menuOpen && this.renderMenu()}
          </div>
            <div className={Styles.body}>{this.getTruncatedContent(story.text)} </div>
           </div>
     ); 
  }
}

Story.propTypes ={
  story: PropTypes.object,
  editStory: PropTypes.func,
  viewStory: PropTypes.func, 
  deleteStory: PropTypes.func,
  recaptureStory: PropTypes.func
};
