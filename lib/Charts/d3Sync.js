"use strict";

const childNodesSelector = function() {
    return this.childNodes;
};

/**
 * Function that synchronises children of a DOM element with javascript array of elements.
 * If you are using D3, you are doing this all the time.
 * Let's make that code more readable by having a common function we call for this purpose.
 */
function d3Sync(parent, arrayData, childElementTagName, updateCallback, transition=undefined)
{
    // remove stray elements
    parent
        .selectAll(childNodesSelector)
        .filter(function() { return this.tagName !== childElementTagName; })
        .remove();
    // synchronise intended elements
    const rows = parent.selectAll(childNodesSelector)
        .data(arrayData);
    rows.exit()
        .remove(); // Note: not transitioning here as the effect is a bit weird.
    if (transition)
    {
        updateCallback(rows.enter()
            .append(childElementTagName)
            .transition(transition), true);
        updateCallback(rows.transition(transition), false);
    }
    else
    {
        updateCallback(rows.enter()
            .append(childElementTagName), true);
        updateCallback(rows, false);
    }
}

module.exports = d3Sync;
