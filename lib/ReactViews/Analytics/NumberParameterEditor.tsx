import React from "react";

import Styles from "./parameter-editors.scss";
import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import NumberParameter from "../../Models/FunctionParameters/NumberParameter";

@observer
export default class NumberParameterEditor extends React.Component<{
  parameter: NumberParameter;
}> {
  constructor(props: { parameter: NumberParameter }) {
    super(props);
    makeObservable(this);
  }

  @action
  onChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.parameter.setValue(CommonStrata.user, e.target.value);
  }

  render() {
    const value = (this.props.parameter.value || "") as string;
    const min = (this.props.parameter.minimum || "") as string;
    const max = (this.props.parameter.maximum || "") as string;

    return (
      <input
        className={Styles.field}
        type="number"
        onChange={this.onChange.bind(this)}
        value={value}
        min={min}
        max={max}
      />
    );
  }
}
