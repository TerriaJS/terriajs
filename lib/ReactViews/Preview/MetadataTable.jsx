import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./metadata-table.scss";

/**
 * Displays a table showing the name and values of items in a MetadataItem.
 */
const MetadataTable = createReactClass({
  displayName: "MetadataTable",
  mixins: [ObserveModelMixin],

  propTypes: {
    metadataItem: PropTypes.object.isRequired // A MetadataItem instance.
  },

  render() {
    const metadataItem = this.props.metadataItem;
    return (
      <div className={Styles.root}>
        <If condition={metadataItem.items.length > 0}>
          <table>
            <tbody>
              <For each="item" index="i" of={metadataItem.items}>
                <tr key={i}>
                  <th className={Styles.name}>{item.name}</th>
                  <td className={Styles.value}>
                    <Choose>
                      <When condition={item.items.length > 0}>
                        <MetadataTable metadataItem={item} />
                      </When>
                      <When condition={Array.isArray(item.value)}>
                        <If
                          condition={
                            item.value.length > 0 && isJoinable(item.value)
                          }
                        >
                          {item.value.join(", ")}
                        </If>
                      </When>
                      <Otherwise>{item.value}</Otherwise>
                    </Choose>
                  </td>
                </tr>
              </For>
            </tbody>
          </table>
        </If>
      </div>
    );
  }
});

/**
 * @param  {Object}  obj
 * @return {Boolean} Returns true if the object obj is a string or a number.
 * @private
 */
function isStringOrNumber(obj) {
  return (
    typeof obj === "string" || obj instanceof String || !isNaN(parseFloat(obj))
  );
}

/**
 * @param  {Array} array
 * @return {Boolean} Returns true if the array only contains objects which can be joined.
 * @private
 */
function isJoinable(array) {
  return array.every(isStringOrNumber);
}

export default MetadataTable;
