import React from "react";

import { observer } from "mobx-react";
import InfoParameter from "../../Models/FunctionParameters/InfoParameter";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

@observer
export default class InfoParameterEditor extends React.Component<{
  parameter: InfoParameter;
}> {
  render() {
    return (
      <div>
        {this.props.parameter.value &&
          parseCustomMarkdownToReact(this.props.parameter.value)}
      </div>
    );
  }
}
