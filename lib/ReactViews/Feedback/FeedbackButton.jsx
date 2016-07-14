'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import Styles from './feedback-button.scss';
import Icon from "../Icon.jsx";

const FeedbackButton = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired
    },

    onClick() {
        this.props.viewState.feedbackFormIsVisible = true;
    },

    render() {
        return (
            <div className={Styles.feedback}>
                <button type='button' className={Styles.btnFeedback} onClick={this.onClick}>
                    <Icon glyph={Icon.GLYPHS.feedback}/>
                    <span>Give feedback</span>
                </button>
            </div>
        );
    }
});

module.exports = FeedbackButton;
