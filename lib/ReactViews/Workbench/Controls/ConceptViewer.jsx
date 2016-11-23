'use strict';

import AdditiveConditionConcepts from './AdditiveConditionConcepts';
import AdditiveConditionsConcept from '../../../Map/AdditiveConditionsConcept';
import Concept from './Concept';
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './concept-viewer.scss';

const ConceptViewer = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    render() {
        // All non-additive-conditions go in a single section. (If there are none, don't show a <div class=section> so we don't get an extra padding.)
        // Each additive-condition goes in its own section.
        const nonAdditiveConditionConcepts = this.props.item.concepts.filter(concept => concept.isVisible && !AdditiveConditionsConcept.prototype.isPrototypeOf(concept));
        return (
            <div className={Styles.root}>
                <If condition={nonAdditiveConditionConcepts.length > 0}>
                    <div className={Styles.section}>
                        <For each="concept" index="i"
                             of={nonAdditiveConditionConcepts}>
                            <div className={Styles.inner} key={i}>
                                <ul className={Styles.childrenList}>
                                    <Concept concept={concept}/>
                                </ul>
                            </div>
                        </For>
                    </div>
                </If>
                <For each="concept" index="i"
                     of={this.props.item.concepts.filter(concept => concept.isVisible && AdditiveConditionsConcept.prototype.isPrototypeOf(concept))}>
                    <div className={Styles.section} key={i}>
                        <ul className={Styles.childrenList}>
                            <AdditiveConditionConcepts concept={concept}/>
                        </ul>
                    </div>
                </For>
            </div>
        );
    }
});

module.exports = ConceptViewer;
