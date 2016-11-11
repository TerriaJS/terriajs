import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './mappable-preview.scss';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';

/**
 * Displays a table showing the name and values of items in a MetadataItem.
 */
const MetadataTable = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        metadataItem: React.PropTypes.object.isRequired,  // A MetadataItem instance.
        errorMessage: React.PropTypes.string
    },

    render() {
        const metadataItem = this.props.metadataItem;
        const errorMessage = this.props.errorMessage;
        return (
            <div className={Styles.root}>
                <If condition={defined(errorMessage)}>
                    <div className="">
                        {errorMessage}
                    </div>
                </If>
                <If condition={metadataItem.items.length > 0}>
                    <table>
                        <tbody>
                            <For each="item" index="i" of={metadataItem.items}>
                                <tr key={i}>
                                    <td className="">
                                        {item.name}
                                    </td>
                                    <td className="">
                                        {item.value}
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

