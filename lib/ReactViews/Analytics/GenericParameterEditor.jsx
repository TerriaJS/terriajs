import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../ObserveModelMixin";

import Styles from "./parameter-editors.scss";

const GenericParameterEditor = createReactClass({
  displayName: "GenericParameterEditor",
  mixins: [ObserveModelMixin],

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object
  },

  onChange(e) {
    this.props.parameter.value = e.target.value;
  },

  render() {
    return (
      <input
        className={Styles.field}
        type="text"
        onChange={this.onChange}
        value={this.props.parameter.value || ""}
      />
    );
  }
});

module.exports = GenericParameterEditor;
