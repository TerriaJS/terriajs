import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import naturalSort from 'javascript-natural-sort';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './data-preview.scss';

naturalSort.insensitive = true;

// Should get it from option
const DEFAULT_SECTION_ORDER = [
    'Disclaimer',
    'Description',
    'Data Description',
    'Dataset Description',
    'Service Description',
    'Resource Description',
    'Licence',
    'Access Constraints',
    'Author',
    'Contact',
    'Created',
    'Modified',
    'Update Frequency'
];

/**
 * CatalogItem-defined sections that sit within the preview description. These are ordered according to the catalog item's
 * order if available.
 */
const DataPreviewSections = createReactClass({
    displayName: 'DataPreviewSections',
    mixins: [ObserveModelMixin],

    propTypes: {
        metadataItem: PropTypes.object.isRequired
    },

    sortInfoSections(items) {
        const infoSectionOrder = this.props.metadataItem.infoSectionOrder || DEFAULT_SECTION_ORDER;

        items.sort(function(a, b) {
            const aIndex = infoSectionOrder.indexOf(a.name);
            const bIndex = infoSectionOrder.indexOf(b.name);
            if (aIndex >= 0 && bIndex < 0) {
                return -1;
            } else if (aIndex < 0 && bIndex >= 0) {
                return 1;
            } else if (aIndex < 0 && bIndex < 0) {
                return naturalSort(a.name, b.name);
            }
            return aIndex - bIndex;
        });

        return items;
    },

    render() {
        const metadataItem = this.props.metadataItem;
        const items = metadataItem.hideSource ? metadataItem.infoWithoutSources : metadataItem.info.slice();

        return (
            <div>
                <For each="item" index="i" of={this.sortInfoSections(items)}>
                    <If condition={item.content && item.content.length > 0}>
                        <div key={i}>
                            <h4 className={Styles.h4}>{item.name}</h4>
                            <Choose>
                                <When condition={item.name && item.name.indexOf("URL") !== -1 }>
                                    <input readOnly
                                        className={Styles.field}
                                        type="text"
                                        value={window.location.protocol + "//" + window.location.hostname + item.content}
                                        onClick={e => e.target.select()} />
                                </When>
                                <Otherwise>
                                    {parseCustomMarkdownToReact(item.content, {catalogItem: metadataItem})}
                                </Otherwise>
                            </Choose>
                        </div>
                    </If>
                </For>
            </div>
        );
    },
});

export default DataPreviewSections;
