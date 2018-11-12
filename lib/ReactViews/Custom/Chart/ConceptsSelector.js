'use strict';

import Icon from '../../Icon';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Styles from './concepts-selector.scss';
import SummaryConceptModel from '../../../Map/SummaryConcept';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
const ConceptsSelector = createReactClass({
    displayName: 'ConceptsSelector',
    mixins: [ObserveModelMixin],

    propTypes: {
        categories: PropTypes.array,
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
        const displayConcepts = [];

        function getConceptsForCategory(category) {
            function extractDisplayConcepts(concepts) {
                if (!concepts.isVisible || SummaryConceptModel.prototype.isPrototypeOf(concepts)) {
                  return;
                }
                if (concepts.activeItems) {
                    concepts.items.map(extractDisplayConcepts);
                } else {
                    const displayConcept = concepts; // Seems dangerous to modify existing data, but cloning isn't trivial here.
                    displayConcept.parentName = category.categoryName;
                    displayConcepts.push(displayConcept);
                }
            }

            if (category.concepts && category.concepts.length > 0) {
                return category.concepts.forEach(extractDisplayConcepts);
            }
        }
        this.props.categories.forEach(getConceptsForCategory);

        return (<div className={Styles.concepts}>
                      <For each="concept" index="i" of={displayConcepts}>
                        <If condition={concept && concept.isSelectable}>
                                                <button type='button'
                                                        onClick={this.toggleActive.bind(this, concept)}
                                                        className={Styles.btnToggleActive}
                                                        key={concept.parentName + '/' + concept.id}
                                                        title='select variable'>
                                                        {(concept.isActive && this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.checkboxOn}/>}
                                                        {(!concept.isActive && this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.checkboxOff}/>}
                                                        {(concept.isActive && !this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.radioOn}/>}
                                                        {(!concept.isActive && !this.allowMultiple(concept)) && <Icon style={this.getFillStyle(concept)} glyph={Icon.GLYPHS.radioOff}/>}
                                                        <span>{concept.parentName}{' '}{concept.name}</span>
                                                  </button>

                        </If>
                      </For>
                </div>);
    },
});

module.exports = ConceptsSelector;
