'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

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
            <div className='feedback__inner'>
                <button type='button' className='btn--feedback btn' onClick={this.onClick}>Give feedback</button>
            </div>
        );
    }
});

module.exports = FeedbackButton;
