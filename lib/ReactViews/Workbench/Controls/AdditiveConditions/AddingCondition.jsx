'use strict';

// import classNames from 'classnames';
import AdditiveCondition from './AdditiveCondition';
import Icon from '../../../Icon.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import React from 'react';
import Styles from './additive-condition-concepts.scss';

const NEW_TEXT = 'New condition';

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
                                <div className={Styles.btnAddOpen} onClick={this.open}>
                                    <div className={Styles.controls}>
                                        <Icon glyph={Icon.GLYPHS.closed}/>
                                    </div>
                                    <div className={Styles.condition}>
                                        {child.name}
                                    </div>
                                </div>
                            </li>
                        </For>
                    </ul>
                </div>
            </div>
        );
    }
});

module.exports = AddingCondition;
