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
        console.log('click');
    },

    handleChange(e){
        console.log(e.target);
    },

    render() {
        return (
            <div className='feedback__inner'>
                <button type='button' className='logo btn' onClick={this.onClick}>Give feedback</button>
                <div className='feedback--form'>
                    <div className='form__header'>
                        <h4 className='form--title'>Feedback</h4>
                        <button className='btn btn--close' title ='close feedback'></button>
                    </div>
                    <form>
                      <label>Your name</label>
                      <input type="text" className="field" value={this.state.name} onChange ={this.handleChange}/>
                      <label>Email Address *</label>
                      <input type="password" className="field" value={this.state.email} onChange ={this.handleChange}/>
                      <label>How can we improve</label>
                      <textarea className="field" name="feedback" value={this.state.feedback} onChange ={this.handleChange}/>
                      <div className='form__action'>
                        <button type="submit" className="btn btn-cancel">Cancel</button>
                        <button type="reset" className="btn btn-submit">Submit</button>
                      </div>
                    </form>
            </div>
          </div>
        );
    }
});

module.exports = Feedback;
