'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import Styles from './feedback_button.scss';


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
                <button type='button' className={Styles.btnFeedback} onClick={this.onClick}>Give feedback</button>
            </div>
        );
    }
});

module.exports = FeedbackButton;
