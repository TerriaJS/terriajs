'use strict';

import d3 from 'd3';

import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import defined from 'terriajs-cesium/Source/Core/defined';

const defaultTooltipOffset = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};
const defaultClassName = 'linechart-tooltip';
const defaultId = 'linechart-tooltip-id';
const showHideDuration = 250;

/**
 * Handles the drawing of the chart tooltip, which shows the values of the selected data in a legend.
 *
 * @param  {String} [tooltipSettings.id] The id to use for the tooltip DOM element, defaults to 'linechart-tooltip-id'. Do not change this after creation.
 * @param  {String} [tooltipSettings.className] The className to use for the tooltip DOM element, defaults to 'linechart-tooltip'. Do not change this after creation.
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
        return d3.select('#' + Tooltip.id(tooltipSettings));
    },

    create(tooltipSettings) {
        // Make the tooltip DOM element, invisible to start.
        // This must go on the body to allow absolute positioning to work.
        if (defined(tooltipSettings)) {
            d3.select('body')
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
            const tooltipElement = d3.select('#' + id)[0][0];
            if (tooltipElement && tooltipElement.parentElement) {
                tooltipElement.parentElement.removeChild(tooltipElement);
            }
        }
    },

    html(selectedData) {
        if (selectedData.length === 0) {
            return '';
        }
        let html;
        const x = selectedData[0].point.x; // All the data has the same x.
        // The next line turns [chartData1A, chartData2, chartData1B] into
        // [{key: 'categoryName1', values: [chartData1A, chartData1B]}, {key: 'categoryName2', values: [chartData2]}].
        const groupedData = d3.nest().key(d=>d.categoryName).entries(selectedData);
        html = '<p class="x-value">' + x + '</p>';
        groupedData.forEach(group=>{
            group.values.forEach(line=>{
                html += '<table class="mouseover"><tbody>';
                const styleAttribute = defined(line.color) ? ('style="background-color: ' + line.color + '" ') : '';
                html += '<tr>';
                html += '<td><span class="color" ' + styleAttribute + '></span><span class="name">' + line.name + '</span></td>';
                html += '<td class="value">' + line.point.y + ' <span class="units">' + (line.units || '') + '</span></td>';
                html += '</tr>';
                html += '</tbody></table>';
            });
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

        const tooltipHeight = +tooltipElement[0][0].offsetHeight;
        const tooltipWidth = +tooltipElement[0][0].offsetWidth;
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
                // Only show on the left if we would be under the tooltip on the right, but not on the left.
                top = +boundingRect.top + tooltipOffset.top;
                // console.log(boundingRect.top);  // Occasionally the top jerks around a little?
                left = +boundingRect.right - tooltipOffset.right - tooltipWidth;
                const rightEdgeWhenPositionedLeft = +boundingRect.left + tooltipOffset.left + tooltipWidth;
                if ((d3.event.pageX >= left) && (d3.event.pageX > rightEdgeWhenPositionedLeft)) {
                    left = +boundingRect.left + tooltipOffset.left;
                }
                break;
            case 'hover':
                top = d3.event.pageY - tooltipOffset.top;
                left = d3.event.pageX + (-tooltipWidth - tooltipOffset.left);
                break;
            default:  // Same as hover. Would prefer not to have the break above, but lint requires it.
                top = d3.event.pageY - tooltipOffset.top;
                left = d3.event.pageX + (-tooltipWidth - tooltipOffset.left);
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
            if (+tooltipElement.style('opacity') < 0.02) {
                tooltipElement.style('visibility', 'hidden');
            }
        }, showHideDuration * 1.2);
    }

};


module.exports = Tooltip;
