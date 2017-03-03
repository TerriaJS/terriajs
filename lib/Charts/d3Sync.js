"use strict";

const childNodesSelector = function() {
    return this.childNodes;
};

/**
 * Function that synchronises children of a DOM element with javascript array of elements.
 * If you are using D3, you are doing this all the time.
 * E.g. selection.data().enter()/selection.data().exit()/data.transition() etc.
 * Let's make that code more readable by having a common function we call for this purpose.
 */
function d3Sync(parent, arrayData, childElementTagName, updateCallback, transition=null) {
    // move stray elements that are not 'childElementTagName' to the bottom
    // that way they can be removed with the fade out animation
    parent
        .selectAll(childNodesSelector)
        .filter(function(data, dataIndex) {
            return this.tagName !== childElementTagName;
        }).each(function(){
            this.parentElement.appendChild(this);
        });
    // synchronise intended elements
    const existing = parent.selectAll(childNodesSelector)
        .data(arrayData, function(d) {
        // id hack for ChartData objects which get re-created each time there are any changes
        if (d) {
            return d.id || d;
        } else {
            return this.id;
        }
    });
    const enter = existing.enter().append(childElementTagName);
    const exit = existing.exit();
    if (transition) {
        exit.transition(transition).style('opacity', 1e-2).remove();
        updateCallback(enter.transition(transition), true);
        updateCallback(existing.transition(transition).style('opacity', 1), false);
    } else {
        exit.remove();
        updateCallback(enter, true);
        updateCallback(existing, false);
    }
}

module.exports = d3Sync;
