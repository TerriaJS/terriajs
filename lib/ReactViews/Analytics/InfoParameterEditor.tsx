import React from "react";

import { observer } from "mobx-react";
import InfoParameter from "../../Models/FunctionParameters/InfoParameter";
// import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
const parseCustomMarkdownToReact = require("../Custom/parseCustomMarkdownToReact");

@observer
export default class InfoParameterEditor extends React.Component<{
  parameter: InfoParameter;
}> {
  render() {
    return (
      <div>
        {parseCustomMarkdownToReact(this.props.parameter.value, {
          parameter: this.props.parameter
        })}
      </div>
    );
  }
}
