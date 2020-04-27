import React from "react";

import Styles from "./parameter-editors.scss";
import FunctionParameter from "../../Models/FunctionParameter";
import { action } from "mobx";
import { observer } from "mobx-react";

@observer
export default class GenericParameterEditor extends React.Component<{
  parameter: FunctionParameter;
}> {
  @action
  onChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.parameter.value = e.target.value;
  }

  render() {
    return (
      <input
        className={Styles.field}
        type="text"
        onChange={this.onChange.bind(this)}
        value={this.props.parameter.value}
      />
    );
  }
}
