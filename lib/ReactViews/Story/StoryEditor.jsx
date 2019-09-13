import React from "react";
import PropTypes from "prop-types";
import Editor from "../Generic/Editor.jsx";
import classNames from "classnames";
import Styles from "./story-editor.scss";

export default class StoryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
      text: "",
      id: undefined,
      inView: false
    };

    this.keys = {
      ctrl: false,
      enter: false
    };

    this.saveStory = this.saveStory.bind(this);
    this.cancelEditing = this.cancelEditing.bind(this);
    this.updateTitle = this.updateTitle.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.onKeyUp = this.onKeyUp.bind(this);
    this.slideInTimer = null;
    this.slideOutTimer = null;
    this.escKeyListener = null;
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    const story = this.props.story;
    this.setState({
      title: story.title,
      text: story.text,
      id: story.id
    });
  }

  componentDidMount() {
    this.slideIn();
  }

  slideIn() {
    this.slideInTimer = setTimeout(() => {
      this.setState({
        inView: true
      });

      this.titleInput.focus();
    }, 300);
  }

  slideOut() {
    this.slideOutTimer = this.setState({
      inView: false
    });
    setTimeout(() => {
      this.cancelEditing();
    }, 300);
  }

  componentWillUnmount() {
    clearTimeout(this.slideInTimer);
    if (this.slideOutTimer) {
      clearTimeout(this.slideOutTimer);
    }
    this.setState({
      title: "",
      text: "",
      id: undefined
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
      text: this.props.story.text
    });
  }

  onKeyDown(event) {
    if (event.keyCode === 27) {
      this.cancelEditing();
    }
    if (event.keyCode === 13) {
      this.keys.enter = true;
    }

    if (event.keyCode === 17) {
      this.keys.ctrl = true;
    }
  }

  onKeyUp(event) {
    if (
      (event.keyCode === 13 || event.keyCode === 17) &&
      this.keys.enter &&
      this.keys.ctrl
    ) {
      this.saveStory();
    }

    if (event.keyCode === 13) {
      this.keys.enter = false;
    }

    if (event.keyCode === 17) {
      this.keys.ctrl = false;
    }
  }

  renderPopupEditor() {
    return (
      <div
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
        className={classNames(Styles.popupEditor, {
          [Styles.isMounted]: this.state.inView
        })}
      >
        <div className={Styles.inner}>
          <div className={Styles.header}>
            <input
              ref={titleInput => (this.titleInput = titleInput)}
              placeholder="Enter a title here"
              autoComplete="off"
              className={Styles.field}
              type="text"
              id="title"
              value={this.state.title}
              onChange={this.updateTitle}
            />
            <button
              className={Styles.cancelBtn}
              onClick={this.cancelEditing}
              type="button"
              title="cancel"
            >
              Cancel
            </button>
            <button
              disabled={!this.state.title.length}
              className={Styles.saveBtn}
              onClick={this.saveStory}
              type="button"
              title="save"
            >
              Save
            </button>
          </div>
          <div className={Styles.body}>
            <Editor
              html={this.state.text}
              onChange={text => this.setState({ text })}
            />
          </div>
        </div>
      </div>
    );
  }

  removeStory() {
    this.props.exitEditingMode();
    if (this.state.id) {
      this.props.removeStory(this.state.id);
    }
  }

  render() {
    return <div className={Styles.editor}>{this.renderPopupEditor()}</div>;
  }
}

StoryEditor.propTypes = {
  story: PropTypes.object,
  removeStory: PropTypes.func,
  saveStory: PropTypes.func,
  exitEditingMode: PropTypes.func
};

StoryEditor.defaultProps = { story: { title: "", text: "", id: undefined } };
