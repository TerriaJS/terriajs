import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";

import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";

const DateParameterEditor = createReactClass({
  displayName: "DateParameterEditor",

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object
  },

  getInitialState() {
    return this.getDate();
  },

  getDate() {
    const retDate = { date: "" };
    const strDate = this.props.parameter.value;
    if (strDate !== undefined) {
      const splits = strDate.split("T");
      retDate["date"] = splits[0];
    }
    this.setDate(retDate);

    return retDate;
  },

  setDate(date) {
    this.props.parameter.setValue(CommonStrata.user, date["date"]);
  },

  onChangeDate(e) {
    const newVal = e.target.value;
    const date = this.getDate();
    date["date"] = newVal;
    this.setDate(date);
    this.setState(date);
  },

  render() {
    const style =
      defined(this.props.parameter) && defined(this.props.parameter.value)
        ? Styles.field
        : Styles.fieldDatePlaceholder;

    return (
      <div>
        <input
          className={style}
          type="date"
          placeholder="YYYY-MM-DD"
          onChange={this.onChangeDate}
          value={this.state["date"]}
        />
      </div>
    );
  }
});

module.exports = DateParameterEditor;
