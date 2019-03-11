import React from 'react';
import PropTypes from 'prop-types';
import Icon from "./Icon.jsx";
import { Editor } from 'react-draft-wysiwyg';
import Styles from './story-editor.scss';

export default class StoryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      content: '',
      isPopupEditorOpen: false
    };
    this.updateTitle = this.updateTitle.bind(this);
    this.saveStory = this.saveStory.bind(this);
  }
  
  saveStory() {
    this.props.saveStory({title: this.state.title, content: this.state.content});
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
                  <button className={Styles.cancelBtn} onClick={()=>this.setState({isPopupEditorOpen: false})} type='button' title="cancel">Cancel</button>
                  <button className={Styles.saveBtn} onClick ={this.saveStory} type='button' title='save'>Save</button>
              </div>
              <div className={Styles.body}>
                 <Editor 
                      text={this.state.content}
                      onChange={(content) => this.setState({content})}></Editor></div>
              </div>
       </div>
    );
  }
  
  updateTitle(event) {
    this.setState({
      title: event.target.value
    });
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
              <button title="Click to add text" className={Styles.fieldBtn} type="button" onClick={()=>this.setState({isPopupEditorOpen: true})}> Click to add text </button>
              <div className={Styles.editorFooter}>
                <button className={Styles.trashBtn} type='button' title='delete scene' onClick={this.props.exitEditingMode}><Icon glyph={Icon.GLYPHS.trashcan}/></button>
                <input disabled={(!this.state.title || this.state.title.length ===0) && (!this.state.content|| this.state.content.length === 0)} className={Styles.doneBtn} type="submit" value="Done"/>
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
