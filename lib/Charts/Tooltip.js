'use strict';

import {nest as d3Nest} from 'd3-collection';
import {select as d3Select, event as d3Event} from 'd3-selection';
import {transition as d3Transition} from 'd3-transition'; // eslint-disable-line no-unused-vars

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

const defaultTooltipOffset = { // The meaning of these offsets depend on the alignment.
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};
const defaultClassName = 'base-chart-tooltip';
const defaultId = 'base-chart-tooltip-id';
const showHideDuration = 250;

/**
 * Handles the drawing of the chart tooltip, which shows the values of the selected data in a legend.
 *
 * @param  {String} [tooltipSettings.id] The id to use for the tooltip DOM element, defaults to 'base-chart-tooltip-id'. Do not change this after creation.
 * @param  {String} [tooltipSettings.className] The className to use for the tooltip DOM element, defaults to 'base-chart-tooltip'. Do not change this after creation.
 * @param  {String} [tooltipSettings.align] One of 'hover' (hover at the mouse position), 'left', 'right', 'prefer-right' (chooses left or right depending on mouse position).
 * @param  {Object} [tooltipSettings.offset] An object with top, left and right properties; these properties' meanings depend on the alignment above.
 *                                           With right/left alignment, the offset is relative to the svg.
 */
const Tooltip = {

    defaultClassName: defaultClassName,
    defaultId: defaultId,

    id(tooltipSettings) {
        return defaultValue(tooltipSettings.id, defaultId);
    },

    select(tooltipSettings) {
        return d3Select('#' + Tooltip.id(tooltipSettings));
    },

    create(tooltipSettings) {
        // Make the tooltip DOM element, invisible to start.
        // This must go on the body to allow absolute positioning to work.
        if (defined(tooltipSettings)) {
            d3Select('body')
                .append('div')
                .attr('id', Tooltip.id(tooltipSettings))
                .attr('class', defaultValue(tooltipSettings.className, defaultClassName))
                .style('opacity', 1e-6)
                .style('position', 'absolute')
                .style('display', 'none');
        }
    },

    destroy(tooltipSettings) {
        // Remove the tooltip DOM element.
        if (defined(tooltipSettings)) {
            const id = Tooltip.id(tooltipSettings);
            const tooltipElement = d3Select('#' + id).nodes();
            if (tooltipElement) {
                d3Select('#' + id).remove();
                //NOTE:  why not remove it directly like above?
                // tooltipElement.parentElement.removeChild(tooltipElement);
            }
        }
    },

    singleRowHtml(color, name, value, units) {
        const styleAttribute = defined(color) ? ('style="background-color: ' + color + '" ') : '';
        let html = '<tr>';
        html += '<td><span class="color" ' + styleAttribute + '></span><span class="name">' + name + '</span></td>';
        html += '<td class="value">' + value + ' <span class="units">' + (units || '') + '</span></td>';
        html += '</tr>';
        return html;
    },

    html(selectedData) {
        if (selectedData.length === 0) {
            return '';
        }
        let html;
        const x = selectedData[0].point.x; // All the data has the same x.
        html = '<p class="x-value">' + x + '</p>';

        // If there is only one line showing, then label it with the category name, not the column name.
        // Else, if there is only one column name (shared by all the categories), show the category names
        //     and don't show the column name.
        // Else, if there is only one category name, then there is no need to show it.
        // In general, show both, grouped by category name.

        if (selectedData.length === 1) {
            html += '<table class="mouseover"><tbody>';
            const onlyLine = selectedData[0];
            html += this.singleRowHtml(onlyLine.color, onlyLine.categoryName, onlyLine.point.y, onlyLine.units);
            html += '</tbody></table>';
            return html;
        }

        // The next line turns [chartData1A, chartData2, chartData1B] into
        // [{key: 'categoryName1', values: [chartData1A, chartData1B]}, {key: 'categoryName2', values: [chartData2]}].
        const dataGroupedByCategory = d3Nest().key(d=>d.categoryName).entries(selectedData);
        // And similarly for the column names.
        const dataGroupedByName = d3Nest().key(d=>d.name).entries(selectedData);
        if (dataGroupedByName.length === 1) {
            // All lines have the same name.
            html += '<table class="mouseover"><tbody>';
            dataGroupedByName[0].values.forEach(line=>{
                html += this.singleRowHtml(line.color, line.categoryName, line.point.y, line.units);
            });
            html += '</tbody></table>';
            return html;
        }
        dataGroupedByCategory.forEach(group=>{
            if (dataGroupedByCategory.length > 1) {
                html += '<p class="category-name">' + group.key + '</p>';
            }
            html += '<table class="mouseover"><tbody>';
            group.values.forEach(line=>{
                html += this.singleRowHtml(line.color, line.name, line.point.y, line.units);
            });
            html += '</tbody></table>';
        });
        return html;
    },

    show(html, tooltipElement, tooltipSettings, boundingRect) {
        tooltipElement
            .html(html)
            .style('opacity', 1e-6)
            .style('display', 'block')
            .style('visibility', 'hidden')
            .transition().duration(showHideDuration)
                .style('opacity', 1)
                .style('visibility', 'visible');

        const tooltipHeight = +tooltipElement.nodes()[0].offsetHeight;
        const tooltipWidth = +tooltipElement.nodes()[0].offsetWidth;
        const tooltipOffset = defaultValue(tooltipSettings.offset, defaultTooltipOffset);
        let top, left;

        switch (tooltipSettings.align) {
            case 'left':
                top = +boundingRect.top + tooltipOffset.top;
                left = +boundingRect.left + tooltipOffset.left;
                break;
            case 'right':
                top = +boundingRect.top + tooltipOffset.top;
                left = +boundingRect.right - tooltipOffset.right - tooltipWidth;
                break;
            case 'prefer-right':
            {
                // Only show on the left if we would be under the tooltip on the right, but not on the left.
                top = +boundingRect.top + tooltipOffset.top;
                // console.log(boundingRect.top);  // Occasionally the top jerks around a little?
                left = +boundingRect.right - tooltipOffset.right - tooltipWidth;
                const rightEdgeWhenPositionedLeft = +boundingRect.left + tooltipOffset.left + tooltipWidth;
                if ((d3Event.pageX >= left) && (d3Event.pageX > rightEdgeWhenPositionedLeft)) {
                    left = +boundingRect.left + tooltipOffset.left;
                }
                break;
            }
            case 'hover':
                top = d3Event.pageY - tooltipOffset.top;
                left = d3Event.pageX + (-tooltipWidth - tooltipOffset.left);
                break;
            default:  // Same as hover. Would prefer not to have the break above, but lint requires it.
                top = d3Event.pageY - tooltipOffset.top;
                left = d3Event.pageX + (-tooltipWidth - tooltipOffset.left);
        }

        // Make sure the bottom of the tooltip never goes off the bottom of the screen.
        top = Math.min(top, Math.max(5, window.innerHeight - tooltipHeight - tooltipOffset.bottom));
        tooltipElement
            .style('left', left + 'px')
            .style('top', top + 'px');
    },

    hide(tooltipElement) {
        tooltipElement.transition().duration(showHideDuration).style('opacity', 1e-6);
        // visibility hidden cannot transition, and it is too flashy if you use it without.
        // We need it because opacity=0 along can get in front of other elements and prevent the hover from working at all.
        // So delay it until (and only if) the opacity has already done its job.
        setTimeout(function() {
            if (+tooltipElement.style('opacity') < 0.002) {
                tooltipElement.style('visibility', 'hidden');
            }
        }, showHideDuration * 1.2);
    }
};


module.exports = Tooltip;
