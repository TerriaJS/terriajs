import React from 'react';
import PropTypes from 'prop-types';
import Styles from './story.scss';
import classNames from 'classnames';
import Icon from "../Icon.jsx";
import parseCustomHtmlToReact from '../Custom/parseCustomHtmlToReact';
import {sortable} from 'react-anything-sortable';

class Story extends React.Component {
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
    this.moveUp = this.moveUp.bind(this);
    this.moveDown = this.moveDown.bind(this);
  }
    /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
      window.addEventListener('click', this.hideList);
  }

  componentWillUnmount() {
      window.removeEventListener('click', this.hideList);
  }

  hideList() {
    this.setState({
      menuOpen: false
    });
  }

  getTruncatedContent(text) {
    const content = parseCustomHtmlToReact(text);
    let except = ''; 
    if(content) {
     if(content.props && content.props.children) {
       except =  content.props.children.slice(0, 100);
     } else if(content.length > 0 && content[0].props && content[0].props.children) {
       except =  content[0].props.children;
     } else if(content.length > 0 && !content[0].props) {
       except =  content;
     }
    }
    return except.slice(0, 100);
  }

  toggleMenu(event) {
    event.stopPropagation();
    this.setState({
      menuOpen: !this.state.menuOpen
    }); 
  }

  viewStory(event) {
    event.stopPropagation();
    this.props.viewStory(this.props.story);
    this.hideList();
  }

  editStory(event) {
    event.stopPropagation();
    this.props.editStory(this.props.story);
    this.hideList();
  }

  recaptureStory(event) {
   event.stopPropagation();
   this.props.recaptureStory(this.props.story);
   this.hideList();
  }

  deleteStory(event) {
    event.stopPropagation();
    this.props.deleteStory(this.props.story);
    this.hideList();
  }

  moveUp(event) {
    event.stopPropagation();
    this.props.moveUp();
    this.hideList();
  }

  moveDown(event) {
    event.stopPropagation();
    this.props.moveDown();
    this.hideList();
  }

  renderMenu() {
    return (<div className={Styles.menu}>
               <ul className={Styles.menuInner}>
                  <li><button className={Styles.menuBtn} type='button' title='view' onClick={this.viewStory}>View</button></li>
                  <li><button className={Styles.menuBtn} type='button' title='edit' onClick={this.editStory}>Edit</button></li>
                  <li><button className={Styles.menuBtn} type='button' title='recapture' onClick={this.recaptureStory}>Recapture</button></li>
                  <li><button className={Styles.menuBtn} type='button' title='delete' onClick={this.deleteStory}>Delete</button></li>
                 {this.props.moveUp && <li><button className={Styles.menuBtn} type='button' title='move up' onClick={this.moveUp}>Move up</button></li>}
                 {this.props.moveDown && <li><button className={Styles.menuBtn} type='button' title='move down' onClick={this.moveDown}>Move down</button></li>}
               </ul>
      </div>);
  }

  render() {
    const story = this.props.story;
    const bodyText = this.getTruncatedContent(story.text);

     return (<div className={classNames(this.props.className, Styles.story)}
                  onMouseDown={this.props.onMouseDown}
                  style={this.props.style}
                  onTouchStart={this.props.onTouchStart}>
            <div className={Styles.storyHeader}> 
            <h3 className={Styles.draggable}> 
                       {story.title && story.title.length > 0 ? story.title : 'untitled scene'} 
            </h3>
            <button className={Styles.toggleBtn} onClick={this.toggleMenu}><Icon glyph={Icon.GLYPHS.menuDotted}/></button>
            {this.state.menuOpen && this.renderMenu()}
          </div>
            {bodyText.length > 0 && <div className={Styles.body}>{bodyText}</div>}
           </div>
     ); 
  }
}

Story.propTypes ={
  story: PropTypes.object,
  editStory: PropTypes.func,
  viewStory: PropTypes.func, 
  deleteStory: PropTypes.func,
  recaptureStory: PropTypes.func,
  moveUp: PropTypes.func,
  moveDown: PropTypes.func,
  onMouseDown: PropTypes.func.isRequired,
  onTouchStart: PropTypes.func.isRequired,
  style: PropTypes.object,
  className: PropTypes.string,
};

module.exports = sortable(Story);
