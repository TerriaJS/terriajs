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
        sourceNames: React.PropTypes.array,
        catalogItem: React.PropTypes.object,
        feature: React.PropTypes.object,
        chartTitle: React.PropTypes.string
    },

    expandButton() {
        expand(this.props, this.props.sources[this.props.sources.length - 1]);
    },

    expandDropdown(selected, sourceIndex) {
        expand(this.props, this.props.sources[sourceIndex]);
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

function expand(props, url) {
    const terria = props.terria;
    const newCatalogItem = new CsvCatalogItem(terria, url);
    newCatalogItem.name = props.catalogItem.name + ' ' + props.feature.name + ' ' + props.chartTitle;
    const group = terria.catalog.upsertCatalogGroup(CatalogGroup, 'Chart Data', 'A group for chart data.');
    group.isOpen = true;
    group.add(newCatalogItem);
    newCatalogItem.isLoading = true;
    terria.catalog.chartableItems.push(newCatalogItem);  // Notify the chart panel so it shows "loading".
    newCatalogItem.isEnabled = true;  // This loads it as well.
}

module.exports = ChartExpandButton;
