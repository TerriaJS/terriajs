import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import Styles from './metadata-table.scss';

/**
 * Displays a table showing the name and values of items in a MetadataItem.
 */
const MetadataTable = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        metadataItem: React.PropTypes.object.isRequired  // A MetadataItem instance.
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
                                    <th className={Styles.name}>
                                        {item.name}
                                    </th>
                                    <td className={Styles.value}>
                                        <Choose>
                                            <When condition={item.items.length > 0}>
                                                <MetadataTable metadataItem={item} />
                                            </When>
                                            <When condition={Array.isArray(item.value)}>
                                                <If condition={item.value.length > 0 && (isJoinable(item.value))}>
                                                    {item.value.join(', ')}
                                                </If>
                                            </When>
                                            <Otherwise>
                                                {item.value}
                                            </Otherwise>
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

function isStringOrNumber(obj) {
    return typeof obj === 'string' || obj instanceof String || !isNaN(parseFloat(obj));
}

function isJoinable(array) {
    return array.every(isStringOrNumber);
}

export default MetadataTable;

