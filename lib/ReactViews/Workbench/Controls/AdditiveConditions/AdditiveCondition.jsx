'use strict';

import classNames from 'classnames';
import Concept from '../Concept';
import Icon from '../../../Icon.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import React from 'react';
import Styles from './additive-condition-concepts.scss';

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
                <div className={classNames({[Styles.btnOpen]: !activeLeafNodesWithParent.parent.isOpen})} onClick={this.open}>
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
                                Close
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
                        <ul className={Styles.childrenList}>
                            <Concept hideName={true} concept={activeLeafNodesWithParent.parent}/>
                        </ul>
                    </If>
                </div>
            </div>
        );
    }
});

module.exports = AdditiveCondition;