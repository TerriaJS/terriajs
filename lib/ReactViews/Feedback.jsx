'use strict';

import React from 'react';

const Feedback = React.createClass({
    getInitialState() {
        return {
            isOpen: false,
            name: '',
            email: '',
            feedback: ''
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

    onSubmit() {
        if(this.state.email.length > 0) {
            // submit form
            this.setState({
                isOpen: false
            });
        }
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
                        <button className='btn btn--close' onClick ={this.onDismiss} title ='close feedback'></button>
                    </div>
                    <form>
                      <label>Your name</label>
                      <input type="text" name = 'name' className="field" value={this.state.name} onChange ={this.handleChange}/>
                      <label>Email Address *</label>
                      <input type="text" name = 'email' className="field" value={this.state.email} onChange ={this.handleChange}/>
                      <label>How can we improve it</label>
                      <textarea className="field" name="feedback" value={this.state.feedback} onChange ={this.handleChange}/>
                      <div className='form__action'>
                        <button type="button" className="btn btn-cancel" onClick ={this.onDismiss} >Cancel</button>
                        <button type="submit" className="btn btn-submit">Submit</button>
                      </div>
                    </form>
            </div>
          </div>
        );
    }
});

module.exports = Feedback;
