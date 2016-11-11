import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import Styles from './mappable-preview.scss';

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
                                    <th>
                                        {item.name}
                                    </th>
                                    <td>
                                        <Choose>
                                            <When condition={Array.isArray(item.values)}>
                                                <MetadataTable metadataItem={item} />
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

export default MetadataTable;

