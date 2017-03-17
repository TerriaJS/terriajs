'use strict';
/* global Float32Array */
/* eslint new-parens: 0 */
import React from 'react';
import debounce from 'lodash.debounce';

import defined from 'terriajs-cesium/Source/Core/defined';
import when from 'terriajs-cesium/Source/ThirdParty/when';

import DataUri from '../../../Core/DataUri';
import ObserveModelMixin from '../../ObserveModelMixin';
import VarType from '../../../Map/VarType';
import Icon from "../../Icon.jsx";

import Styles from './chart-panel-download-button.scss';

const RUN_WORKER_DEBOUNCE = 100; // Wait 100ms for initial setup changes to be completed.
const TIME_COLUMN_DEFAULT_NAME = 'date';

const ChartPanelDownloadButton = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        chartableItems: React.PropTypes.array.isRequired,
        errorEvent: React.PropTypes.object.isRequired
    },

    _subscription: undefined,

    getInitialState: function() {
        return {href: undefined};
    },

    componentWillMount() {
        // Changes to the graph item's catalog item results in new props being passed to this component 5 times on load...
        // a debounce is a simple way to ensure it only gets run once for every batch of real changes.
        this.debouncedRunWorker = debounce(this.runWorker, RUN_WORKER_DEBOUNCE);
    },

    componentDidMount() {
        this.debouncedRunWorker(this.props.chartableItems);
    },

    componentWillReceiveProps(newProps) {
        this.debouncedRunWorker(newProps.chartableItems);
    },

    runWorker(newValue) {
        const that = this;

        if (window.Worker && (typeof Float32Array !== 'undefined')) {
            that.setState({href: undefined});

            const loadingPromises = newValue.map(item => item.load());
            when.all(loadingPromises).then(() => {
                const synthesized = that.synthesizeNameAndValueArrays(newValue);
                // Could implement this using TaskProcessor, but requires webpack magic.
                const HrefWorker = require('worker-loader!./downloadHrefWorker');
                const worker = new HrefWorker;
                // console.log('names and value arrays', synthesized.names, synthesized.values);
                if (synthesized.values && synthesized.values.length > 0) {
                    worker.postMessage(synthesized);
                    worker.onmessage = function(event) {
                        // console.log('got worker message', event.data.slice(0, 60), '...');
                        that.setState({href: event.data});
                    };
                }
            });
        }
        // Currently no fallback for IE9-10 - just can't download.
    },

    componentWillUnmount() {
        if (defined(this._subscription)) {
            this._subscription.dispose();
        }
    },

    synthesizeNameAndValueArrays(chartableItems) {
        const valueArrays = [];
        const names = [];  // We will add the catalog item name back into the csv column name.

        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            const xColumn = getXColumn(item);

            if (!names.length) {
                names.push(getXColumnName(item, xColumn));
            }

            let columns = [xColumn];
            if (item.isEnabled && defined(item.tableStructure)) {
                if (!defined(columns[0])) {
                    continue;
                }
                const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
                if (yColumns.length > 0) {
                    columns = columns.concat(yColumns);
                    // Use typed array if possible so we can pass by pointer to the web worker.
                    // Create a new array otherwise because if values are a knockout observable, they cannot be serialised for the web worker.
                    valueArrays.push(columns.map(column => (column.type === VarType.SCALAR ? new Float32Array(column.values) : Array.prototype.slice.call(column.values))));
                    yColumns.forEach(column => {
                        names.push(item.name + ' ' + column.name);
                    });
                }
            }
        }
        return {values: valueArrays, names: names};
    },

    render() {
        if (this.state.href) {
            if (DataUri.checkCompatibility()) {
                return (
                    <a className={Styles.btnDownload}
                       download='chart data.csv'
                       href={this.state.href}>
                    <Icon glyph={Icon.GLYPHS.download}/>Download</a>
                );
            } else {
                return (
                    <span className={Styles.btnDownload}
                          onClick={DataUri.checkCompatibility.bind(null, this.props.errorEvent, this.state.href)}>
                    <Icon glyph={Icon.GLYPHS.download}/>Download</span>
                );
            }
        }
        return null;
    }
});

/**
 * Gets the name for the x column - this will be 'date' if it's a time column otherwise it'll be the column's name.
 */
function getXColumnName(item, column) {
    if (item.timeColumn) {
        return TIME_COLUMN_DEFAULT_NAME;
    } else {
        return column.name;
    }
}

/**
 * Gets the column that will be used for the X axis of the chart.
 *
 * @returns {TableColumn}
 */
function getXColumn(item) {
    return item.timeColumn || (item.tableStructure && item.tableStructure.columnsByType[VarType.SCALAR][0]);
}

module.exports = ChartPanelDownloadButton;
