'use strict';

// import classNames from 'classnames';
import AdditiveCondition from './AdditiveCondition';
import AddingCondition from './AddingCondition';
import Icon from '../../../Icon.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import React from 'react';
import Styles from './additive-condition-concepts.scss';

const ADD_TEXT = 'Add new condition';

const AdditiveConditionConcepts = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired
    },

    render() {
        const concept = this.props.concept;
        const activeLeafNodes = concept.leafNodes.filter(concept => concept.isActive);
        const activeLeafNodesByParent = getNodesByParent(activeLeafNodes);
        const isAddingNewCondition = concept.isAnyOpenBeforeLastParents();
        return (
            <div className={Styles.root}>
                <div className={Styles.title}>{concept.name}:</div>
                <For each="group" index="i" of={activeLeafNodesByParent}>
                    <AdditiveCondition key={i} rootConcept={concept} activeLeafNodesWithParent={group}/>
                </For>
                <If condition={isAddingNewCondition}>
                    <AddingCondition rootConcept={concept}/>
                </If>
                <If condition={!isAddingNewCondition}>
                    <AddNewCondition rootConcept={concept}/>
                </If>
            </div>
        );
    }
});

/**
 * Returns an array which groups all the nodes with the same parent id into one.
 * @param  {Concept[]} nodes [description]
 * @return {Object[]} An array of {parent: Concept, children: Concept[]} objects.
 * @private
 */
function getNodesByParent(nodes) {
    const results = {};
    nodes.forEach(node => {
        if (!results[node.parent.id]) {
            results[node.parent.id] = {parent: node.parent, children: []};
        }
        results[node.parent.id].children.push(node);
    });
    return Object.keys(results).map(key => results[key]);
}

const AddNewCondition = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        rootConcept: React.PropTypes.object.isRequired
    },

    addNew() {
        this.props.rootConcept.isOpen = true;
    },

    render() {
        return (
            <div className={Styles.section}>
                <button onClick={this.addNew} className={Styles.btnAddNew}>
                    <Icon glyph={Icon.GLYPHS.add}/>
                    <span className={Styles.text}>{ADD_TEXT}</span>
                </button>
            </div>
        );
    }
});

module.exports = AdditiveConditionConcepts;

