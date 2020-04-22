import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import Styles from "./parameter-editors.scss";
import { action } from "mobx";
import EnumerationParameter from "../../Models/EnumerationParameter";

@observer
export default class EnumerationParameterEditor extends React.Component<{parameter: EnumerationParameter}> {
  @action
  onChange(e:React.ChangeEvent<HTMLSelectElement>) {
    this.props.parameter.value = e.target.value;
  }

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