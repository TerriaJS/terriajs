'use strict';

import AdditiveConditionConcept from "./AdditiveConditionConcept";
import classNames from 'classnames';
import Icon from "../../Icon";
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './concept-viewer.scss';

const ConceptViewer = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object
    },

    render() {
        // All non-additive-conditions go in a single section. (If there are none, don't show a <div class=section> so we don't get an extra padding.)
        // Each additive-condition goes in its own section.
        const nonAdditiveConditionConcepts = this.props.item.concepts.filter(concept => concept.isVisible && concept.displayType !== 'additive-condition');
        return (
            <div className={Styles.root}>
                <If condition={nonAdditiveConditionConcepts.length > 0}>
                    <div className={Styles.section}>
                        <For each="concept" index="i"
                             of={nonAdditiveConditionConcepts}>
                            <div className={Styles.inner} key={i}>
                                <ul className={Styles.childrenList}>
                                    <Concept concept={concept} allowMultiple={concept.allowMultiple} viewState={this.props.viewState}/>
                                </ul>
                            </div>
                        </For>
                    </div>
                </If>
                <For each="concept" index="i"
                     of={this.props.item.concepts.filter(concept => concept.isVisible && concept.displayType === 'additive-condition')}>
                    <div className={Styles.section} key={i}>
                        <ul className={Styles.childrenList}>
                            <AdditiveConditionConcept concept={concept} viewState={this.props.viewState}/>
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
        allowMultiple: React.PropTypes.bool,
        viewState: React.PropTypes.object
    },

    toggleOpen() {
        this.props.concept.toggleOpen();
    },

    toggleActive() {
        this.props.concept.toggleActive();
    },

    openConceptChooser() {
        this.props.viewState.conceptChooserIsVisible = true;
    },

    getColorStyle() {
        if (this.props.concept.color) {
            return {color: this.props.concept.color};
        }
    },

    getFillStyle() {
        if (this.props.concept.color) {
            return {fill: this.props.concept.color};
        }
    },

    render() {
        const concept = this.props.concept;
        // Renders the concept as a standard list of radio buttons or checkboxes (ie. not as an additive-condition).
        return (
            <li style={this.getColorStyle()}>
                <If condition={!concept.displayType}>
                    <If condition={concept.name}>
                        <div className={classNames(Styles.header, {[Styles.hasChildren]: concept.hasChildren, [Styles.isSelectable]: concept.isSelectable})}>
                            <div className={Styles.btnGroup}>
                                <If condition={concept.hasChildren}>
                                    <button type='button'
                                            onClick={this.toggleOpen}
                                            style={this.getColorStyle()}
                                            className={Styles.btnToggleOpen}
                                            title='open variable selection'>
                                            {concept.isOpen ? <Icon glyph={Icon.GLYPHS.showLess}/> : <Icon glyph={Icon.GLYPHS.showMore}/>}
                                    </button>
                                </If>
                                <If condition={concept.isSelectable}>
                                    <button type='button'
                                            onClick={this.toggleActive}
                                            style={this.getColorStyle()}
                                            className={Styles.btnToggleActive}
                                            title='select variable'>
                                            {(concept.isActive && this.props.allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.checkboxOn}/>}
                                            {(!concept.isActive && this.props.allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.checkboxOff}/>}
                                            {(concept.isActive && !this.props.allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.radioOn}/>}
                                            {(!concept.isActive && !this.props.allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.radioOff}/>}
                                    </button>
                                </If>
                            </div>
                            {concept.name}
                        </div>
                    </If>
                </If>
                <If condition={concept.isOpen}>
                    <ul className={Styles.items}>
                        <For each="child" index="i" of={concept.items.filter(concept => concept.isVisible)}>
                            <Concept key={i} concept={child} allowMultiple={concept.allowMultiple} viewState={this.props.viewState}/>
                        </For>
                    </ul>
                </If>
            </li>
        );
    }
});

module.exports = ConceptViewer;
