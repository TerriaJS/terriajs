'use strict';

import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import CatalogGroup from '../Models/CatalogGroup';
import CsvCatalogItem from '../Models/CsvCatalogItem';
import Dropdown from './Dropdown';

const ChartExpandButton = React.createClass({

    propTypes: {
        terria: React.PropTypes.object,
        sources: React.PropTypes.array,
        sourceNames: React.PropTypes.array
    },

    expandButton() {
        expand(this.props.terria, this.props.sources[this.props.sources.length - 1]);
    },

    expandDropdown(selected, sourceIndex) {
        console.log('clicked on option', sourceIndex, selected);
        expand(this.props.terria, this.props.sources[sourceIndex]);
    },

    render() {
        if (!defined(this.props.sources)) {
            return null;
        }
        if (defined(this.props.sourceNames)) {
            const sourceNameObjects = this.props.sourceNames.map(name=>{ return {name: name}; });
            return (
                <div className='chart-expand'>
                    <Dropdown selectOption={this.expandDropdown} options={sourceNameObjects}>Expand</Dropdown>
                </div>
            );
        }

        return (
            <button className='btn btn--chart-expand' onClick={this.expandButton}>Expand</button>
        );
    }

});

function expand(terria, url) {
    const catalogItem = new CsvCatalogItem(terria, url);
    catalogItem.name = 'Untitled-' + Math.round(Math.random() * 1000);  // TODO: eg. containerViewModel.name + ': ' + title
    const group = terria.catalog.upsertCatalogGroup(CatalogGroup, 'Chart Data', 'A group for chart data.');
    group.isOpen = true;
    group.add(catalogItem);
    catalogItem.isLoading = true;
    terria.catalog.chartableItems.push(catalogItem);  // Notify the chart panel so it shows "loading".
    catalogItem.isEnabled = true;  // This loads it as well.
}

module.exports = ChartExpandButton;
