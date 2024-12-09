import React, { Suspense } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./story-editor.scss";
import { withTranslation } from "react-i18next";
import tinymce from "tinymce";

// Lazy load the Editor component as the tinyMCE library is large
const Editor = React.lazy(() => import("../Generic/Editor.jsx"));
class StoryEditor extends React.Component {
  escKeyListener: any;
  keys: any;
  slideInTimer: any;
  slideOutTimer: any;
  titleInput: any;
  constructor(props: any) {
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
    // @ts-expect-error TS(2339): Property 'story' does not exist on type 'Readonly<... Remove this comment to see the full error message
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

  updateTitle(event: any) {
    this.setState({
      title: event.target.value
    });
  }

  saveStory() {
    // @ts-expect-error TS(2339): Property 'saveStory' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.saveStory({
      // @ts-expect-error TS(2339): Property 'title' does not exist on type 'Readonly<... Remove this comment to see the full error message
      title: this.state.title,
      // @ts-expect-error TS(2339): Property 'text' does not exist on type 'Readonly<{... Remove this comment to see the full error message
      text: this.state.text,
      // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
      id: this.state.id
    });

    this.setState({
      isPopupEditorOpen: false
    });
  }

  cancelEditing() {
    // @ts-expect-error TS(2339): Property 'exitEditingMode' does not exist on type ... Remove this comment to see the full error message
    this.props.exitEditingMode();
    this.setState({
      // @ts-expect-error TS(2339): Property 'story' does not exist on type 'Readonly<... Remove this comment to see the full error message
      title: this.props.story.title,
      // @ts-expect-error TS(2339): Property 'story' does not exist on type 'Readonly<... Remove this comment to see the full error message
      text: this.props.story.text
    });
  }

  onKeyDown(event: any) {
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

  onKeyUp(event: any) {
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

  handleChange(value: any) {
    this.setState({ text: value });
  }

  removeStory() {
    // @ts-expect-error TS(2339): Property 'exitEditingMode' does not exist on type ... Remove this comment to see the full error message
    this.props.exitEditingMode();
    // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Readonly<{}>... Remove this comment to see the full error message
    if (this.state.id) {
      // @ts-expect-error TS(2339): Property 'removeStory' does not exist on type 'Rea... Remove this comment to see the full error message
      this.props.removeStory(this.state.id);
    }
  }

  render() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    const maxImageHeight = "350px"; // TODO: where to put this to reduce coupling?
    return (
      <div
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
        className={classNames(Styles.popupEditor, {
          // @ts-expect-error TS(2339): Property 'inView' does not exist on type 'Readonly... Remove this comment to see the full error message
          [Styles.isMounted]: this.state.inView
        })}
      >
        <div className={Styles.inner}>
          <div className={Styles.header}>
            <input
              ref={(titleInput) => (this.titleInput = titleInput)}
              placeholder={t("story.editor.placeholder")}
              autoComplete="off"
              className={Styles.field}
              type="text"
              id="title"
              // @ts-expect-error TS(2339): Property 'title' does not exist on type 'Readonly<... Remove this comment to see the full error message
              value={this.state.title}
              onChange={this.updateTitle}
            />
            <button
              className={Styles.cancelBtn}
              onClick={this.cancelEditing}
              type="button"
              title={t("story.editor.cancelBtn")}
            >
              {t("story.editor.cancelEditing")}
            </button>
            <button
              // @ts-expect-error TS(2339): Property 'title' does not exist on type 'Readonly<... Remove this comment to see the full error message
              disabled={!this.state.title.length}
              className={Styles.saveBtn}
              onClick={this.saveStory}
              type="button"
              title={t("story.editor.saveBtn")}
            >
              {t("story.editor.saveStory")}
            </button>
          </div>
          <div className={Styles.body}>
            <Suspense fallback={<div>Loading...</div>}>
              <Editor
                // @ts-expect-error TS(2339): Property 'text' does not exist on type 'Readonly<{... Remove this comment to see the full error message
                html={this.state.text}
                onChange={(_newValue, editor) => {
                  // TODO: This makes StoryEditor tightly coupled to Editor. How to reduce coupling?
                  // @ts-expect-error TS(2531): Object is possibly 'null'.
                  tinymce.activeEditor.dom.setStyles(
                    // @ts-expect-error TS(2531): Object is possibly 'null'.
                    tinymce.activeEditor.dom.select("img"),
                    { "max-height": `${maxImageHeight}`, width: "auto" }
                  );
                  const text = editor.getBody().innerHTML;
                  this.setState({ text });
                }}
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }
}

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
StoryEditor.propTypes = {
  story: PropTypes.object,
  removeStory: PropTypes.func,
  saveStory: PropTypes.func,
  exitEditingMode: PropTypes.func,
  t: PropTypes.func.isRequired,
  terria: PropTypes.object
};

// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
StoryEditor.defaultProps = { story: { title: "", text: "", id: undefined } };
export default withTranslation()(StoryEditor);
