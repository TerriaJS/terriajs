'use strict';

import Icon from '../../Icon';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Styles from './concepts-selector.scss';
import SummaryConceptModel from '../../../Map/SummaryConcept';
import defined from 'terriajs-cesium/Source/Core/defined';

// render flattened concepts ui
const ConceptsSelector = createReactClass({
    displayName: 'ConceptsSelector',
    mixins: [ObserveModelMixin],

    propTypes: {
        data: PropTypes.array,
    },

    toggleActive(concept) {
          concept.toggleActive();
    },

    getFillStyle(concept) {
        if (concept.color) {
            return {fill: concept.color};
        } else {
            return {fill: '#ffffff'};
        }
    },

    allowMultiple(concept) {
      return concept.parent && concept.parent.allowMultiple;
    },

    extractConcepts(concept, parentName) {
      if(concept.isVisible && !SummaryConceptModel.prototype.isPrototypeOf(concept)) {
        if(concept.activeItems) {
          return concept.items.map(c=>this.extractConcepts(c, parentName));
        } else {
          const conceptNew = concept;
          conceptNew.parentName = parentName;
          return conceptNew;
        }
      }
    },

    render() {
        const data = this.props.data;
        const concepts = data.map(d=>{
          if(d.concepts && d.concepts.length > 0) {
            return (d.concepts.map(concept => {
              return this.extractConcepts(concept, d.categoryName);
            }));
          }
        });

        const flatConcepts = flatten(concepts).filter(c=>defined(c));

        return (<div className={Styles.concepts}>
                      <For each="concept" index="i" of={flatConcepts}>
                        <If condition={concept && concept.isSelectable}>
                                                <button type='button'
                                                        onClick={this.toggleActive.bind(this, concept)}
                                                        className={Styles.btnToggleActive}
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

/**
 * @param  {Array}
 * @return {Array} deep flatten an array
 * @private
 */

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

module.exports = ConceptsSelector;
