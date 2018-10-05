'use strict';

import classNames from 'classnames';
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

    getNonSummaryConcepts(){

    },

    allowMultiple(concept){
      return concept.parent && concept.parent.allowMultiple;
    },

    extractConcepts(concept, parentName){
      if(concept.isVisible && !SummaryConceptModel.prototype.isPrototypeOf(concept)){
        if(concept.activeItems){
          return concept.items.map(c=>this.extractConcepts(c, parentName));
        } else {
          let conceptNew = concept;
          conceptNew.parentName = parentName;
          return conceptNew;
        }
      }
    },

    render() {
      function flatten(arr) {
        return arr.reduce(function (flat, toFlatten) {
          return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
        }, []);
      }
        const data = this.props.data;
        const concepts = data.map(d=>{
          if(d.concepts && d.concepts.length > 0){
            return (d.concepts.map(concept => {
              return this.extractConcepts(concept, d.categoryName);
            }))
          }
        });

        const flatConcepts = flatten(concepts).filter(c=>defined(c));

        console.log(flatConcepts)

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

        // Renders the concept as a standard list of radio buttons or checkboxes (ie. not as an additive-condition).
        // return (
        //     <li>
        //         <If condition={!this.props.hideName && concept.name}>
        //             <div className={classes}>
        //                 <div className={Styles.btnGroup}>
        //                     <If condition={concept.hasChildren}>
        //                         <button type='button'
        //                                 onClick={this.toggleOpen}
        //                                 style={this.getColorStyle()}
        //                                 className={Styles.btnToggleOpen}
        //                                 title='open variable selection'>
        //                                 {concept.isOpen ? <Icon glyph={Icon.GLYPHS.showLess}/> : <Icon glyph={Icon.GLYPHS.showMore}/>}
        //                         </button>
        //                     </If>
        //                     <If condition={concept.isSelectable}>
        //                         <button type='button'
        //                                 onClick={this.toggleActive}
        //                                 style={this.getColorStyle()}
        //                                 className={Styles.btnToggleActive}
        //                                 title='select variable'>
        //                                 {(concept.isActive && allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.checkboxOn}/>}
        //                                 {(!concept.isActive && allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.checkboxOff}/>}
        //                                 {(concept.isActive && !allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.radioOn}/>}
        //                                 {(!concept.isActive && !allowMultiple) && <Icon style={this.getFillStyle()} glyph={Icon.GLYPHS.radioOff}/>}
        //                         </button>
        //                     </If>
        //                 </div>
        //                  {prefix}{' '}{concept.name}
        //             </div>
        //         </If>
        //         <If condition={concept.isOpen}>
        //             <ul className={Styles.items}>
        //                 <For each="child" index="i" of={concept.items.filter(concept => concept.isVisible)}>
        //                     <Concept key={i} parentItem={this.props.parentItem} concept={child} allowMultiple={concept.allowMultiple}/>
        //                 </For>
        //             </ul>
        //         </If>
        //     </li>
    },
});


module.exports = ConceptsSelector;
