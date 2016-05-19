'use strict';

import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import classNames from 'classnames';

import Styles from './concept-viewer.scss';

const ConceptViewer = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    render() {
        return (
            <div className={Styles.root}>
                <For each="concept" index="i"
                     of={this.props.nowViewingItem.concepts.filter(concept => concept.isVisible)}>
                    <div className={Styles.inner} key={i}>
                        <ul className={Styles.childrenList}>
                            <Concept concept={concept}/>
                        </ul>
                    </div>
                </For>
            </div>
        );
    }
});

const Concept = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired,
        allowMultiple: React.PropTypes.bool
    },

    toggleOpen() {
        this.props.concept.toggleOpen();
    },

    toggleActive() {
        this.props.concept.toggleActive();
    },

    getColorStyle() {
        if (this.props.concept.color) {
            return {color: this.props.concept.color};
        }
    },

    render() {
        const concept = this.props.concept;

        return (
            <li className={classNames({[Styles.isOpen]: concept.isOpen})}
                style={this.getColorStyle()}>
                <If condition={concept.name}>
                    <div className={classNames(Styles.header, {[Styles.hasChildren]: concept.hasChildren})}>
                        <If condition={concept.hasChildren}>
                            <button type='button'
                                    onClick={this.toggleOpen}
                                    style={this.getColorStyle()}
                                    className={classNames(Styles.btn, Styles.btnToggle, {[Styles.btnIsOpen]: concept.isOpen})}
                                    title='open variable selection'
                            />
                        </If>
                        <If condition={concept.isSelectable}>
                            <button type='button'
                                    onClick={this.toggleActive}
                                    style={this.getColorStyle()}
                                    className={classNames(
                                        Styles.btn,
                                        {
                                            [Styles.btnMultipleActive]: concept.isActive && this.props.allowMultiple,
                                            [Styles.btnMultipleInactive]: !concept.isActive && this.props.allowMultiple,
                                            [Styles.btnUniqueActive]: concept.isActive && !this.props.allowMultiple,
                                            [Styles.btnUniqueInactive]: !concept.isActive && !this.props.allowMultiple,
                                        }
                                    )}
                                    title='select variable'
                            />
                        </If>
                        {concept.name}
                    </div>
                </If>
                <If condition={concept.isOpen}>
                    <ul className={Styles.items}>
                        <For each="child" index="i" of={concept.items.filter(concept => concept.isVisible)}>
                            <Concept key={i} concept={child} allowMultiple={concept.allowMultiple}/>
                        </For>
                    </ul>
                </If>
            </li>
        );
    }
});

module.exports = ConceptViewer;
