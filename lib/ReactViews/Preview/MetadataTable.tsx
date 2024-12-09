import React from "react";
import createReactClass from "create-react-class";
import { isObservableArray } from "mobx";
import PropTypes from "prop-types";
import Styles from "./metadata-table.scss";

/**
 * Displays a table showing the name and values of items in a MetadataItem.
 */
const MetadataTable = createReactClass({
  displayName: "MetadataTable",

  propTypes: {
    metadataItem: PropTypes.object.isRequired // A MetadataItem instance.
  },

  renderDataCell(metadataItem: any, key: any) {
    if (typeof metadataItem[key] === "object") {
      // @ts-expect-error TS(2769): No overload matches this call.
      return <MetadataTable metadataItem={metadataItem[key]} />;
    } else if (
      Array.isArray(metadataItem[key]) ||
      isObservableArray(metadataItem[key])
    ) {
      return metadataItem[key].length > 0 && isJoinable(metadataItem[key])
        ? metadataItem[key].join(", ")
        : null;
    } else return metadataItem[key];
  },

  renderObjectItemRow(key: any, i: any) {
    const metadataItem = this.props.metadataItem;
    return (
      <tr key={i}>
        // @ts-expect-error TS(2339): Property 'name' does not exist on type
        'IMetadataT... Remove this comment to see the full error message
        <th className={Styles.name}>{key}</th>
        <td className={Styles.value}>
          {this.renderDataCell(metadataItem, key)}
        </td>
      </tr>
    );
  },

  render() {
    const metadataItem = this.props.metadataItem;
    const keys = Object.keys(metadataItem);
    const isArr =
      Array.isArray(metadataItem) || isObservableArray(metadataItem);
    if (keys.length === 0 && !isArr) return null;

    return (
      <div className={Styles.root}>
        <table>
          <tbody>
            {isArr && metadataItem.length > 0 && isJoinable(metadataItem) && (
              <tr>
                <td>{metadataItem.join(", ")}</td>
              </tr>
            )}

            {!isArr &&
              keys.length > 0 &&
              keys.map((key, i) => this.renderObjectItemRow(key, i))}
          </tbody>
        </table>
      </div>
    );
  }
});

/**
 * @param  {Object}  obj
 * @return {Boolean} Returns true if the object obj is a string or a number.
 * @private
 */
function isStringOrNumber(obj: any) {
  return (
    typeof obj === "string" || obj instanceof String || !isNaN(parseFloat(obj))
  );
}

/**
 * @param  {Array} array
 * @return {Boolean} Returns true if the array only contains objects which can be joined.
 * @private
 */
function isJoinable(array: any) {
  return array.every(isStringOrNumber);
}

export default MetadataTable;
