import defined from 'terriajs-cesium/Source/Core/defined';

import DataUri from '../../Core/DataUri';
import TableStructure from '../../Map/TableStructure';
import VarType from '../../Map/VarType';

/**
 * Gets the column that will be used for the X axis of the chart.
 *
 * @returns {TableColumn}
 */
function getXColumn(item) {
    return item.timeColumn || (item.tableStructure && item.tableStructure.columnsByType[VarType.SCALAR][0]);
}

onmessage = function(event) {
    const chartableItems = event.data;    
    const columnArrays = [];
    const columnItemNames = [''];  // We will add the catalog item name back into the csv column name.
    for (let i = chartableItems.length - 1; i >= 0; i--) {
        const item = chartableItems[i];
        const xColumn = getXColumn(item);
        let columns = [xColumn];
        if (item.isEnabled && defined(item.tableStructure)) {
            if (!defined(columns[0])) {
                continue;
            }
            const yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(column=>column.isActive);
            if (yColumns.length > 0) {
                columns = columns.concat(yColumns);
                columnArrays.push(columns);
                for (let j = yColumns.length - 1; j >= 0; j--) {
                    columnItemNames.push(item.name);
                }
            }
        }
    }
    const tableStructure = TableStructure.fromColumnArrays(columnArrays);
    // Adjust the column names.
    if (defined(tableStructure)) {
        for (let k = tableStructure.columns.length - 1; k >= 0; k--) {
            tableStructure.columns[k].name = columnItemNames[k] + ' ' + tableStructure.columns[k].name;
        }
    }
    const href = DataUri.make('csv', tableStructure.toCsvString('isoDateTime'));
    postMessage(href);
};
