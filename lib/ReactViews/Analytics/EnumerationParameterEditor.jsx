import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import Styles from "./parameter-editors.scss";
import { runInAction } from "mobx";

@observer
class EnumerationParameterEditor extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object
  };

  onChange(e) {
    runInAction(() => {
      this.props.parameter.value = e.target.value;
    })
  };

  render() {
    return (
      <select
        className={Styles.field}
        onChange={this.onChange.bind(this)}
        value={this.props.parameter.value}
      >
        {this.props.parameter.possibleValues.map((v, i) => (
          <option value={v} key={i}>
            {v}
          </option>
        ))}
      </select>
    );
  }
}

module.exports = EnumerationParameterEditor;
