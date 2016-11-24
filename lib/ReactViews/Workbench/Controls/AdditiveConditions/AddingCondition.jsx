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
        rootConcept: React.PropTypes.object.isRequired,
        openConcept: React.PropTypes.object.isRequired,
    },

    cancel() {
        this.props.openConcept.isOpen = false;
    },

    open() {
        this.props.openConcept.items[0].isOpen = true;
        this.props.openConcept.isOpen = false;
    },

    back() {
        this.props.openConcept.isOpen = false;
        this.props.openConcept.parent.isOpen = true;
    },

    render() {
        return (
            <div className={Styles.section}>
                <div className={Styles.controls}>
                    <button className={Styles.btnClose} onClick={this.cancel}>
                        Cancel
                    </button>
                </div>
                <div className={Styles.heading}>
                    <If condition={this.props.rootConcept !== this.props.openConcept}>
                        <button className={Styles.btnBack} onClick={this.back}>
                            <Icon glyph={Icon.GLYPHS.left}/>
                        </button>
                        <div className={Styles.indented}>
                            {this.props.openConcept.name}
                        </div>
                    </If>
                    <If condition={this.props.rootConcept === this.props.openConcept}>
                        {NEW_TEXT}
                    </If>
                </div>
                <ul className={Styles.childrenList}>
                    <For each="child" index="i" of={this.props.openConcept.items}>
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
        );
    }
});

function getOpenConcept(concept) {

}

module.exports = AddingCondition;
