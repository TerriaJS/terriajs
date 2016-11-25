'use strict';

// import classNames from 'classnames';
// import ActiveConcept from './ActiveConcept';
import Concept from '../Concept';
import Icon from '../../../Icon.jsx';
import ObserveModelMixin from '../../../ObserveModelMixin';
import React from 'react';
import Styles from './summarised-concept.scss';

const NEW_TEXT = 'New condition';

const OpenConcept = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        rootConcept: React.PropTypes.object.isRequired,
        openConcept: React.PropTypes.object.isRequired
    },

    cancel() {
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
                        <If condition={child.items && child.items.length > 0}>
                            <ActiveConceptParent concept={child} key={i}/>
                        </If>
                        <If condition={!child.items || child.items.length === 0}>
                            <li className={Styles.items}>
                                <Concept concept={child} key={i}/>
                            </li>
                        </If>
                    </For>
                </ul>
            </div>
        );
    }
});

const ActiveConceptParent = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired
    },

    open() {
        this.props.concept.isOpen = true;
        this.props.concept.parent.isOpen = false;
    },

    render() {
        return (
            <li>
                <div className={Styles.btnAddOpen} onClick={this.open}>
                    <div className={Styles.controls}>
                        <Icon glyph={Icon.GLYPHS.closed}/>
                    </div>
                    <div className={Styles.condition}>
                        {this.props.concept.name}
                    </div>
                </div>
            </li>
        );
    }
});

module.exports = OpenConcept;
