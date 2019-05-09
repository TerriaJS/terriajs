import React from "react";
import { init } from "pell";
import PropTypes from "prop-types";
import "!!style-loader!css-loader?sourceMap!pell/dist/pell.css";

export default class Editor extends React.Component {
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
    "bold",
    "italic",
    "underline",
    "heading1",
    "heading2",
    "olist",
    "ulist",
    "image",
    "link"
  ]
};
