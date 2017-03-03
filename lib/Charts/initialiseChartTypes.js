'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

import LineChart from './LineChart';
import BarChart from './BarChart';

const chartType = {
    line: new LineChart(),
    bar: new BarChart()
};

/**
 * @param  {ChartData} chartData ChartData object for which chart type needs to be determined.
 */
function determineChartType(chartData) {
    
    // respect chartData.type
    if (chartType[chartData.type] !== undefined) {
        return chartType[chartData.type];
    }
    
    // insert hack here for figuring out which type of chart datasets need
    try
    {
        // this is testing point density if x dimension is date
        // if the number of points per year is less than 1, plot using bar chart
        const points = chartData.points.length;
        const domain = chartData.getDomain();
        if (domain.x[0] instanceof Date) {
            const years = (domain.x[1].getTime() - domain.x[0].getTime()) / (3600 * 24 * 365.25 * 1000);
            const pointsPerYear = points / years;
            if (pointsPerYear < 1) {
                return chartType.bar;
            }
        }
        else
        {
            // this is testing point density if x dimension is not a date
            // if the number of points per x dim is less than 1, plot using bar chart
            const range = Math.floor(domain.x[1] - domain.x[0]);
            const pointsPerRangeUnit = points / range;
            if (pointsPerRangeUnit < 1) {
                return chartType.bar;
            }
            
        }
        // this is looking for gaps in data
        // if there are gaps in the data, plot using bar chart
        if (chartData.points.filter(p => !defined(p.y)).length > 0)
        {
            return chartType.bar;
        }
        
    } catch(e) {
        console.error(e.stack);
    }
    return chartType.line;
}

/**
 * singleton
 */
function initialiseChartData(chartData) {
    if (chartData.renderer === undefined)
    {
        chartData.renderer = determineChartType(chartData);
    }
}

/**
 * Ensure that we have determined the chart type for every data item in our state.
 */
function initialiseChartTypes(state) {
    state.data.forEach(initialiseChartData);
}

module.exports = initialiseChartTypes;
