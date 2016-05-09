'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import sendFeedback from './../Models/sendFeedback.js';

const Feedback = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isOpen: false,
            isSending: false,
            name: '',
            email: '',
            comment: ''
        };
    },

    onClick() {
        this.setState({
            isOpen: true
        });
    },

    onDismiss() {
        this.setState({
            isOpen: false
        });
    },

    onSubmit(evt) {
        evt.preventDefault();

        if (this.state.comment.length > 0) {
            this.setState({
                isSending: true
            });

            // submit form
            sendFeedback({
                terria: this.props.terria,
                name: this.state.name,
                email: this.state.email,
                comment: this.state.comment
            }).then(succeeded => {
                if (succeeded) {
                    this.setState({
                        isSending: false,
                        isOpen: false,
                        comment: ''
                    });
                } else {
                    this.setState({
                        isSending: false
                    });
                }
            });
        }

        return false;
    },

    handleChange(e) {
        this.setState({
            [e.target.getAttribute('name')]: e.target.value
        });
    },

    render() {
        return (
            <div className='feedback__inner'>
                <button type='button' className='logo btn' onClick={this.onClick}>Give feedback</button>
                <div className={`feedback--form ${this.state.isOpen ? 'is-open' : ''}`}>
                    <div className='form__header'>
                        <h4 className='form--title'>Feedback</h4>
                        <button className='btn btn--close' onClick ={this.onDismiss} title='close feedback'></button>
                    </div>
                    <form onSubmit={this.onSubmit}>
                      <label>Your name (optional)</label>
                      <input type="text" name="name" className="field" value={this.state.name} onChange={this.handleChange}/>
                      <label>Email address (optional)</label>
                      <input type="text" name="email" className="field" value={this.state.email} onChange={this.handleChange}/>
                      <label>Comments</label>
                      <textarea className="field" name="comment" value={this.state.comment} onChange={this.handleChange}/>
                      <div className='form__action'>
                        <button type="button" className="btn btn-cancel" onClick ={this.onDismiss}>Cancel</button>
                        <button type="submit" className="btn btn-submit" disabled={this.state.isSending}>{this.state.isSending ? 'Sending...' : 'Send'}</button>
                      </div>
                    </form>
            </div>
          </div>
        );
    }
});

module.exports = Feedback;
