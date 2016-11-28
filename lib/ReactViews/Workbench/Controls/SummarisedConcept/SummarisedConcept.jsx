'use strict';

// import classNames from 'classnames';
import ActiveConcept from './ActiveConcept';
import OpenInactiveConcept from './OpenInactiveConcept';
import Icon from '../../../Icon.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import React from 'react';
import Styles from './summarised-concept.scss';

const ADD_FIRST_TEXT = 'Add a condition';
const ADD_MORE_TEXT = 'Add new condition';

/*
 * SummarisedConcept displays all the active and open nodes under a given
 * SummaryConcept.
 * Parents containing 1 or more active nodes are shown via <./ActiveConcept>.
 *    (They may be open or closed, and ActiveConcept handles the difference.)
 * Open nodes not containing any active nodes are shown via <./OpenInactiveConcept>.
 *    (This is typically the case when a user has pressed the AddButton but yet to
 *    activate any leaf nodes.)
 * If summaryConcept.allowMultiple is true, then an <./AddButton> is also shown,
 *    which simply opens the root concept, at which point OpenInactiveConcept takes over.
 *
 * This design would need revision to handle concepts whose direct children are a mix of
 * both leaf nodes and parent nodes.
 *
 * This component cheekily uses the active concepts' isActive flag -
 * which is by rights the boolean true - to instead store an integer (>0) giving
 * the display order of the concepts. Since javascript identifies integers > 0 as truthy,
 * no one else should notice this trick.
 * (The other alternative would be to add a new property to VariableConcept.)
 */
const SummarisedConcept = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired,  // Must be a SummaryConcept.
        isLoading: React.PropTypes.bool
    },

    render() {
        const concept = this.props.concept;
        const activeLeafNodes = concept.leafNodes.filter(concept => concept.isActive);
        const activeLeafNodesByParent = groupAndSortByParent(activeLeafNodes);
        const openParentsWithoutParentsOfActive = concept.getOpenParentsWithoutParentsOfActive();
        const isLoading = this.props.isLoading;
        return (
            <div className={Styles.root}>
                <div className={Styles.title}>{concept.name}:</div>
                <For each="group" index="i" of={activeLeafNodesByParent}>
                    <ActiveConcept key={i} rootConcept={concept} activeLeafNodesWithParent={group} isLoading={isLoading}/>
                </For>
                <If condition={activeLeafNodesByParent.length === 0}>
                    <div className={Styles.noConditions}>
                        None
                    </div>
                </If>
                <If condition={openParentsWithoutParentsOfActive.length > 0 && !isLoading}>
                    <OpenInactiveConcept rootConcept={concept} openInactiveConcept={openParentsWithoutParentsOfActive[0]}/>
                </If>
                <If condition={concept.allowMultiple && openParentsWithoutParentsOfActive.length === 0}>
                    <AddButton rootConcept={concept} numberOfExisting={activeLeafNodesByParent.length}/>
                </If>
            </div>
        );
    }
});

/**
 * Returns an array which groups all the nodes with the same parent id into one.
 * Cheekily sorts by the active concepts' isActive value - which is normally a boolean - if the first one isn't a boolean.
 * We do this so when you add a new condition (which starts out in <OpenInactiveConcept>, under all the active concepts),
 * it doesn't suddenly change position when you select your first concept (at which point it shows in <ActiveConcept>).
 * @param  {Concept[]} nodes [description]
 * @return {Object[]} An array of {parent: Concept, children: Concept[]} objects.
 * @private
 */
function groupAndSortByParent(nodes) {
    const nodesByParent = groupByParentId(nodes, parent => parent.id);
    if (nodesByParent.length > 0 && nodesByParent[0].children[0].isActive !== true) {
        nodesByParent.sort((a, b) => a.children[0].isActive - b.children[0].isActive);
    }
    return nodesByParent;
}

/**
 * Returns an array which groups all the nodes with the same parent id into separate sub-arrays.
 * @param  {Object[]} nodes An array of objects with a 'parent' property.
 * @param  {groupByParentId~idFunction} idFunction A function which gets the id of a parent.
 * @return {Object[]} An array of objects with keys parent, children.
 * @private
 */
function groupByParentId(nodes, idFunction) {
    const results = {};
    nodes.forEach(node => {
        const id = idFunction(node.parent);
        if (!results[id]) {
            results[id] = {parent: node.parent, children: []};
        }
        results[id].children.push(node);
    });
    return Object.keys(results).map(key => results[key]);
}

/**
* Function that is called to find the id of a parent.
* Eg. parent => parent.id.
* @callback groupByParentId~idFunction
* @param  {Object} parent A parent.
* @return {String} The parent id.
*/

const AddButton = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        rootConcept: React.PropTypes.object.isRequired,
        numberOfExisting: React.PropTypes.bool
    },

    addNew() {
        this.props.rootConcept.closeDescendants();
        this.props.rootConcept.isOpen = true;
    },

    render() {
        const addText = (this.props.numberOfExisting > 0) ? ADD_MORE_TEXT : ADD_FIRST_TEXT;
        return (
            <div className={Styles.section}>
                <button onClick={this.addNew} className={Styles.btnAddNew}>
                    <Icon glyph={Icon.GLYPHS.add}/>
                    <span className={Styles.text}>{addText}</span>
                </button>
            </div>
        );
    }
});

module.exports = SummarisedConcept;

