import React from 'react';
import PropTypes from 'prop-types';
import Editor from 'react-medium-editor';
import Styles from './story-editor.scss';

export default class StoryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      text: '',
      id: null,
    };
    this.saveStory = this.saveStory.bind(this);
    this.cancelEditing = this.cancelEditing.bind(this);
    this.updateTitle = this.updateTitle.bind(this);
  }

  UNSAFE_componentWillMount() {
    const story = this.props.story;
    this.setState({
      title: story.title,
      text: story.text,
      id: story.id
    });
  }
  
  updateTitle(event) {
    this.setState({
      title: event.target.value
    });
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

  cancelEditing() {
   this.props.exitEditingMode();
    this.setState({
      title: this.props.story.title,
      text: this.propd.story.text
    });
  }

  renderPopupEditor() {
    return (<div className={Styles.popupEditor}>
              <div className={Styles.inner}>
                <div className={Styles.header}>
                  <h3><input placeholder="Enter a title here" className={Styles.field} type="text" id="title" value={this.state.title} onChange={this.updateTitle}/></h3>
                  <button className={Styles.cancelBtn} onClick={this.cancelEditing} type='button' title="cancel">Cancel</button>
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
   
  removeStory() {
    this.props.exitEditingMode();
    if(this.state.id) {
      this.props.removeStory(this.state.id);
    }
  }

  render() {
     return (<div className={Styles.editor}>
                {this.renderPopupEditor()}
                 </div>); 
  }
}

StoryEditor.propTypes ={
  story: PropTypes.object,
  removeStory: PropTypes.func,
  saveStory: PropTypes.func,
  exitEditingMode: PropTypes.func
};

StoryEditor.defaultProps = { story: {title: '', text: '', id: null} };
