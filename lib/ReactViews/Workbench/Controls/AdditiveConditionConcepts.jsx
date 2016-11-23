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

    openConcept(event) {
        console.log('choosing', event);
    },

    remove(event) {
        console.log('removing', event);
        event.stopPropagation();
    },

    render() {
        const concept = this.props.concept;
        const activeLeafNodes = concept.leafNodes.filter(concept => concept.isActive);
        const activeLeafNodesByParent = getNodesByParent(activeLeafNodes);
        return (
            <div className={Styles.root}>
                <For each="group" index="i" of={activeLeafNodesByParent}>
                    <div key={i} onClick={this.openConcept}
                         className={Styles.btnOpen}>
                        <div className={Styles.section}>
                            <div className={Styles.controls}>
                                <button className={Styles.btnClose} onClick={this.remove} title='remove condition'>
                                    <Icon glyph={Icon.GLYPHS.close}/>
                                </button>
                            </div>
                            <div className={Styles.heading}>
                                {group.parent.name}
                            </div>
                            <For each="child" index="j" of={group.children}>
                                <div className={Styles.condition} key={j}>
                                    {child.name}
                                </div>
                            </For>
                        </div>
                    </div>
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

module.exports = AdditiveConditionConcepts;

