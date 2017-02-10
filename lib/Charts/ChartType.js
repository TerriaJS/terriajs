'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

import LineChart from './LineChart';
import BarChart from './BarChart';

const chartType = {
    line: new LineChart(),
    bar: new BarChart()
};

function determineChartType(chartData) {
    
    // respect chartData.type
    if (chartType[chartData.type] !== undefined) {
        return chartType[chartData.type];
    }
    
    // insert hack here for figuring out which type of chart datasets need
    try
    {
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
            const range = Math.floor(domain.x[1] - domain.x[0]);
            const pointsPerRangeUnit = points / range;
            if (pointsPerRangeUnit < 1) {
                return chartType.bar;
            }
            
        }
        
        if (chartData.points.filter(p => !defined(p.y)).length > 0)
        {
            return chartType.bar;
        }
        
    } catch(e) {
        console.error(e.stack);
    }
    return chartType.line;
}

function initialiseChartData(chartData) {
    if (chartData.renderer === undefined)
    {
        chartData.renderer = determineChartType(chartData);
    }
}

function initialise(state) {
    state.data.forEach(initialiseChartData);
}

module.exports.initialise = initialise;
