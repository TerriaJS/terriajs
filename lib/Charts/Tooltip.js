"use strict";

import { nest as d3Nest } from "d3-collection";
import {
  select as d3Select,
  event as d3Event,
  clientPoint as d3ClientPoint
} from "d3-selection";
import { transition as d3Transition } from "d3-transition"; // eslint-disable-line no-unused-vars

import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";

import dateformat from "dateformat";

const defaultTooltipOffset = {
  // The meaning of these offsets depend on the alignment.
  top: 10,
  right: 10,
  bottom: 10,
  left: 10
};
const defaultClassName = "base-chart-tooltip";
const defaultId = "base-chart-tooltip-id";
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
    return d3Select("#" + Tooltip.id(tooltipSettings));
  },

  create(container, tooltipSettings) {
    // Make the tooltip DOM element, invisible to start.
    if (defined(tooltipSettings)) {
      container
        .append("div")
        .attr("id", Tooltip.id(tooltipSettings))
        .attr(
          "class",
          defaultValue(tooltipSettings.className, defaultClassName)
        )
        .style("opacity", 1e-6)
        .style("position", "absolute")
        .style("display", "none");
    }
  },

  destroy(tooltipSettings) {
    // Remove the tooltip DOM element.
    if (defined(tooltipSettings)) {
      const id = Tooltip.id(tooltipSettings);
      const tooltipElement = d3Select("#" + id).nodes();
      if (tooltipElement) {
        d3Select("#" + id).remove();
        //NOTE:  why not remove it directly like above?
        // tooltipElement.parentElement.removeChild(tooltipElement);
      }
    }
  },

  singleRowHtml(color, name, value, units) {
    if (value === null) return;
    const styleAttribute = defined(color)
      ? 'style="background-color: ' + color + '" '
      : "";

    const formattedVal = isNaN(value) ? value : value.toFixed(2);

    return `<tr class="dataRow">
      <td class="dataIcon">
        <span class="color" ${styleAttribute}></span>
      </td>
      <td class="dataVal">
        <span class="name">${name}</span>
      </td>
      <td class="value">
        ${formattedVal}
        <span class="units">${units || ""}</span>
      </td>
    </tr>`;
  },

  html(selectedData, xLocation) {
    let html;
    const readableX =
      typeof xLocation.getMonth === "function"
        ? dateformat(xLocation, "dd/mm/yyyy, HH:MMTT")
        : xLocation;
    html = '<p class="x-value">' + readableX + "</p>";

    // If there is only one line showing, then label it with the category name, not the column name.
    // Else, if there is only one column name (shared by all the categories), show the category names
    //     and don't show the column name.
    // Else, if there is only one category name, then there is no need to show it.
    // In general, show both, grouped by category name.

    // If there is only a moment dataset it's x values (a date will be shown)
    if (
      selectedData.length === 1 &&
      (selectedData[0].type === "moment" ||
        selectedData[0].type === "momentPoints")
    ) {
      return html;
    } else if (selectedData.length === 1) {
      const onlyLine = selectedData[0];
      html += '<p class="category-name">' + onlyLine.categoryName + "</p>";
      html += "<tbody><table>";
      html += this.singleRowHtml(
        onlyLine.color,
        `${onlyLine.name}`,
        onlyLine.type === "moment" || onlyLine.type === "momentPoints"
          ? readableX
          : onlyLine.point.y,
        onlyLine.units
      );
      html += "</tbody></table>";
      return html;
    }

    // The next line turns [chartData1A, chartData2, chartData1B] into
    // [{key: 'categoryName1', values: [chartData1A, chartData1B]}, {key: 'categoryName2', values: [chartData2]}].
    const dataGroupedByCategory = d3Nest()
      .key(d => d.categoryName)
      .entries(selectedData);
    // And similarly for the column names.
    // const dataGroupedByName = d3Nest()
    //   .key(d => d.name)
    //   .entries(selectedData);

    // if (dataGroupedByName.length === 1) {
    //   // All lines have the same name.
    //   html += '<table class="mouseover"><tbody>';
    //   dataGroupedByName[0].values.forEach(line => {
    //     html += this.singleRowHtml(
    //       line.color,
    //       line.categoryName,
    //       line.point.y,
    //       line.units
    //     );
    //   });
    //   html += "</tbody></table>";
    //   return html;
    // }

    dataGroupedByCategory.forEach(group => {
      if (
        group.values[0].type === "moment" ||
        group.values[0].type === "momentPoints"
      ) {
        return;
      }
      // if (dataGroupedByCategory.length > 1) {
      //   html += '<p class="category-name">' + group.key + "</p>";
      // }
      html += '<p class="category-name">' + group.key + "</p>";
      html += '<table class="mouseover categoryTable"><tbody>';
      group.values.forEach(line => {
        html += this.singleRowHtml(
          line.color,
          line.name,
          line.point.y,
          line.units
        );
      });
      html += "</tbody></table>";
    });
    return html;
  },

  show(html, tooltipElement, tooltipSettings, boundingRect) {
    tooltipElement
      .html(html)
      .style("display", "block")
      .transition()
      .duration(showHideDuration)
      .style("opacity", 1)
      .style("max-width", "300px")
      .style("visibility", "visible");

    const tooltipWidth = +tooltipElement.nodes()[0].offsetWidth;
    const tooltipOffset = defaultValue(
      tooltipSettings.offset,
      defaultTooltipOffset
    );
    let top, left, right;

    const clientPos = d3ClientPoint(tooltipElement.node().parentNode, d3Event);
    const clientX = clientPos[0];
    const clientY = clientPos[1];

    switch (tooltipSettings.align) {
      case "left":
        top = tooltipOffset.top;
        left = tooltipOffset.left;
        break;
      case "right":
        top = tooltipOffset.top;
        right = tooltipOffset.right;
        break;
      case "prefer-right": {
        // Only show on the left if we would be under the tooltip on the right, but not on the left.
        top = tooltipOffset.top;
        const leftEdgeWhenPositionedRight =
          boundingRect.width - tooltipOffset.right - tooltipWidth;
        const rightEdgeWhenPositionedLeft = tooltipOffset.left + tooltipWidth;
        if (
          clientX >= leftEdgeWhenPositionedRight &&
          clientX > rightEdgeWhenPositionedLeft
        ) {
          left = tooltipOffset.left;
        } else {
          right = tooltipOffset.right;
        }
        break;
      }
      case "hover":
      default:
        top = d3Event.clientY - tooltipOffset.top;
        left = d3Event.clientX + (-tooltipWidth - tooltipOffset.left);
        break;
    }

    const tooltipHeight = tooltipElement.node().offsetHeight;

    const possibleYClash = clientY < tooltipHeight + tooltipOffset.top;
    if (possibleYClash) {
      tooltipElement.style("bottom", "60px");
      tooltipElement.style("top", null);
    } else {
      tooltipElement.style("top", top + "px");
      tooltipElement.style("bottom", null);
    }

    if (left !== undefined) {
      tooltipElement.style("left", left + "px");
    } else {
      tooltipElement.style("left", "auto");
    }
    if (right !== undefined) {
      tooltipElement.style("right", right + "px");
    } else {
      tooltipElement.style("right", "auto");
    }
  },

  hide(tooltipElement) {
    tooltipElement
      .transition()
      .duration(showHideDuration)
      .style("opacity", 1e-6);
    // visibility hidden cannot transition, and it is too flashy if you use it without.
    // We need it because opacity=0 along can get in front of other elements and prevent the hover from working at all.
    // So delay it until (and only if) the opacity has already done its job.
    setTimeout(function() {
      if (+tooltipElement.style("opacity") < 0.002) {
        tooltipElement.style("visibility", "hidden");
      }
    }, showHideDuration * 1.2);
  }
};

module.exports = Tooltip;
