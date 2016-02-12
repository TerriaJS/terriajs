'use strict';

import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import CatalogGroup from '../Models/CatalogGroup';
import CsvCatalogItem from '../Models/CsvCatalogItem';

const ChartExpandButton = React.createClass({

    propTypes: {
        terria: React.PropTypes.object,
        expandUrl: React.PropTypes.string
    },

    expand() {
        var terria = this.props.terria;
        var catalogItem = new CsvCatalogItem(terria, this.props.expandUrl);
        catalogItem.name = 'Untitled-' + Math.round(Math.random() * 1000); // TODO: eg. containerViewModel.name + ': ' + title
        var group = terria.catalog.upsertCatalogGroup(CatalogGroup, 'Chart Data', 'A group for chart data.');
        group.isOpen = true;
        group.add(catalogItem);
        catalogItem.isLoading = true;
        terria.catalog.chartableItems.push(catalogItem);  // Notify the chart panel so it shows "loading".
        catalogItem.isEnabled = true;  // This loads it as well.
    },

    render() {
        let expandChartButtons;
        if (!defined(this.props.expandUrl)) {
            return null;
        }
        return (
            <button className='btn btn--chart-expand' onClick={this.expand}>Expand</button>
        );
    }

});

module.exports = ChartExpandButton;
