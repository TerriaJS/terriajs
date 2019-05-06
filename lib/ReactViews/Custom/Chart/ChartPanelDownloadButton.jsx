'use strict';
import createReactClass from 'create-react-class';
import FileSaver from 'file-saver';
import PropTypes from 'prop-types';
import React from 'react';
import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureDetection from 'terriajs-cesium/Source/Core/FeatureDetection';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import VarType from '../../../Map/VarType';
import Icon from "../../Icon";
import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './chart-panel-download-button.scss';

const TIME_COLUMN_DEFAULT_NAME = 'date';

const ChartPanelDownloadButton = createReactClass({
    displayName: 'ChartPanelDownloadButton',
    mixins: [ObserveModelMixin],

    propTypes: {
        chartableItems: PropTypes.array.isRequired
    },

    /**
     * Extracts column names and row data for CSV download.
     * @param {CatalogItem[]} chartableItems
     * @returns { values, names } where values is an array of array rows, corresponding to the column names.
     */
    synthesizeNameAndValueArrays(chartableItems) {
        const valueArrays = [];
        const names = [];  // We will add the catalog item name back into the csv column name.

        for (let i = chartableItems.length - 1; i >= 0; i--) {
            const item = chartableItems[i];
            const xColumn = getXColumn(item);
            if (!xColumn) {
                continue;
            }
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

    isDownloadSupported() {
        return FeatureDetection.supportsTypedArrays() && FeatureDetection.supportsWebWorkers();
    },

    download() {
        if (!this.isDownloadSupported()) {
            return;
        }

        const loadingPromises = this.props.chartableItems.map(item => {
            return when(item.load()).then(() => item).otherwise(() => undefined);
        });

        when.all(loadingPromises).then(items => {
            const synthesized = this.synthesizeNameAndValueArrays(items.filter(item => item !== undefined));
            // Could implement this using TaskProcessor, but requires webpack magic.
            const HrefWorker = require('worker-loader!./downloadHrefWorker');
            const worker = new HrefWorker();
            // console.log('names and value arrays', synthesized.names, synthesized.values);
            if (synthesized.values && synthesized.values.length > 0) {
                worker.postMessage(synthesized);
                worker.onmessage = event => {
                    // console.log('got worker message', event.data.slice(0, 60), '...');
                    const blob = new Blob([event.data], {
                        type: 'text/csv;charset=utf-8'
                    });
                    FileSaver.saveAs(blob, 'chart data.csv');
                };
            }
        });
    },

    render() {
        if (!this.isDownloadSupported()) {
            return null;
        }

        return (
            <button className={Styles.btnDownload}
                    onClick={this.download}>
                <Icon glyph={Icon.GLYPHS.download}/>Download
            </button>
        );
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
