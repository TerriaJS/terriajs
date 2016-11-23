'use strict';

// import classNames from 'classnames';
import Icon from "../../Icon.jsx";
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './additive-condition-concepts.scss';

const AdditiveConditionConcepts = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    render() {
        const concept = this.props.concept;
        const activeLeafNodes = concept.leafNodes.filter(concept => concept.isActive);
        const activeLeafNodesByParent = getNodesByParent(activeLeafNodes);
        return (
            <div className={Styles.root}>
                <For each="group" index="i" of={activeLeafNodesByParent}>
                    <AdditiveCondition key={i} activeLeafNodesWithParent={group} viewState={this.props.viewState}/>
                </For>
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

const AdditiveCondition = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        activeLeafNodesWithParent: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    openConcept() {
        console.log('choosing', this);
    },

    remove(event) {
        event.stopPropagation();
        const activeLeafNodesWithParent = this.props.activeLeafNodesWithParent;
        // The parent must be a DisplayVariablesConcept, so it has a toggleActiveItem method.
        // This method de-activates all items other than the one passed in. We pass null here, so it deactivates all its items.
        // TODO: this triggers a change in active items - and hence a load - for each one. Urg!
        activeLeafNodesWithParent.parent.toggleActiveItem(null);
    },

    render() {
        const activeLeafNodesWithParent = this.props.activeLeafNodesWithParent;
        return (
            <div onClick={this.openConcept} className={Styles.btnOpen}>
                <div className={Styles.section}>
                    <div className={Styles.controls}>
                        <button className={Styles.btnClose} onClick={this.remove} title='remove condition'>
                            <Icon glyph={Icon.GLYPHS.close}/>
                        </button>
                    </div>
                    <div className={Styles.heading}>
                        {activeLeafNodesWithParent.parent.name}
                    </div>
                    <For each="child" index="j" of={activeLeafNodesWithParent.children}>
                        <div className={Styles.condition} key={j}>
                            {child.name}
                        </div>
                    </For>
                </div>
            </div>
        );
    }
});

module.exports = AdditiveConditionConcepts;

