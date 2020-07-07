import React from "react";
import { init, exec } from "pell";
import PropTypes from "prop-types";
import i18next from "i18next";

export default class Editor extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.editor = init({
      element: this.node,
      onChange: this.props.onChange,
      actions: this.props.actions
    });
    this.editor.content.innerHTML = this.props.html;
  }

  componentWillUnmount() {
    this.editor = undefined;
  }
  render() {
    return <div ref={node => (this.node = node)} />;
  }
}

Editor.propTypes = {
  html: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actions: PropTypes.array
};

Editor.defaultProps = {
  actions: [
    "bold", // eslint-disable-line i18next/no-literal-string
    "italic", // eslint-disable-line i18next/no-literal-string
    "underline", // eslint-disable-line i18next/no-literal-string
    "heading1", // eslint-disable-line i18next/no-literal-string
    "heading2", // eslint-disable-line i18next/no-literal-string
    "olist", // eslint-disable-line i18next/no-literal-string
    "ulist", // eslint-disable-line i18next/no-literal-string
    "image", // eslint-disable-line i18next/no-literal-string
    {
      name: "link", // eslint-disable-line i18next/no-literal-string
      result: () => {
        /* eslint-disable-next-line no-alert */
        const url = window.prompt(i18next.t("genericEditor"), "http://");
        if (url) {
          exec("createLink", url); // eslint-disable-line i18next/no-literal-string
        }
      }
    }
  ]
};
