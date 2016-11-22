'use strict';

// import classNames from 'classnames';
// import Icon from "../../Icon.jsx";
import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import Styles from './concept-choice.scss';

const ConceptChoice = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        concept: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    openConceptChooser() {
        this.props.viewState.conceptChooserIsVisible = true;
    },

    render() {
        const concept = this.props.concept;
        const activeItems = concept.activeItems;
        if (activeItems && activeItems.length > 0) {
            return (
                <div className={Styles.root}>
                    <button type='button'
                            onClick={this.openConceptChooser}
                            className={Styles.btnConceptChoiceHeading}>
                        {concept.name}
                    </button>
                </div>
            );
        }
        if (concept.isActive) {
            return (
                <div className={Styles.root}>
                    <button type='button'
                            onClick={this.openConceptChooser}
                            className={Styles.btnConceptChoice}>
                        {concept.name}
                    </button>
                </div>
            );
        }
        return null;
    }
});

module.exports = ConceptChoice;
