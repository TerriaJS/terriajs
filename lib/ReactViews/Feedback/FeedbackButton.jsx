'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import DragWrapper from '../DragWrapper.jsx';
import React from 'react';
import ReactDOM from 'react-dom';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Styles from './feedback-button.scss';
import Icon from "../Icon.jsx";

const FeedbackButton = createReactClass({
    displayName: 'FeedbackButton',
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: PropTypes.object.isRequired
    },

    componentDidMount() {
        /* eslint-disable-next-line react/no-find-dom-node */
         this.node = ReactDOM.findDOMNode(this);
    },

    onClick() {
        if(!this.checkDragging()) {
            this.props.viewState.feedbackFormIsVisible = true;
        }
    },

    checkDragging() {
       return +this.node.getAttribute('data-is-dragging');
    },

    render() {
        const divStyles = {
            position: 'absolute',
            bottom: '100px',
            right: '20px',
            zIndex: 0
        };
        return (
            <DragWrapper styles={divStyles}>
                <div className={Styles.feedback}>
                    <button type='button' className={Styles.btnFeedback} onClick={this.onClick}>
                        <Icon glyph={Icon.GLYPHS.feedback}/>
                        <span>Give feedback</span>
                    </button>
                </div>
            </DragWrapper>
        );
    },
});

module.exports = FeedbackButton;
