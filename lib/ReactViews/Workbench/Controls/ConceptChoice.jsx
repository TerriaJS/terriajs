'use strict';

// import classNames from 'classnames';
// import Icon from "../../Icon.jsx";
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './concept-choice.scss';

const ConceptChoice = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    openConceptChooser() {
        console.log('choosing');
    },

    render() {
        const concept = this.props.concept;
        const activeLeafNodes = concept.leafNodes.filter(concept => concept.isActive);
        const activeLeafNodesByParent = getNodesByParent(activeLeafNodes);
        return (
            <div className={Styles.root}>
                <For each="group" index="i" of={activeLeafNodesByParent}>
                    <button type="button"
                            onClick={this.openConceptChooser}
                            className={Styles.btnConceptChoiceHeading}>
                        {group.parent.name}
                    </button>
                    <For each="child" index="j" of={group.children}>
                        <button type='button'
                                onClick={this.openConceptChooser}
                                className={Styles.btnConceptChoice}>
                            {child.name}
                        </button>
                    </For>
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

module.exports = ConceptChoice;

