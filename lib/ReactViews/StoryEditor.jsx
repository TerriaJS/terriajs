import React from 'react';
import PropTypes from 'prop-types';
import Icon from "./Icon.jsx";
import Editor from 'react-medium-editor';
import Styles from './story-editor.scss';
import parseCustomHtmlToReact from './Custom/parseCustomHtmlToReact';

export default class StoryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      text: '',
      id: null,
      isPopupEditorOpen: false
    };
    this.updateTitle = this.updateTitle.bind(this);
    this.saveStory = this.saveStory.bind(this);
    this.removeStory = this.removeStory.bind(this);
  }

  UNSAFE_componentWillMount() {
    const story = this.props.story;
    if(story) {
      this.setState({
        title: story.title,
        text: story.text,
        id: story.id
      });
   }
  }

  saveStory() {
    this.props.saveStory({
      title: this.state.title, 
      text: this.state.text,
      id: this.state.id     
    });

    this.setState({
      isPopupEditorOpen: false
    });
  }
  renderPopupEditor() {
    const titleText = this.state.title && this.state.title.length > 0 ? this.state.title : 'untitled scene';
    return (<div className={Styles.popupEditor}>
              <div className={Styles.inner}>
                <div className={Styles.header}>
                  <h3>{titleText}</h3>
                  <button className={Styles.cancelBtn} onClick={()=>this.setState({isPopupEditorOpen: false, text: this.props.story ? this.props.story.text : ''})} type='button' title="cancel">Cancel</button>
                  <button className={Styles.saveBtn} onClick ={this.saveStory} type='button' title='save'>Save</button>
              </div>
              <div className={Styles.body}>
                 <Editor 
                      text={this.state.text}
                      onChange={(text) => this.setState({text})}></Editor></div>
              </div>
       </div>
    );
  }
  
  updateTitle(event) {
    this.setState({
      title: event.target.value
    });
  }
 
  getPlaceHolderText(){
    const content = parseCustomHtmlToReact(this.state.text);
    if(!content){
      return "Click to add content";
    } else if(content.props && content.props.children) {
      return content.props.children;
    } else if(content.length > 0 && content[0].props && content[0].props.children){
      return content[0].props.children;
    } else if(content.length > 0 && !content[0].props){
      return content;
    }
    return "Click to add content";
  }

  removeStory(){
    this.props.exitEditingMode();
    if(this.state.id){
      this.props.removeStory(this.state.id);
    }
  }

  render() {
     return (<div className={Styles.editor}>
         <div className={Styles.editorHeader}>
         {(this.state.title && this.state.title.length > 0) ? this.state.title: "Untitled Scene"}
         </div>
           <form className={Styles.form} onSubmit={this.saveStory}>
              <label className={Styles.label} htmlFor="title">Title:</label>
              <input placeholder="Enter a title here" className={Styles.field} type="text" id="title" value={this.state.title} onChange={this.updateTitle}/>

              <label className={Styles.label} htmlFor="text">Text:</label>
              <button title="Click to add text" className={Styles.fieldBtn} type="button" onClick={()=>this.setState({isPopupEditorOpen: true})}> {this.getPlaceHolderText()} </button>
              <div className={Styles.editorFooter}>
                <button className={Styles.trashBtn} type='button' title='delete scene' onClick={this.removeStory}><Icon glyph={Icon.GLYPHS.trashcan}/></button>
                <input disabled={(!this.state.title || this.state.title.length ===0) && (!this.state.text|| this.state.text.length === 0)} className={Styles.doneBtn} type="submit" value="Done"/>
              </div>
           </form>
        {this.state.isPopupEditorOpen && this.renderPopupEditor()}
        </div>); 
  }
}

StoryEditor.propTypes ={
  story: PropTypes.object,
  removeStory: PropTypes.func,
  saveStory: PropTypes.func,
  exitEditingMode: PropTypes.func
};

