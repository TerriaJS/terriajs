'use strict';

// import classNames from 'classnames';
import ActiveConcept from './ActiveConcept';
import OpenConcept from './OpenConcept';
import Icon from '../../../Icon.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import React from 'react';
import Styles from './summarised-concept.scss';

const ADD_TEXT = 'Add new condition';

/*
 * SummarisedConcept displays all the active and open nodes under a given
 * SummaryConcept.
 * Active nodes are shown via <./ActiveConcept>.
 * Open nodes where a user has are shown via <./OpenConcept>.
 * If summaryConcept.allowMultiple is true, then an <./AddButton> is also shown.
 */
const SummarisedConcept = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired  // Must be a SummaryConcept.
    },

    render() {
        const concept = this.props.concept;
        const activeLeafNodes = concept.leafNodes.filter(concept => concept.isActive);
        const activeLeafNodesByParent = getNodesByParent(activeLeafNodes);
        const openParentsWithoutParentsOfActive = concept.getOpenParentsWithoutParentsOfActive();
        return (
            <div className={Styles.root}>
                <div className={Styles.title}>{concept.name}:</div>
                <For each="group" index="i" of={activeLeafNodesByParent}>
                    <ActiveConcept key={i} rootConcept={concept} activeLeafNodesWithParent={group}/>
                </For>
                <If condition={openParentsWithoutParentsOfActive.length > 0}>
                    <OpenConcept rootConcept={concept} openConcept={openParentsWithoutParentsOfActive[0]}/>
                </If>
                <If condition={openParentsWithoutParentsOfActive.length === 0}>
                    <AddButton rootConcept={concept}/>
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

const AddButton = React.createClass({
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

module.exports = SummarisedConcept;

