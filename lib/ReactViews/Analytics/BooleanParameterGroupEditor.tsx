import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import MoreOrLess from "../Generic/MoreOrLess.jsx";
// @ts-expect-error TS(2691): An import path cannot end with a '.tsx' extension.... Remove this comment to see the full error message
import BooleanParameterEditor from "./BooleanParameterEditor.tsx";
import Styles from "./parameter-editors.scss";

const BooleanParameterGroupEditor = createReactClass({
  displayName: "BooleanParameterGroupEditor",
  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object
  },
  toggleDiv: function (divID: any, _ev: any) {
    const thisDiv = document.getElementById(divID);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    if (thisDiv.style.display === "none") {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      thisDiv.style.display = "block";
    } else {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      thisDiv.style.display = "none";
    }
  },
  toggleAll: function (inputArgs: any, _ev: any) {
    // if OneForAll selected, set the value of all BooleanParameters in
    // ParameterList to true, disable them,
    // else set the value of all BooleanParameters in ParameterList to
    // false, enable them
    const FirstOne = document.getElementById(inputArgs.OneForAllId);
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    let LastOne = FirstOne.children[0];
    while (LastOne.childElementCount !== 0) {
      LastOne = LastOne.children[0];
    }
    // @ts-expect-error TS(2339): Property 'href' does not exist on type 'Element'.
    const OneForAllValue = LastOne.href.baseVal.split("-")[1] !== "off";
    const ParamElementArray: any = [];
    Array.from(
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById(inputArgs.ParameterListId).children
    ).forEach(function (child) {
      ParamElementArray.push(child.children[0].children[0]);
    });
    if (OneForAllValue === false) {
      // @ts-expect-error TS(7006): Parameter 'Parameter' implicitly has an 'any' type... Remove this comment to see the full error message
      ParamElementArray.forEach(function (Parameter) {
        // Parameter.value = true;
        // only have the ability to check state of button
        // and fire the onclick if it needs to change.
        const thisButton = Parameter.children[0];
        if (
          thisButton.children[0].children[0].href.baseVal.split("-")[1] ===
          "off"
        ) {
          // fire react click event
          thisButton[
            // @ts-expect-error TS(2538): Type 'string[]' cannot be used as an index type.
            Object.keys(thisButton).filter(function (v) {
              return /__reactEventHandlers/.test(v);
            })
          ].onClick();
        }
        thisButton.disabled = true;
      });
    } else {
      // @ts-expect-error TS(7006): Parameter 'Parameter' implicitly has an 'any' type... Remove this comment to see the full error message
      ParamElementArray.forEach(function (Parameter) {
        // Parameter.value = false;
        const thisButton = Parameter.children[0];
        if (
          thisButton.children[0].children[0].href.baseVal.split("-")[1] !==
          "off"
        ) {
          thisButton[
            // @ts-expect-error TS(2538): Type 'string[]' cannot be used as an index type.
            Object.keys(thisButton).filter(function (v) {
              return /__reactEventHandlers/.test(v);
            })
          ].onClick();
        }
        thisButton.disabled = false;
      });
    }
  },
  renderCheckboxGroup() {
    const whichIcon = true;
    const OneForAll = this.props.parameter.OneForAll;
    let name;
    this.props.parameter.name
      ? (name = this.props.parameter.name + "_Group")
      : (name = this.props.parameter.id + "_Group");
    const OneForAllDivName = name + "_OneForAllDiv";
    const groupClick = this.toggleDiv.bind(this, name);
    const allClick = this.toggleAll.bind(this, {
      OneForAllId: OneForAllDivName,
      ParameterListId: name
    });
    return (
      <fieldset>
        <legend>
          <div style={{ display: "inline-block" }} onClick={groupClick}>
            // @ts-expect-error TS(2769): No overload matches this call.
            <MoreOrLess initialopen={whichIcon} myclass={Styles.btnRadio} />
          </div>
          <div
            id={OneForAllDivName}
            style={{ display: "inline-block" }}
            onClick={allClick}
          >
            <BooleanParameterEditor parameter={OneForAll} />
          </div>
        </legend>
        {/* should this start closed? style={{display: 'none'}} */}
        <div
          id={name}
          style={whichIcon ? { display: "block" } : { display: "none" }}
        >
          {this.props.parameter.ParameterList.map(function (
            item: any,
            key: any
          ) {
            return (
              <div key={key}>
                <BooleanParameterEditor parameter={item} />
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  },
  render() {
    return <div>{this.renderCheckboxGroup()}</div>;
  }
});

export default BooleanParameterGroupEditor;
