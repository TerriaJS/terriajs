import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import CommonStrata from "../../Models/Definition/CommonStrata";
import FunctionParameter from "../../Models/FunctionParameters/FunctionParameter";
import Styles from "./parameter-editors.scss";

@observer
export default class GenericParameterEditor extends Component<{
  parameter: FunctionParameter;
}> {
  constructor(props: { parameter: FunctionParameter }) {
    super(props);
    makeObservable(this);
  }

  @action
  onChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.parameter.setValue(CommonStrata.user, e.target.value);
  }

  render() {
    const value = (this.props.parameter.value || "") as string;
    return (
      <input
        className={Styles.field}
        type="text"
        onChange={this.onChange.bind(this)}
        value={value}
      />
    );
  }
}
