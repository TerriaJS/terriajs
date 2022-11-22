"use strict";

const childNodesSelector = function () {
  return this.childNodes;
};

/**
 * Convenience wrapper that manages D3's enter/exit mechanics to synchronise an array of data
 * with DOM elements.
 * @param {Element} parent HTML element which will contain the nodes
 * @param {Object[]} arrayData Data to be synchronised.
 * @param {String} childElementTagName Name of HTML element to be created for each data point.
 * @param {Function} updateCallBack Function called with (d3object, isNewElement). If it returns the d3object,
 *      an opacity transition will be applied.
 * @param {Boolean} transition Parameter passed to d3.transition().
 */
function d3Sync(
  parent,
  arrayData,
  childElementTagName,
  updateCallback,
  transition = null
) {
  // move stray elements that are not 'childElementTagName' to the bottom
  // that way they can be removed with the fade out animation
  parent
    .selectAll(childNodesSelector)
    .filter((d, i, nodes) => nodes[i].tagName !== childElementTagName)
    .each(function () {
      this.parentElement.appendChild(this);
    });
  // synchronise intended elements
  const existing = parent
    .selectAll(childNodesSelector)
    .data(arrayData, function (d) {
      return d ? d.id || d : this.id;
    }); // id hack for ChartData objects which get re-created each time there are any changes
  const enter = existing.enter().append(childElementTagName);
  const exit = existing.exit();
  if (transition) {
    exit.transition(transition).style("opacity", 1e-2).remove();
    const entered = updateCallback(enter, true);
    if (entered) {
      // We don't want to randomly transition all attributes on new elements, because it looks bad.
      // Instead, let's just transition opacity.
      entered.style("opacity", 0).transition(transition).style("opacity", 1);
    }
    updateCallback(existing.transition(transition).style("opacity", 1), false);
  } else {
    exit.remove();
    updateCallback(enter, true);
    updateCallback(existing, false);
  }
}

module.exports = d3Sync;
