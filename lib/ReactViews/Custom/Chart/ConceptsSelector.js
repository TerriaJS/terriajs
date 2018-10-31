'use strict';

import Icon from '../../Icon';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Styles from './concepts-selector.scss';
import getConceptsForCategory from '../../../Models/getConceptsForCategory';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
// render flattened concepts ui
const ConceptsSelector = createReactClass({
    displayName: 'ConceptsSelector',
    mixins: [ObserveModelMixin],

    propTypes: {
        concepts: PropTypes.array,
    },

    toggleActive(concept) {
          concept.toggleActive();
    },

    getFillStyle(concept) {
      return {
        fill: defaultValue(concept.color, '#ffffff')
      };
    },

    allowMultiple(concept) {
      return concept.parent && concept.parent.allowMultiple;
    },

    render() {
        const displayConcepts = getConceptsForCategory(this.props.concepts);

        return (<div className={Styles.concepts}>
                      <For each="concept" index="i" of={displayConcepts}>
                        <If condition={concept && concept.isSelectable}>
                                                <button type='button'
                                                        onClick={this.toggleActive.bind(this, concept)}
                                                        className={Styles.btnToggleActive}
                                                        key={`${concept.categoryName}-${concept.id}`}
                                                        title='select variable'>
                                                        {(concept.isActive && this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.checkboxOn}/>}
                                                        {(!concept.isActive && this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.checkboxOff}/>}
                                                        {(concept.isActive && !this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.radioOn}/>}
                                                        {(!concept.isActive && !this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.radioOff}/>}
                                                        <span>{concept.categoryName} {' '} {concept.name}</span>
                                                  </button>

                        </If>
                      </For>
                </div>);
    },
});

module.exports = ConceptsSelector;
