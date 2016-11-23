'use strict';

// import classNames from 'classnames';
import Concept from './Concept';
import Icon from '../../Icon.jsx';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './additive-condition-concepts.scss';

const ADD_TEXT = 'Add new condition';
const NEW_TEXT = 'New condition';

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

const AdditiveCondition = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        activeLeafNodesWithParent: React.PropTypes.object.isRequired,
        rootConcept: React.PropTypes.object.isRequired
    },

    open() {
        // Close all others.
        this.props.rootConcept.closeDescendants();
        // And open this one's parent.
        this.props.activeLeafNodesWithParent.parent.isOpen = true;
    },

    close(event) {
        event.stopPropagation();
        this.props.activeLeafNodesWithParent.parent.isOpen = false;
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
            <div className={Styles.section}>
                <div className={Styles.btnOpen} onClick={this.open}>
                    <div className={Styles.controls}>
                        <If condition={!activeLeafNodesWithParent.parent.isOpen}>
                            <button className={Styles.btnEdit} title='Edit condition'>
                                <Icon glyph={Icon.GLYPHS.settings}/>
                            </button>
                            <button className={Styles.btnRemove} onClick={this.remove} title='Remove condition'>
                                <Icon glyph={Icon.GLYPHS.close}/>
                            </button>
                        </If>
                        <If condition={activeLeafNodesWithParent.parent.isOpen}>
                            <button className={Styles.btnClose} onClick={this.close}>
                                Cancel
                            </button>
                        </If>
                    </div>
                    <div className={Styles.heading}>
                        {activeLeafNodesWithParent.parent.name}
                    </div>
                    <If condition={!activeLeafNodesWithParent.parent.isOpen}>
                        <For each="child" index="j" of={activeLeafNodesWithParent.children}>
                            <div className={Styles.condition} key={j}>
                                {child.name}
                            </div>
                        </For>
                    </If>
                    <If condition={activeLeafNodesWithParent.parent.isOpen}>
                        <div className={Styles.inner}>
                            <ul className={Styles.childrenList}>
                                <Concept hideName={true} concept={activeLeafNodesWithParent.parent}/>
                            </ul>
                        </div>
                    </If>
                </div>
            </div>
        );
    }
});

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

const AddingCondition = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        rootConcept: React.PropTypes.object.isRequired
    },

    close() {
        this.props.rootConcept.isOpen = false;
    },

    open() {
        console.log('add open');
    },

    render() {
        return (
            <div className={Styles.section}>
                <div className={Styles.adding}>
                    <div className={Styles.controls}>
                        <button className={Styles.btnClose} onClick={this.close}>
                            Cancel
                        </button>
                    </div>
                    <div className={Styles.heading}>
                        {NEW_TEXT}
                    </div>
                    <div className={Styles.inner}>
                        <ul className={Styles.childrenList}>
                            <For each="child" index="i" of={this.props.rootConcept.items}>
                                <li key={i}>
                                    <div className={Styles.controls}>
                                        <button className={Styles.btnAddOpen} onClick={this.open}>
                                            <Icon glyph={Icon.GLYPHS.closed}/>
                                        </button>
                                    </div>
                                    <div className={Styles.condition}>
                                        {child.name}
                                    </div>
                                </li>
                            </For>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
});
module.exports = AdditiveConditionConcepts;

